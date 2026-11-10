import { Link } from "react-router"
import { ArrowUpRight, Lock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AREA_NAV } from "@/data/navigation"
import type { Area } from "@/data/types"
import { cn } from "@/lib/utils"
import { hoverIcon, iconHover } from "./icon-hover"

// The way into the working areas: one rail, four stops. Each stop carries its
// 3D object — the span marked data-float is where the scene hangs it, and the
// flat icon inside is what shows until (or unless) the scene is drawing.

// A status is a line of coloured text here, not a chip: a stop can be narrow,
// and the line may wrap where a capsule would spill into the next stop.
const STATUS = { ready: "text-ok", attention: "text-warn", blocked: "text-mute" } as const

const stop =
  "group relative flex h-full min-h-[184px] w-full flex-col rounded-[22px] p-4 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent sm:min-h-[204px]"

export function AreaRail({ areas, className }: { areas: Area[] | undefined; className?: string }) {
  return (
    <nav aria-label="Obszary" className={cn("glass rounded-[28px] p-2", className)}>
      <ul className="grid h-full grid-cols-2 sm:grid-cols-4">
        {AREA_NAV.map((item) => {
          const status = areas?.find((a) => a.id === item.statusId)
          const body = (
            <>
              <span data-float={item.id} aria-hidden className="grid size-[76px] place-items-center sm:size-[88px]">
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-2xl",
                    item.to ? "accent-fill" : "bg-neutral-tint text-stone",
                  )}
                >
                  <item.icon className="size-[22px]" strokeWidth={1.9} />
                </span>
              </span>
              <span className={cn("mt-auto pt-3 text-[15px] font-semibold", !item.to && "text-mute")}>{item.label}</span>
              <span className="mt-1 block min-h-8 text-xs font-semibold leading-4">
                {item.to ? (
                  status && <span className={STATUS[status.status]}>{status.statusLabel}</span>
                ) : (
                  <span className="font-medium text-stone">Poza wersją demo</span>
                )}
              </span>
              {item.to ? (
                <ArrowUpRight className="absolute right-4 top-4 size-[18px] text-mute transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
              ) : (
                <Lock className="absolute right-4 top-4 size-4 text-stone" strokeWidth={2.1} />
              )}
            </>
          )
          return (
            <li
              key={item.id}
              className="border-hairline max-sm:[&:nth-child(even)]:border-l max-sm:[&:nth-child(n+3)]:border-t sm:[&:not(:first-child)]:border-l"
            >
              {item.to ? (
                <Link
                  to={item.to}
                  className={cn(stop, "hover:bg-fill active:scale-[0.99]")}
                  aria-label={status ? `${item.label}, status: ${status.statusLabel}` : item.label}
                  onPointerEnter={() => {
                    prefetchRegister()
                    hoverIcon(item.id)
                  }}
                  onPointerLeave={() => hoverIcon(null)}
                  onFocus={() => {
                    prefetchRegister()
                    hoverIcon(item.id)
                  }}
                  onBlur={() => hoverIcon(null)}
                  onTouchStart={prefetchRegister}
                >
                  {body}
                </Link>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" aria-disabled="true" className={stop} {...iconHover(item.id)}>
                      {body}
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
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Warm the register chunk as soon as the user shows intent. */
export function prefetchRegister() {
  void import("@/pages/register/register-page")
}
