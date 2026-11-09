import { useEffect, useRef, useState } from "react"
import { Outlet, useLocation } from "react-router"
import { AnimatePresence, motion } from "motion/react"
import { FlaskConical, X } from "lucide-react"
import { GradientBackground } from "@/components/ui/jade-sky"
import { GradientBackgroundNight } from "@/components/ui/jade-night"
import { Segmented } from "@/components/ui/segmented"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TopBar } from "./top-bar"
import { SCENARIOS, useScenario } from "@/lib/scenario"
import { useTheme } from "@/lib/theme"
import { installSheen } from "@/lib/sheen"
import { cn } from "@/lib/utils"

function Backdrop() {
  const { theme } = useTheme()
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10">
      <GradientBackground className={cn("!absolute inset-0 transition-opacity duration-500", theme === "dark" && "opacity-0")} />
      <GradientBackgroundNight
        className={cn("!absolute inset-0 transition-opacity duration-500", theme === "dark" ? "opacity-100" : "opacity-0")}
      />
      <div className="grain absolute inset-0" />
    </div>
  )
}

const SCENARIO_DOT = { data: "bg-ok-dot", empty: "bg-stone", error: "bg-danger-dot" } as const

/**
 * Demo tooling, not product UI: folded into a small capsule so it never sits
 * on top of the data, and morphs open (one glass shape) when needed.
 */
function ScenarioDock() {
  const { scenario, setScenario } = useScenario()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = SCENARIOS.find((s) => s.value === scenario)!

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)] sm:justify-end sm:px-5 sm:pb-5">
      <motion.div
        ref={ref}
        layout
        transition={{ type: "spring", stiffness: 480, damping: 38 }}
        style={{ borderRadius: 999 }}
        className="glass-strong pointer-events-auto flex items-center gap-1 p-1"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="open"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1 pl-2.5"
            >
              <span className="flex items-center gap-2 pr-1 text-[12.5px] font-semibold text-mute">
                <FlaskConical className="size-4 text-accent" strokeWidth={2} />
                <span className="max-[360px]:sr-only">Stan danych</span>
              </span>
              <Segmented
                size="sm"
                label="Stan danych demonstracyjnych"
                value={scenario}
                onChange={setScenario}
                options={SCENARIOS.map((s) => ({ value: s.value, label: s.label }))}
                className="!bg-transparent !shadow-none before:hidden"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zwiń przełącznik stanu"
                className="grid size-8 place-items-center rounded-full text-mute transition-colors hover:bg-fill-hover hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="closed"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.18 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={`Stan danych demonstracyjnych: ${current.label}. Zmień`}
                    className="flex h-8 items-center gap-2 rounded-full pl-2.5 pr-3 text-[12.5px] font-semibold text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <FlaskConical className="size-4 text-accent" strokeWidth={2} />
                    <span className="text-mute">Stan:</span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", SCENARIO_DOT[scenario])} />
                      {current.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Tylko w wersji demo: przełącza ekrany między stanem z danymi, bez danych i z błędem serwera.
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export function AppShell() {
  const { pathname } = useLocation()

  useEffect(() => installSheen(), [])
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="relative min-h-[100dvh]">
      <Backdrop />
      <TopBar />
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-32 sm:px-6 sm:pb-28">
        <Outlet />
      </main>
      <ScenarioDock />
    </div>
  )
}
