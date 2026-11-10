import { cn } from "@/lib/utils"

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={cn("skeleton block h-3", className)} style={style} />
}
