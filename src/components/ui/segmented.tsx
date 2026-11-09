import { useId } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

// A glass capsule whose active "lens" slides between options. The lens is a
// shared layout element, so it morphs instead of jumping.

export interface SegmentOption<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  ariaLabel?: string
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: SegmentOption<T>[]
  className?: string
  size?: "sm" | "md"
  label: string
}) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("glass-control inline-flex rounded-full p-1", className)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
        e.preventDefault()
        const i = options.findIndex((o) => o.value === value)
        const next = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        const el = e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)
        el?.focus()
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            data-value={o.value}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent",
              size === "md" ? "h-10 px-4 text-sm [&_svg]:size-[18px]" : "h-8 px-3 text-[13px] [&_svg]:size-4",
              active ? "text-ink" : "text-mute hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.9 }}
                className="absolute inset-0 rounded-full bg-[var(--glass-control-hover)] shadow-[0_1px_2px_rgb(18_64_48/0.08),0_4px_12px_-6px_rgb(18_64_48/0.3),inset_0_1px_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-edge)] dark:bg-white/14"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {o.icon}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
