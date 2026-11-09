import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { flushSync } from "react-dom"
import { writeStorage } from "./storage"

export type Theme = "light" | "dark"

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const Ctx = createContext<ThemeCtx | null>(null)

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark"
    const apply = () => {
      flushSync(() => setTheme(next))
      document.documentElement.dataset.theme = next
      writeStorage("theme", next)
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (doc.startViewTransition && !reduce) doc.startViewTransition(apply)
    else apply()
  }, [])

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
