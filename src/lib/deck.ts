// Deck transition between pages.
//
// Leaving a page, every glass surface on screen is replaced by a blank card
// that flies to the middle and stacks into one deck. The route swaps while
// the deck rests, then the cards are dealt out to the surfaces of the new
// page and hand over to them as they land. A card is a bare pane of glass.
//
// The cards are stand-ins, not the real elements: they carry no content, so
// they can change size freely, and the pages need no markup for this — a
// "card" is any top-level `.glass` / `.glass-control` / `.card-accent` in <main>.
//
// The same deal opens the app: on the first visit the page is held back, a
// deck is stacked card by card in the middle, and then dealt (`introDeck`).
// index.html arms this before the first paint so the page never shows first.
//
// The order of events matters for smoothness. Cards animate width/height, so
// they run on the main thread; React mounts the next page only while the deck
// is at rest, where a dropped frame cannot be seen.

const SURFACE = ".glass, .glass-control, .card-accent, .card-chrome"

/** All timings in ms. One place to retune the feel of the transition. */
const T = {
  gather: 300,
  gatherStagger: 12,
  squareUp: 90,
  deal: 400,
  dealStagger: 24,
  handover: 150,
  /** Opening the app: one card after another drops onto the deck. */
  introDrop: 380,
  introStagger: 62,
  introHold: 150,
  /** Longest the deck waits for the next page's data before dealing anyway. */
  settle: 380,
  /** If the route never arrives, give the page back. */
  watchdog: 5000,
}

const EASE_GATHER = "cubic-bezier(0.55, 0, 0.2, 1)"
const EASE_DEAL = "cubic-bezier(0.2, 0.85, 0.25, 1)"
const EASE_OUT = "cubic-bezier(0.25, 1, 0.5, 1)"
const MAX_CARDS = 14

type Phase = "idle" | "gather" | "held" | "deal"

interface Box {
  x: number
  y: number
  w: number
  h: number
  r: number
  rot: number
}

interface Card {
  el: HTMLDivElement
  box: Box
}

// index.html sets data-deck="held" before the first paint when the opening
// deal is going to play. The page then mounts under it, like after a gather.
let opening = typeof document !== "undefined" && document.documentElement.dataset.deck === "held"
let phase: Phase = opening ? "held" : "idle"
/** True while the opening deck is being stacked; nothing else may deal then. */
let stacking = false
let idleWaiters: (() => void)[] = []
let layer: HTMLDivElement | null = null
let cards: Card[] = []
let animations: Animation[] = []
let run = 0
let watchdog = 0

const root = () => document.documentElement
const mainEl = () => document.querySelector<HTMLElement>("main")

export function deckEnabled() {
  return (
    typeof document !== "undefined" &&
    typeof Element.prototype.animate === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/** True while a page is mounting under the deck: pages skip their own entrance. */
export function deckArriving() {
  return phase === "held" || phase === "deal"
}

/** Resolves when no transition is in flight (at once, if none is). */
export function whenDeckIdle(): Promise<void> {
  if (phase === "idle") return Promise.resolve()
  return new Promise((resolve) => idleWaiters.push(resolve))
}

function frames(n: number) {
  return new Promise<void>((resolve) => {
    const step = () => (n-- <= 0 ? resolve() : requestAnimationFrame(step))
    step()
  })
}

function track(a: Animation) {
  animations.push(a)
  return a
}

const done = (a: Animation) => a.finished.then(
  () => {},
  () => {},
)

/** Top-level glass surfaces that are on screen right now, in reading order. */
function surfaces(): HTMLElement[] {
  const main = mainEl()
  if (!main) return []
  const vh = window.innerHeight
  const out: HTMLElement[] = []
  for (const el of main.querySelectorAll<HTMLElement>(SURFACE)) {
    if (el.parentElement?.closest(SURFACE)) continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > vh) continue
    out.push(el)
    if (out.length === MAX_CARDS) break
  }
  return out
}

function boxOf(el: HTMLElement): Box {
  const r = el.getBoundingClientRect()
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
  return { x: r.left, y: r.top, w: r.width, h: r.height, r: Math.min(radius, r.width / 2, r.height / 2), rot: 0 }
}

/** Where card `i` of `n` sits in the deck. The top card lies straight. */
function slot(i: number, n: number): Box {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = Math.round(Math.min(Math.max(vw * 0.46, 164), 248))
  const h = Math.round(w * 0.64)
  // Cheap deterministic scatter, so the pile looks hand-stacked but stable.
  const wobble = (seed: number) => {
    const v = Math.sin((i + 1) * seed) * 43758.5453
    return (v - Math.floor(v)) * 2 - 1
  }
  const top = i === n - 1
  return {
    x: vw / 2 - w / 2 + (top ? 0 : wobble(12.9898) * 5),
    y: Math.max(vh * 0.44, 150) - h / 2 - i * 1.6,
    w,
    h,
    r: 22,
    rot: top ? 0 : wobble(78.233) * 5,
  }
}

const frame = (b: Box): Keyframe => ({
  transform: `translate(${b.x}px, ${b.y}px) rotate(${b.rot}deg)`,
  width: `${b.w}px`,
  height: `${b.h}px`,
  borderRadius: `${b.r}px`,
})

function place(card: Card, b: Box) {
  card.box = b
  Object.assign(card.el.style, frame(b))
}

function makeCard(b: Box): Card {
  const el = document.createElement("div")
  el.className = "deck-card"
  const card = { el, box: b }
  place(card, b)
  return card
}

function ensureLayer() {
  if (layer) return layer
  layer = document.createElement("div")
  layer.className = "deck-layer"
  layer.setAttribute("aria-hidden", "true")
  document.body.append(layer)
  return layer
}

function cleanup() {
  window.clearTimeout(watchdog)
  for (const a of animations) a.cancel()
  animations = []
  layer?.remove()
  layer = null
  cards = []
  delete root().dataset.deck
  const main = mainEl()
  if (main) main.inert = false
  phase = "idle"
  opening = false
  stacking = false
  const waiting = idleWaiters
  idleWaiters = []
  for (const resolve of waiting) resolve()
}

/** Drop whatever is in flight and show the page as it is. */
export function abortDeck() {
  run++
  cleanup()
}

/**
 * Collect the current page into the deck. Resolves when the deck is at rest
 * and the page is hidden, i.e. when it is safe to swap the route.
 */
export async function gatherDeck(): Promise<void> {
  if (!deckEnabled()) return
  abortDeck()
  const my = run
  phase = "gather"
  root().dataset.deck = "gather"

  const main = mainEl()
  const sources = surfaces()
  const host = ensureLayer()
  const n = sources.length
  if (main) main.inert = true

  cards = sources.map((el) => makeCard(boxOf(el)))
  host.append(...cards.map((c) => c.el))

  // The page dissolves under the cards; the cards themselves fade in fast
  // enough that each surface appears to simply go blank.
  if (main) track(main.animate({ opacity: [1, 0] }, { duration: 170, easing: "ease-out", fill: "forwards" }))

  let last: Animation | undefined
  cards.forEach((card, i) => {
    const to = slot(i, n)
    const delay = i * T.gatherStagger
    track(card.el.animate({ opacity: [0, 1] }, { duration: 110, fill: "backwards" }))
    last = track(
      card.el.animate([frame(card.box), frame(to)], { duration: T.gather, delay, easing: EASE_GATHER, fill: "both" }),
    )
    card.box = to
  })

  if (last) await done(last)
  else await frames(10)
  if (my !== run) return

  // Square the deck up: the scatter relaxes, like tapping a pile on the table.
  cards.forEach((card) => {
    const from = card.box
    const to = { ...from, rot: from.rot * 0.35 }
    last = track(card.el.animate([frame(from), frame(to)], { duration: T.squareUp, easing: EASE_OUT, fill: "both" }))
    card.box = to
  })
  if (last) await done(last)
  if (my !== run) return

  // Freeze the end state in plain styles so the animations can be released.
  for (const card of cards) place(card, card.box)
  for (const a of animations) a.cancel()
  animations = []

  phase = "held"
  root().dataset.deck = "held"
  watchdog = window.setTimeout(() => {
    if (my === run && phase === "held") abortDeck()
  }, T.watchdog)
}

/**
 * The opening of the app: stack a deck in the middle, card by card, then deal
 * it onto the first page. Does nothing unless index.html armed it.
 */
export async function introDeck(ready: () => boolean = () => true): Promise<void> {
  if (!opening || phase !== "held") return
  opening = false
  if (!deckEnabled()) return cleanup()
  stacking = true
  const my = run
  const main = mainEl()
  if (main) main.inert = true
  // If anything below stalls, the page must still come back.
  watchdog = window.setTimeout(() => {
    if (my === run && phase === "held") abortDeck()
  }, T.watchdog)

  // The page is already mounted under the deck; give it a moment to lay out,
  // then stack as many cards as it has surfaces, so every card finds a place.
  await frames(2)
  if (my !== run) return
  const n = Math.min(10, Math.max(5, surfaces().length || 7))
  const host = ensureLayer()
  cards = Array.from({ length: n }, (_, i) => makeCard(slot(i, n)))
  host.append(...cards.map((c) => c.el))

  let last: Animation | undefined
  cards.forEach((card, i) => {
    const to = card.box
    // Each card comes down from just above, slightly turned, and settles.
    const from = { ...to, y: to.y - 38, rot: to.rot + (i % 2 ? 8 : -8) }
    const delay = i * T.introStagger
    track(card.el.animate({ opacity: [0, 1] }, { duration: 200, delay, easing: "ease-out", fill: "both" }))
    last = track(
      card.el.animate([{ ...frame(from), transform: `${frame(from).transform} scale(0.9)` }, frame(to)], {
        duration: T.introDrop,
        delay,
        easing: EASE_OUT,
        fill: "both",
      }),
    )
  })
  if (last) await done(last)
  await new Promise((resolve) => window.setTimeout(resolve, T.introHold))
  if (my !== run) return
  // The cards already carry their resting place as plain styles.
  for (const a of animations) a.cancel()
  animations = []

  stacking = false
  await dealDeck(ready)
}

/**
 * Deal the deck onto the page that has just mounted. `ready` reports whether
 * the page's data has landed, so cards are dealt to surfaces of final size.
 */
export async function dealDeck(ready: () => boolean = () => true): Promise<void> {
  if (phase !== "held" || stacking) return
  const my = run
  window.clearTimeout(watchdog)

  await frames(2)
  const waitingSince = performance.now()
  while (my === run && !ready() && performance.now() - waitingSince < T.settle) await frames(1)
  // One more frame for React to commit what the data brought.
  await frames(2)
  if (my !== run) return

  const main = mainEl()
  const targets = surfaces()
  const host = ensureLayer()

  // Top the deck up when the new page has more surfaces than the old one.
  // Extra cards go to the bottom of the pile, where they are not seen arriving.
  while (cards.length < targets.length) {
    const card = makeCard(slot(0, targets.length))
    host.prepend(card.el)
    cards.unshift(card)
  }

  phase = "deal"
  root().dataset.deck = "deal"
  if (main) track(main.animate({ opacity: [0, 1] }, { duration: 280, easing: "ease-out", fill: "backwards" }))

  const flights: Animation[] = []
  targets.forEach((el, j) => {
    // Deal from the top of the deck.
    const card = cards[cards.length - 1 - j]
    const to = boxOf(el)
    const delay = j * T.dealStagger
    const land = delay + T.deal * 0.7
    track(card.el.animate([frame(card.box), frame(to)], { duration: T.deal, delay, easing: EASE_DEAL, fill: "both" }))
    // Hand over: the real surface comes up through the card as it lands.
    track(el.animate({ opacity: [0, 1] }, { duration: T.handover, delay: land, easing: "ease-out", fill: "both" }))
    flights.push(
      track(
        card.el.animate(
          { opacity: [1, 0] },
          { duration: T.handover + 70, delay: land + 40, easing: "ease-out", fill: "both" },
        ),
      ),
    )
  })

  // Cards with nowhere to go sink back and fade.
  cards.slice(0, Math.max(0, cards.length - targets.length)).forEach((card) => {
    flights.push(track(card.el.animate({ opacity: [1, 0] }, { duration: 200, easing: "ease-out", fill: "both" })))
  })

  // Wait on the animations themselves, so a throttled or slowed page still
  // finishes the deal before the stand-ins are removed.
  await Promise.all(flights.map(done))
  if (my !== run) return
  cleanup()
}
