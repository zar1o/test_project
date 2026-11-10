import { Accordion } from "radix-ui"
import { motion } from "motion/react"
import {
  Building2,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  ServerCrash,
} from "lucide-react"
import { Chip } from "@/components/ui/chip"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState } from "@/components/app/state-views"
import { AREA_ICONS } from "@/data/navigation"
import type { Area, AreaCondition, HubData } from "@/data/types"
import { ApiError } from "@/data/api"
import { enter } from "@/lib/enter"
import sparkle from "@/assets/sparkle.avif"
import { AreaRail } from "./area-rail"
import { iconHover } from "./icon-hover"
import { pl } from "@/lib/format"
import { cn } from "@/lib/utils"

// A status is told by the colour of its capsule (or of its text, where there
// is no room for a capsule) and by its words. No dot beside it.
const STATUS_TONE = { ready: "ok", attention: "attention", blocked: "neutral" } as const
const STATUS_TEXT = { ready: "text-ok", attention: "text-warn", blocked: "text-mute" } as const

/* ------------------------------- Period -------------------------------- */

// The accent card of the hub, as the gross total is on the register.

function PeriodCard({ period, className }: { period: HubData["period"]; className?: string }) {
  if (!period) {
    return (
      <section className={cn("glass flex flex-col rounded-[28px] p-5 sm:p-6", className)} aria-labelledby="period-title">
        <h2 id="period-title" className="text-[13px] font-semibold text-ink-2">
          Okres księgowy
        </h2>
        <p className="mt-6 font-display text-2xl font-medium tracking-[-0.01em]">Brak okresu księgowego</p>
        <p className="mt-2 max-w-[38ch] text-sm text-mute text-pretty">
          Okres pojawi się po skonfigurowaniu organizacji. Do tego czasu obszary księgowe pozostają nieaktywne.
        </p>
      </section>
    )
  }
  return (
    <section
      className={cn("card-accent flex flex-col rounded-[28px] p-5 sm:p-6", className)}
      aria-labelledby="period-title"
      {...iconHover("okres")}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="period-title" className="flex min-h-7 items-center text-[13px] font-semibold">
          Okres księgowy
        </h2>
        {/* The 3D calendar hangs here, over the glow of the card. */}
        <span data-float="okres" aria-hidden className="-mr-2 -mt-3 grid size-[84px] shrink-0 place-items-center">
          <CalendarDays className="size-7" strokeWidth={1.7} />
        </span>
      </div>
      <p
        className="-mt-11 font-display text-[clamp(3.4rem,2.6rem+2.4vw,4.6rem)] font-medium leading-[0.9] tracking-[-0.04em]"
        aria-label={`Okres księgowy ${period.year}`}
      >
        {period.year}
      </p>
      <p className="mt-3.5 inline-flex h-7 w-fit items-center rounded-full bg-[rgb(6_6_28/0.32)] px-3 text-xs font-semibold">
        {period.status}
      </p>
      <p className="mt-auto max-w-[42ch] pt-4 text-[13px] leading-relaxed text-mute text-pretty">{period.description}</p>
    </section>
  )
}

/* ---------------------------- Availability ----------------------------- */

const CONDITION_ICON = {
  ok: { icon: CircleCheck, className: "text-ok" },
  attention: { icon: CircleAlert, className: "text-warn" },
  missing: { icon: CircleDashed, className: "text-stone" },
} as const

function Condition({ c }: { c: AreaCondition }) {
  const { icon: Icon, className } = CONDITION_ICON[c.state]
  return (
    <li className="flex gap-3 py-2">
      <Icon className={cn("mt-0.5 size-[18px] shrink-0", className)} strokeWidth={2} />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold leading-snug">{c.label}</span>
        <span className="block text-[13px] leading-snug text-mute">{c.note}</span>
      </span>
    </li>
  )
}

function AreaRow({ area }: { area: Area }) {
  const Icon = AREA_ICONS[area.id]
  return (
    <Accordion.Item value={area.id} className="border-t border-hairline first:border-t-0 lg:[&:nth-child(2)]:border-t-0">
      <Accordion.Header>
        <Accordion.Trigger className="group flex min-h-16 w-full items-center gap-3.5 rounded-2xl px-2 py-2.5 text-left outline-none transition-colors hover:bg-fill focus-visible:ring-2 focus-visible:ring-accent sm:px-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-ink-2 shadow-[inset_0_0_0_1px_var(--hairline)]">
            {Icon && <Icon className="size-[18px]" strokeWidth={1.9} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">{area.name}</span>
            {/* On the narrowest screens the capsule does not fit beside the
                name, so the status goes under it as a line of text. */}
            <span className={cn("mt-0.5 block text-xs font-semibold xs:hidden", STATUS_TEXT[area.status])}>
              {area.statusLabel}
            </span>
          </span>
          <Chip tone={STATUS_TONE[area.status]} size="sm" className="max-xs:hidden">
            {area.statusLabel}
          </Chip>
          <ChevronDown className="size-[18px] shrink-0 text-mute transition-transform duration-300 ease-[var(--ease-out-expo)] group-data-[state=open]:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="accordion-content overflow-hidden">
        <div className="pb-4 pl-[3.6rem] pr-2 sm:pl-[4.1rem]">
          <ul>
            {area.conditions.map((c) => (
              <Condition key={c.label} c={c} />
            ))}
          </ul>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

function AvailabilityCard({ areas }: { areas: Area[] }) {
  const attention = areas.filter((a) => a.status === "attention").length
  const blocked = areas.filter((a) => a.status === "blocked").length
  const ready = areas.filter((a) => a.status === "ready").length
  return (
    <section className="glass rounded-[28px] p-4 sm:p-6" aria-labelledby="availability-title">
      <div className="px-2 pt-2 sm:px-1 sm:pt-1">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h2 id="availability-title" className="font-display text-[22px] font-medium tracking-[-0.01em]">
            Dostępność obszarów
          </h2>
          <p className="tnum text-[13px] font-medium text-mute">
            {ready} z {areas.length} {pl(areas.length, ["gotowy", "gotowe", "gotowych"])} · {attention}{" "}
            {pl(attention, ["wymaga", "wymagają", "wymaga"])} uwagi · {blocked} bez warunków
          </p>
        </div>
        <p className="mt-1.5 max-w-[60ch] text-[13.5px] text-mute text-pretty">
          Status pokazuje gotowość warunków, ale nie uruchamia księgowania ani operacji zewnętrznych.
        </p>
      </div>
      <Accordion.Root type="multiple" className="mt-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
        {areas.map((a) => (
          <AreaRow key={a.id} area={a} />
        ))}
      </Accordion.Root>
    </section>
  )
}

/* ------------------------------ Composite ------------------------------ */

/** Free-floating 3D pieces: the anchors only say where, the scene draws them. */
function Float({ id, className }: { id: string; className: string }) {
  return <span data-float={id} aria-hidden className={cn("pointer-events-none absolute", className)} />
}

export function Overview({
  data,
  isPending,
  error,
  onRetry,
  retrying,
}: {
  data: HubData | undefined
  isPending: boolean
  error: Error | null
  onRetry: () => void
  retrying: boolean
}) {
  const loading = !error && (isPending || !data)
  const blank = !!data && !data.period && data.areas.length === 0

  return (
    <>
      <div className="relative grid gap-3 lg:grid-cols-12">
        {loading ? (
          <div className="glass rounded-[28px] p-6 lg:col-span-4" aria-busy="true" aria-label="Wczytywanie okresu">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-6 h-16 w-44 rounded-2xl" />
            <Skeleton className="mt-5 h-6 w-36" />
            <Skeleton className="mt-7 h-3 w-full max-w-64" />
          </div>
        ) : error ? (
          <section className="glass flex flex-col rounded-[28px] p-5 sm:p-6 lg:col-span-4" aria-label="Okres księgowy">
            <h2 className="text-[13px] font-semibold text-ink-2">Okres księgowy</h2>
            <p className="mt-6 font-display text-5xl font-medium leading-none text-stone">—</p>
            <p className="mt-auto pt-4 text-[13px] text-mute">Okres jest chwilowo niedostępny.</p>
          </section>
        ) : (
          <motion.div {...enter(0.08, 12)} className="grid lg:col-span-4">
            <PeriodCard period={data!.period} />
          </motion.div>
        )}

        <motion.div {...enter(0.14, 12)} className="relative grid lg:col-span-8">
          <AreaRail areas={data?.areas} />
          {/* The sparkle rides the lower corner of the rail, the one corner with
              nothing in it; on a wide screen it moves out into the margin. */}
          <img
            src={sparkle}
            alt=""
            aria-hidden
            draggable={false}
            className="deco deco-sparkle no-print pointer-events-none absolute -bottom-12 -right-5 z-10 size-[88px] select-none sm:-bottom-14 sm:-right-8 sm:size-[124px] xl:-right-[98px]"
          />
          <Float id="pearl-a" className="-top-2 right-[124px] size-5 max-sm:hidden" />
        </motion.div>

        <Float id="ring" className="-bottom-5 -left-3 size-9 sm:-left-6 sm:size-11" />
      </div>

      <div className="relative mt-3">
        {error ? (
          <motion.div {...enter(0.2, 12)} className="glass rounded-[28px]">
            <ErrorState
              icon={ServerCrash}
              title="Nie udało się wczytać obszarów"
              description="Usługa organizacji nie odpowiada. Wyszukiwarka i Rejestry i VAT działają niezależnie od tego bloku."
              code={error instanceof ApiError ? error.code : undefined}
              onRetry={onRetry}
              retrying={retrying}
            />
          </motion.div>
        ) : loading ? (
          <div className="glass rounded-[28px] p-6" aria-busy="true" aria-label="Wczytywanie obszarów">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="mt-3 h-3 w-80 max-w-full" />
            <div className="mt-5 space-y-5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3.5 px-3">
                  <Skeleton className="size-10" />
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="ml-auto h-6 w-28" />
                </div>
              ))}
            </div>
          </div>
        ) : blank ? (
          <motion.div {...enter(0.2, 12)} className="glass rounded-[28px]">
            <EmptyState
              icon={Building2}
              title="Organizacja nie ma jeszcze obszarów księgowych"
              description="Obszary i okres księgowy pojawią się po wybraniu formy opodatkowania i skonfigurowaniu organizacji."
            />
          </motion.div>
        ) : (
          <motion.div {...enter(0.2, 12)}>
            <AvailabilityCard areas={data!.areas} />
          </motion.div>
        )}
      </div>
    </>
  )
}
