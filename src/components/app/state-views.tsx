import { motion } from "motion/react"
import { RotateCw, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Shared empty and error states. Each one says what happened, why, and the
// one action that gets the user moving again.

function Glyph({ icon: Icon, tone }: { icon: LucideIcon; tone: "neutral" | "danger" }) {
  return (
    <div
      className={cn(
        "relative grid size-16 place-items-center rounded-[22px]",
        tone === "danger" ? "bg-danger-tint text-danger" : "bg-accent-tint text-accent",
      )}
    >
      <span aria-hidden className="absolute inset-0 rounded-[22px] shadow-[inset_0_1px_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-edge)]" />
      <Icon className="size-7" strokeWidth={1.75} />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      className={cn("flex flex-col items-center px-6 py-14 text-center", className)}
    >
      <Glyph icon={icon} tone="neutral" />
      <h3 className="mt-5 font-display text-xl font-medium tracking-[-0.01em] text-balance">{title}</h3>
      {description && <p className="mt-2 max-w-[42ch] text-sm text-mute text-pretty">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </motion.div>
  )
}

export function ErrorState({
  icon,
  title,
  description,
  code,
  onRetry,
  retrying,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  code?: string
  onRetry: () => void
  retrying?: boolean
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      role="alert"
      className={cn("flex flex-col items-center px-6 py-14 text-center", className)}
    >
      <Glyph icon={icon} tone="danger" />
      <h3 className="mt-5 font-display text-xl font-medium tracking-[-0.01em] text-balance">{title}</h3>
      <p className="mt-2 max-w-[44ch] text-sm text-mute text-pretty">{description}</p>
      {code && <p className="tnum mt-1.5 text-xs text-stone">Kod błędu: {code}</p>}
      <Button variant="primary" className="mt-6" onClick={onRetry} disabled={retrying}>
        <RotateCw className={cn(retrying && "animate-spin")} />
        {retrying ? "Ponawiam…" : "Spróbuj ponownie"}
      </Button>
    </motion.div>
  )
}
