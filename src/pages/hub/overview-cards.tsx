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
import { Chip, StatusDot } from "@/components/ui/chip"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState } from "@/components/app/state-views"
import { AREA_ICONS } from "@/data/navigation"
import type { Area, AreaCondition, HubData } from "@/data/types"
import { ApiError } from "@/data/api"
import { pl } from "@/lib/format"
import { cn } from "@/lib/utils"

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

const STATUS_TONE = { ready: "ok", attention: "attention", blocked: "neutral" } as const

/* ------------------------------- Period -------------------------------- */

function PeriodCard({ period }: { period: HubData["period"] }) {
  if (!period) {
    return (
      <section className="glass flex flex-col rounded-[28px] p-6 sm:p-7" aria-labelledby="period-title">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-neutral-tint text-stone">
            <CalendarDays className="size-5" />
          </span>
          <h2 id="period-title" className="text-sm font-semibold text-mute">
            Okres księgowy
          </h2>
        </div>
        <p className="mt-8 font-display text-2xl font-medium tracking-[-0.01em]">Brak okresu księgowego</p>
        <p className="mt-2 max-w-[38ch] text-sm text-mute">
          Okres pojawi się po skonfigurowaniu organizacji. Do tego czasu obszary księgowe pozostają nieaktywne.
        </p>
      </section>
    )
  }
  return (
    <section
      className="glass rounded-[28px] p-6 sm:p-7 lg:flex lg:items-center lg:gap-12 lg:px-8"
      aria-labelledby="period-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 lg:w-56 lg:shrink-0 lg:flex-col lg:items-start lg:gap-3.5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent-tint text-accent">
            <CalendarDays className="size-5" strokeWidth={1.9} />
          </span>
          <h2 id="period-title" className="text-sm font-semibold text-ink-2">
            Okres księgowy
          </h2>
        </div>
        <Chip tone="attention" dot>
          {period.status}
        </Chip>
      </div>
      <p
        className="mt-6 font-display text-[clamp(3.5rem,2.6rem+3vw,5rem)] font-medium leading-[0.9] tracking-[-0.045em] lg:mt-0"
        aria-label={`Okres księgowy ${period.year}`}
      >
        {period.year}
      </p>
      <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-mute text-pretty lg:ml-auto lg:mt-0">
        {period.description}
      </p>
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
          <span className="min-w-0 flex-1 text-[15px] font-semibold">{area.name}</span>
          <Chip tone={STATUS_TONE[area.status]} size="sm" dot className="max-xs:hidden">
            {area.statusLabel}
          </Chip>
          <StatusDot tone={STATUS_TONE[area.status]} className="xs:hidden" />
          <span className="sr-only xs:hidden">{area.statusLabel}</span>
          <ChevronDown className="size-[18px] shrink-0 text-mute transition-transform duration-300 ease-[var(--ease-out-expo)] group-data-[state=open]:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="accordion-content overflow-hidden">
        <div className="pb-4 pl-[3.6rem] pr-2 sm:pl-[4.1rem]">
          <Chip tone={STATUS_TONE[area.status]} size="sm" dot className="mb-1 xs:hidden">
            {area.statusLabel}
          </Chip>
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

export function OverviewCards({
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
  if (error) {
    return (
      <motion.div {...reveal(0.3)} className="glass rounded-[28px]">
        <ErrorState
          icon={ServerCrash}
          title="Nie udało się wczytać obszarów"
          description="Usługa organizacji nie odpowiada. Wyszukiwarka i Rejestry i VAT działają niezależnie od tego bloku."
          code={error instanceof ApiError ? error.code : undefined}
          onRetry={onRetry}
          retrying={retrying}
        />
      </motion.div>
    )
  }

  if (isPending || !data) {
    return (
      <div className="grid gap-4 lg:gap-5" aria-busy="true" aria-label="Wczytywanie obszarów">
        <div className="glass rounded-[28px] p-7">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <Skeleton className="mt-8 h-16 w-44 rounded-2xl" />
          <Skeleton className="mt-5 h-3 w-full max-w-72" />
          <Skeleton className="mt-2.5 h-3 w-56" />
        </div>
        <div className="glass rounded-[28px] p-6">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="mt-3 h-3 w-80 max-w-full" />
          <div className="mt-5 space-y-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3.5 px-3">
                <Skeleton className="size-10" />
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="ml-auto h-6 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data.period && data.areas.length === 0) {
    return (
      <motion.div {...reveal(0.3)} className="glass rounded-[28px]">
        <EmptyState
          icon={Building2}
          title="Organizacja nie ma jeszcze obszarów księgowych"
          description="Obszary i okres księgowy pojawią się po wybraniu formy opodatkowania i skonfigurowaniu organizacji."
        />
      </motion.div>
    )
  }

  return (
    <div className="grid gap-4 lg:gap-5">
      <motion.div {...reveal(0.3)}>
        <PeriodCard period={data.period} />
      </motion.div>
      <motion.div {...reveal(0.38)}>
        <AvailabilityCard areas={data.areas} />
      </motion.div>
    </div>
  )
}
