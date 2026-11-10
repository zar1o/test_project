import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "motion/react"
import { Info } from "lucide-react"
import planet from "@/assets/planet.avif"
import { Chip } from "@/components/ui/chip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchHub } from "@/data/api"
import { USER } from "@/data/fixtures"
import { useMediaQuery } from "@/hooks/use-media-query"
import { whenDeckIdle } from "@/lib/deck"
import { enter } from "@/lib/enter"
import { useScenario } from "@/lib/scenario"
import { cn } from "@/lib/utils"
import { FloatingIcons } from "./floating-icons"
import { GlobalSearch } from "./global-search"
import { Overview } from "./overview-cards"

// The home page: a greeting and the search in the middle, then the cards.
// Everything else follows the register's layout (title in the top bar,
// accent card first).

export function useHubQuery() {
  const { scenario } = useScenario()
  return useQuery({
    queryKey: ["hub", scenario],
    queryFn: ({ signal }) => fetchHub(scenario, signal),
    retry: false,
    staleTime: 60_000,
  })
}

/* ------------------------------- Greeting -------------------------------- */

// The greeting types itself out the first time the home page is shown, and
// only then: coming back to the page finds it already written.
let greeted = false

/** Pause before the next character: people slow down at punctuation. */
function keystroke(previous: string | undefined) {
  if (previous === undefined) return 480
  if (previous === ",") return 260
  if (previous === " ") return 90
  return 58
}

function Greeting() {
  const reduce = useReducedMotion()
  const wide = useMediaQuery("(min-width: 640px)")
  const text = `Witaj, ${wide ? USER.name : USER.name.split(" ")[0]}`
  // Decided once, on mount: is this the showing that gets typed?
  const [typing] = useState(() => !greeted && !reduce)
  const [count, setCount] = useState(typing ? 0 : Number.MAX_SAFE_INTEGER)
  // The first keystroke waits until the cards have been dealt.
  const [onStage, setOnStage] = useState(false)
  const done = count >= text.length

  useEffect(() => {
    let live = true
    void whenDeckIdle().then(() => live && setOnStage(true))
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (done) {
      greeted = true
      return
    }
    if (!onStage) return
    const timer = window.setTimeout(() => setCount((c) => c + 1), keystroke(text[count - 1]))
    return () => window.clearTimeout(timer)
  }, [count, done, onStage, text])

  return (
    <p className="text-balance text-center font-display text-[clamp(2rem,1.4rem+2.7vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.035em]">
      <span className="sr-only">{text}!</span>
      {/* The whole line is laid out from the start and revealed letter by
          letter, so nothing shifts while it types. */}
      <span aria-hidden>
        {text.slice(0, count)}
        {typing && onStage && <span className={cn("greeting-caret", done && "greeting-caret--done")} />}
        <span className="opacity-0">{text.slice(count)}</span>
        <span className={cn("greeting-hand", done && (typing ? "greeting-hand--wave" : "greeting-hand--still"))}>👋</span>
      </span>
    </p>
  )
}

/* --------------------------------- Page ---------------------------------- */

function DemoNotice() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="glass-control inline-flex h-8 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-[12.5px] font-semibold text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Info className="size-3.5 text-accent" strokeWidth={2.2} />
          Mapa zakresu · DEMO
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80 text-sm">
        <p className="font-semibold">Mapa dostępnych obszarów księgowych dla aktywnej organizacji.</p>
        <p className="mt-1 text-mute">
          To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne.
        </p>
      </PopoverContent>
    </Popover>
  )
}

export function HubPage() {
  const hub = useHubQuery()

  useEffect(() => {
    document.title = "Obszary księgowe"
  }, [])

  return (
    <div className="relative">
      <FloatingIcons />

      {/* A rendered image for wide screens, under the cards: a planet towards
          the upper left. */}
      <div
        aria-hidden
        className="no-print pointer-events-none absolute inset-y-0 left-1/2 -z-[1] hidden w-screen -translate-x-1/2 lg:block"
      >
        <img
          src={planet}
          alt=""
          draggable={false}
          className="deco deco-planet absolute -top-3 left-[clamp(10px,3vw,68px)] w-[clamp(150px,14.5vw,224px)] select-none"
        />
      </div>

      <motion.section
        {...enter(0, 10, 0.45)}
        aria-label="Powitanie i wyszukiwarka"
        className="relative z-20 flex flex-col items-center pt-6 sm:pt-9"
      >
        <Greeting />
        {/* Three columns keep the search in the exact middle while the chips
            sit at the right edge. */}
        <div className="mt-5 grid w-full items-center gap-2.5 sm:mt-7 lg:grid-cols-[1fr_minmax(0,560px)_1fr]">
          <span className="max-lg:hidden" />
          <div className="mx-auto w-full max-w-[560px]">
            <GlobalSearch />
          </div>
          <div className="flex items-center justify-center gap-2 lg:justify-end">
            <DemoNotice />
            <Chip tone="outline" className="h-8">
              Ewidencje
            </Chip>
          </div>
        </div>
      </motion.section>

      <div className="mt-5 sm:mt-7">
        <Overview
          data={hub.data}
          isPending={hub.isPending}
          error={hub.error}
          onRetry={() => hub.refetch()}
          retrying={hub.isFetching}
        />
      </div>
    </div>
  )
}
