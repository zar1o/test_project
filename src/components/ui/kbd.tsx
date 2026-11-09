import { cn } from "@/lib/utils"

export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-fill-sunken px-1.5 font-sans text-[11px] font-semibold text-mute shadow-[inset_0_0_0_1px_var(--hairline)]",
        className,
      )}
    >
      {children}
    </kbd>
  )
}
