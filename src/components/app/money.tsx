import { useEffect, useRef } from "react"
import { animate, useReducedMotion } from "motion/react"
import { moneyParts } from "@/lib/format"
import { cn } from "@/lib/utils"

// Revolut money typography: the whole złoty carries the weight, the grosze
// sit smaller beside it. With `animate`, a change rolls to the new value
// instead of snapping, so a filter change reads as a change.

const sizes = {
  xl: { int: "text-[clamp(2.6rem,1.9rem+3vw,4.25rem)] tracking-[-0.035em]", frac: "text-[0.5em] tracking-[-0.01em]" },
  lg: { int: "text-[clamp(1.5rem,1.25rem+1vw,1.95rem)] tracking-[-0.025em]", frac: "text-[0.62em]" },
  md: { int: "tracking-[-0.005em]", frac: "text-[0.86em]" },
} as const

export function Money({
  grosze,
  size = "md",
  animateChanges = false,
  className,
  muted,
}: {
  grosze: number
  size?: keyof typeof sizes
  animateChanges?: boolean
  className?: string
  muted?: boolean
}) {
  const intRef = useRef<HTMLSpanElement>(null)
  const fracRef = useRef<HTMLSpanElement>(null)
  const prev = useRef(grosze)
  const reduce = useReducedMotion()
  const p = moneyParts(grosze)
  const display = size === "md" ? "font-sans font-semibold" : "font-display font-medium"

  useEffect(() => {
    const from = prev.current
    prev.current = grosze
    if (!animateChanges || reduce || from === grosze) return
    const controls = animate(from, grosze, {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        const parts = moneyParts(Math.round(v))
        if (intRef.current) intRef.current.textContent = parts.sign + parts.integer
        if (fracRef.current) fracRef.current.textContent = parts.fraction
      },
    })
    return () => controls.stop()
  }, [grosze, animateChanges, reduce])

  return (
    <span
      className={cn(
        "tnum inline-flex items-baseline whitespace-nowrap leading-none",
        size === "md" && "text-base",
        display,
        muted && "text-mute",
        className,
      )}
      aria-label={`${p.sign}${p.integer}${p.fraction} ${p.currency}`}
    >
      <span aria-hidden ref={intRef} className={sizes[size].int}>
        {p.sign}
        {p.integer}
      </span>
      <span aria-hidden className={cn(sizes[size].int, "inline-flex items-baseline")}>
        <span ref={fracRef} className={sizes[size].frac}>
          {p.fraction}
        </span>
        <span className={cn(sizes[size].frac, "ml-[0.28em] text-mute")}>{p.currency}</span>
      </span>
    </span>
  )
}
