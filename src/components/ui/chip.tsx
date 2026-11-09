import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold leading-none",
  {
    variants: {
      tone: {
        attention: "bg-warn-tint text-warn",
        ok: "bg-ok-tint text-ok",
        danger: "bg-danger-tint text-danger",
        neutral: "bg-neutral-tint text-ink-2",
        accent: "bg-accent-tint text-accent",
        outline: "text-ink-2 shadow-[inset_0_0_0_1px_var(--hairline-strong)]",
      },
      size: {
        sm: "h-6 px-2.5 text-[11.5px]",
        md: "h-7 px-3 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
)

const dotTone = {
  attention: "bg-warn-dot",
  ok: "bg-ok-dot",
  danger: "bg-danger-dot",
  neutral: "bg-stone",
  accent: "bg-accent",
  outline: "bg-stone",
} as const

export interface ChipProps extends React.ComponentProps<"span">, VariantProps<typeof chipVariants> {
  dot?: boolean
}

export function Chip({ className, tone, size, dot, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ tone, size }), className)} {...props}>
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", dotTone[tone ?? "neutral"])} />}
      {children}
    </span>
  )
}

export function StatusDot({ tone, className }: { tone: keyof typeof dotTone; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 rounded-full", dotTone[tone], className)} />
}
