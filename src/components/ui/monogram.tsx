import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"

// Counterparty "logo": a two-letter monogram on a hue derived from the name,
// so the same company always looks the same across lists, search and details.

const HUES = [158, 172, 140, 196, 96, 210, 124, 184]

function hueFor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return HUES[h % HUES.length]
}

export function Monogram({ name, className }: { name: string; className?: string }) {
  const hue = hueFor(name)
  return (
    <span
      aria-hidden
      style={{ "--h": hue } as React.CSSProperties}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold tracking-[0.02em]",
        "bg-[hsl(var(--h)_42%_86%)] text-[hsl(var(--h)_48%_24%)] shadow-[inset_0_0_0_1px_hsl(var(--h)_40%_74%/0.6)]",
        "dark:bg-[hsl(var(--h)_30%_24%)] dark:text-[hsl(var(--h)_50%_84%)] dark:shadow-[inset_0_0_0_1px_hsl(var(--h)_40%_40%/0.5)]",
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
