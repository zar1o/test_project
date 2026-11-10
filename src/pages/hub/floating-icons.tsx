import { useEffect, useRef, useState } from "react"
import { onIconHover } from "./icon-hover"

/**
 * The canvas for the hub's 3D glass objects. It lies over the whole hub, above
 * the cards and under anything that opens (search results, popovers), takes no
 * pointer events and is hidden from assistive technology.
 *
 * The scene places its objects on the elements marked `data-float` in the hub
 * (see floating-icons/scene.ts). three.js and the scene load after the page is
 * interactive; if WebGL is missing, the flat icons in those elements stay.
 */
export function FloatingIcons() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = canvas.current
    const root = wrap.current?.parentElement
    if (!el || !root) return
    let cancelled = false
    let dispose = () => {}
    let stopListening = () => {}

    const start = () => {
      void import("./floating-icons/scene")
        .then(({ mountFloatingIcons }) => {
          if (cancelled) return
          const scene = mountFloatingIcons(el, root, {
            reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            onReady: () => setReady(true),
          })
          dispose = scene.dispose
          stopListening = onIconHover(scene.hover)
        })
        .catch(() => {
          /* no WebGL, or the chunk failed to load: the hub works without it */
        })
    }

    // Let the page paint and settle first.
    const idle = window.requestIdleCallback?.(start, { timeout: 1200 })
    const timer = idle === undefined ? window.setTimeout(start, 300) : 0

    return () => {
      cancelled = true
      if (idle !== undefined) window.cancelIdleCallback?.(idle)
      window.clearTimeout(timer)
      stopListening()
      dispose()
    }
  }, [])

  return (
    <div
      ref={wrap}
      aria-hidden
      className="floating-icons no-print pointer-events-none absolute -top-4 left-1/2 z-10 h-[640px] w-screen -translate-x-1/2"
      data-ready={ready}
    >
      <canvas ref={canvas} className="block size-full" />
    </div>
  )
}
