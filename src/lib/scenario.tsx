import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"

// Demo-only switch that forces the mock API into one of the states the brief
// asks for. Real usage reaches the same states naturally (empty month, no
// search hits); this just makes them one click away for reviewers.

export type Scenario = "data" | "empty" | "error"

export const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "data", label: "Dane" },
  { value: "empty", label: "Pusto" },
  { value: "error", label: "Błąd" },
]

interface ScenarioCtx {
  scenario: Scenario
  setScenario: (s: Scenario) => void
}

const Ctx = createContext<ScenarioCtx | null>(null)

function initial(): Scenario {
  const p = new URLSearchParams(window.location.search).get("stan")
  if (p === "pusto") return "empty"
  if (p === "blad") return "error"
  return "data"
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, set] = useState<Scenario>(initial)
  const qc = useQueryClient()

  const setScenario = useCallback(
    (s: Scenario) => {
      set(s)
      // Drop cached answers so every visible block re-requests in the new state.
      qc.removeQueries()
    },
    [qc],
  )

  return <Ctx.Provider value={{ scenario, setScenario }}>{children}</Ctx.Provider>
}

export function useScenario() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useScenario must be used inside ScenarioProvider")
  return ctx
}
