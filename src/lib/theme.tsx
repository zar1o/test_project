import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { flushSync } from "react-dom"
import { writeStorage } from "./storage"

/** Dark is the app's own look; light is the visitor's choice, kept in storage. */
export type Theme = "light" | "dark"

const STORAGE_KEY = "motyw"
/** The colour the browser tints its own chrome with, per theme. */
const CHROME = { dark: "#06061C", light: "#E9E5FF" } as const

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
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", CHROME[next])
      writeStorage(STORAGE_KEY, next)
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
