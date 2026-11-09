import { Link } from "react-router"
import { motion } from "motion/react"
import { ArrowUpRight, Lock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StatusDot } from "@/components/ui/chip"
import { AREA_NAV } from "@/data/navigation"
import type { Area } from "@/data/types"
import { cn } from "@/lib/utils"

const pill =
  "glass-control sheen group inline-flex h-12 items-center gap-2.5 rounded-full pl-2 pr-4.5 text-[14.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.97]"

export function AreaPills({ areas }: { areas: Area[] | undefined }) {
  return (
    <nav aria-label="Obszary" className="flex flex-wrap justify-center gap-2.5">
      {AREA_NAV.map((item, i) => {
        const status = areas?.find((a) => a.id === item.statusId)
        const content = (
          <>
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full",
                item.to ? "bg-accent-tint text-accent" : "bg-neutral-tint text-stone",
              )}
            >
              <item.icon className="size-[17px]" strokeWidth={2} />
            </span>
            <span className={cn(!item.to && "text-mute")}>{item.label}</span>
            {item.to ? (
              <>
                {status && status.status !== "ready" && (
                  <StatusDot tone="attention" className="-ml-0.5" />
                )}
                <ArrowUpRight className="-mr-1 size-4 text-mute transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </>
            ) : (
              <Lock className="-mr-1 size-3.5 text-stone" strokeWidth={2.2} />
            )}
          </>
        )

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {item.to ? (
              <Link
                to={item.to}
                onPointerEnter={prefetchRegister}
                onFocus={prefetchRegister}
                onTouchStart={prefetchRegister}
                className={pill}
                aria-label={status ? `${item.label}, status: ${status.statusLabel}` : item.label}
              >
                {content}
              </Link>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-disabled="true" className={cn(pill, "shadow-none [&]:bg-[var(--glass-control)]/60")}>
                    {content}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" className="w-72 text-sm">
                  <p className="font-semibold">{item.label}: niedostępne w wersji demo</p>
                  <p className="mt-1 text-mute">
                    Prototyp obejmuje tylko obszar Rejestry i VAT. Pozostałe obszary pojawią się w kolejnych etapach.
                  </p>
                </PopoverContent>
              </Popover>
            )}
          </motion.div>
        )
      })}
    </nav>
  )
}

/** Warm the register chunk as soon as the user shows intent. */
export function prefetchRegister() {
  void import("@/pages/register/register-page")
}
