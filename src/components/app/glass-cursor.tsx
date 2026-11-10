import { useEffect, useRef } from "react"

// A cursor made of glass: a small exact point, and a lens that trails it like
// a drop of water — stretching in the direction it travels, swelling over
// anything that can be pressed, narrowing to a bar over text fields.
//
// It replaces the system cursor only for a mouse or pen, only once the pointer
// has actually moved, and never when reduced motion is requested. If this
// component fails to mount, the system cursor is simply never hidden.

const ACTION =
  'a[href], button:not(:disabled), summary, label, select, [role="button"], [role="radio"], [role="tab"], [role="menuitem"], [role="menuitemradio"], [role="option"], [cmdk-item]'
const TEXT =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]'

export function GlassCursor() {
  const lens = useRef<HTMLDivElement>(null)
  const point = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const L = lens.current
    const P = point.current
    if (!L || !P) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const root = document.documentElement
    let x = 0
    let y = 0
    let lx = 0
    let ly = 0
    let on = false
    let frame = 0
    let last = 0

    const setState = (state: "default" | "action" | "text") => {
      if (L.dataset.state === state) return
      L.dataset.state = state
      P.dataset.state = state
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      // The lens closes most of the gap each frame, at any frame rate.
      const pull = 1 - Math.exp(-dt * 17)
      const dx = (x - lx) * pull
      const dy = (y - ly) * pull
      lx += dx
      ly += dy
      // Stretch along the direction of travel, like a drop: turn to the
      // heading, scale, turn back — so the lens itself never rotates.
      const stretch = Math.min(0.3, Math.hypot(dx, dy) / dt / 2800)
      const heading = Math.atan2(dy, dx)
      L.style.transform = `translate3d(${lx}px, ${ly}px, 0) rotate(${heading}rad) scale(${1 + stretch}, ${1 - stretch * 0.55}) rotate(${-heading}rad)`
      if (Math.abs(x - lx) + Math.abs(y - ly) > 0.1) frame = requestAnimationFrame(tick)
      else {
        frame = 0
        last = 0
        L.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    }

    const show = () => {
      if (on) return
      on = true
      lx = x
      ly = y
      root.classList.add("glass-cursor-on")
    }
    const hide = () => {
      if (!on) return
      on = false
      root.classList.remove("glass-cursor-on")
    }

    const onMove = (e: PointerEvent) => {
      // A finger on a touch screen brings the system's own behaviour back.
      if (e.pointerType === "touch") return hide()
      x = e.clientX
      y = e.clientY
      show()
      const target = e.target as Element | null
      setState(target?.closest?.(TEXT) ? "text" : target?.closest?.(ACTION) ? "action" : "default")
      P.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const onDown = () => (L.dataset.down = "true")
    const onUp = () => (L.dataset.down = "false")

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("blur", hide)
    root.addEventListener("mouseleave", hide)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("blur", hide)
      root.removeEventListener("mouseleave", hide)
      cancelAnimationFrame(frame)
      hide()
    }
  }, [])

  return (
    <div aria-hidden className="glass-cursor no-print">
      <div ref={lens} className="glass-cursor__lens" data-state="default">
        <span />
      </div>
      <div ref={point} className="glass-cursor__point" data-state="default" />
    </div>
  )
}
