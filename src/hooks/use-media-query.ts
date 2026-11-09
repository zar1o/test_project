import { useSyncExternalStore } from "react"

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", notify)
      return () => mql.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Desktop table layout starts at 1024px; below it the register is a list. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)")
export const useIsMobile = () => useMediaQuery("(max-width: 767px)")
