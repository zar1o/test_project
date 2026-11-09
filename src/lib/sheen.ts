// One delegated listener drives the pointer sheen on every `.sheen` surface.
// It writes CSS variables straight to the element, so hovering never causes a
// React render.

export function installSheen() {
  if (typeof window === "undefined") return () => {}
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {}

  let frame = 0
  let last: PointerEvent | null = null

  const apply = () => {
    frame = 0
    if (!last) return
    const target = (last.target as Element | null)?.closest?.(".sheen") as HTMLElement | null
    if (!target) return
    const r = target.getBoundingClientRect()
    target.style.setProperty("--mx", `${last.clientX - r.left}px`)
    target.style.setProperty("--my", `${last.clientY - r.top}px`)
  }

  const onMove = (e: PointerEvent) => {
    last = e
    if (!frame) frame = requestAnimationFrame(apply)
  }

  window.addEventListener("pointermove", onMove, { passive: true })
  return () => {
    window.removeEventListener("pointermove", onMove)
    if (frame) cancelAnimationFrame(frame)
  }
}
