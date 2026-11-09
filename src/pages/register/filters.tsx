import { useId } from "react"
import { FunnelX, SlidersHorizontal, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogTrigger, SheetContent } from "@/components/ui/dialog"
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Segmented } from "@/components/ui/segmented"
import { JPK_CODES, LABELS, SERIES } from "@/data/fixtures"
import { activeFilterCount } from "@/data/register-logic"
import type { RegisterQuery } from "@/data/types"
import { useIsMobile } from "@/hooks/use-media-query"
import { pl } from "@/lib/format"
import { cn } from "@/lib/utils"

// Secondary filters from the source screen (Rodzaj operacji, Kod JPK V7,
// Serie dokumentów, plus the tag action as Etykiety) live behind one button.
// They apply instantly; the footer only reports the outcome.

type Patch = Partial<RegisterQuery>

function ToggleChip({
  pressed,
  onClick,
  children,
  title,
  role,
}: {
  pressed: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
  role?: "radio"
}) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : pressed}
      aria-checked={role ? pressed : undefined}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold outline-none transition-[background-color,color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.97]",
        pressed
          ? "bg-primary text-on-primary"
          : "bg-fill text-ink shadow-[inset_0_0_0_1px_var(--hairline)] hover:bg-fill-hover",
      )}
    >
      {children}
    </button>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
      <p id={id} className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-mute">
        {icon}
        {title}
      </p>
      {children}
    </div>
  )
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

export function clearedFilters(): Patch {
  return { op: "all", jpk: "all", series: [], labels: [] }
}

function FilterFields({ query, onChange }: { query: RegisterQuery; onChange: (p: Patch) => void }) {
  const jpkOptions = [
    { value: "all", label: "Wszystkie", hint: "" },
    { value: "none", label: "Bez oznaczeń", hint: "Dokumenty bez kodu JPK V7" },
    ...JPK_CODES[query.register],
  ]
  return (
    <div className="space-y-4">
      <Section title="Rodzaj operacji">
        <Segmented
          size="sm"
          label="Rodzaj operacji"
          value={query.op}
          onChange={(op) => onChange({ op })}
          className="w-full"
          options={[
            { value: "all", label: "Wszystkie" },
            { value: "faktura", label: "Faktury" },
            { value: "korekta", label: "Korekty" },
          ]}
        />
      </Section>
      <Section title="Kod JPK V7">
        <div role="radiogroup" aria-label="Kod JPK V7" className="flex flex-wrap gap-2">
          {jpkOptions.map((o) => (
            <ToggleChip
              key={o.value}
              role="radio"
              pressed={query.jpk === o.value}
              title={o.hint || undefined}
              onClick={() => onChange({ jpk: o.value })}
            >
              {o.label}
            </ToggleChip>
          ))}
        </div>
      </Section>
      <Section title="Serie dokumentów">
        <div className="flex flex-wrap gap-2">
          {SERIES[query.register].map((s) => (
            <ToggleChip
              key={s.value}
              pressed={query.series.includes(s.value)}
              onClick={() => onChange({ series: toggle(query.series, s.value) })}
            >
              {s.label}
            </ToggleChip>
          ))}
        </div>
      </Section>
      <Section title="Etykiety" icon={<Tag className="size-3.5" />}>
        <div className="flex flex-wrap gap-2">
          {LABELS.map((l) => (
            <ToggleChip
              key={l.id}
              pressed={query.labels.includes(l.id)}
              onClick={() => onChange({ labels: toggle(query.labels, l.id) })}
            >
              {l.name}
            </ToggleChip>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Footer({
  count,
  canClear,
  onClear,
  Close,
}: {
  count: number | undefined
  canClear: boolean
  onClear: () => void
  Close: typeof PopoverClose | typeof DialogClose
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
      <Button variant="ghost" size="md" onClick={onClear} disabled={!canClear} className="-ml-2">
        <FunnelX />
        Wyczyść filtry
      </Button>
      <Close asChild>
        <Button variant="primary" size="md" className="tnum">
          {count === undefined ? "Gotowe" : `Pokaż ${count} ${pl(count, ["dokument", "dokumenty", "dokumentów"])}`}
        </Button>
      </Close>
    </div>
  )
}

export function FiltersButton({
  query,
  onChange,
  resultCount,
  className,
}: {
  query: RegisterQuery
  onChange: (p: Patch) => void
  resultCount: number | undefined
  className?: string
}) {
  const isMobile = useIsMobile()
  const active = activeFilterCount(query)

  const trigger = (
    <button
      type="button"
      aria-label={active ? `Filtry, aktywne: ${active}` : "Filtry"}
      className={cn(
        "glass-control sheen inline-flex h-12 items-center gap-2 rounded-full px-4 text-[14.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]",
        className,
      )}
    >
      <SlidersHorizontal className="size-[18px]" strokeWidth={2} />
      Filtry
      {active > 0 && (
        <span className="tnum grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary">
          {active}
        </span>
      )}
    </button>
  )

  const footer = (Close: typeof PopoverClose | typeof DialogClose) => (
    <Footer count={resultCount} canClear={active > 0} onClear={() => onChange(clearedFilters())} Close={Close} />
  )

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <SheetContent title="Filtry" description="Zmiany stosujemy od razu.">
          <FilterFields query={query} onChange={onChange} />
          <div className="mt-5">{footer(DialogClose)}</div>
        </SheetContent>
      </Dialog>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-5">
        <FilterFields query={query} onChange={onChange} />
        <div className="mt-5">{footer(PopoverClose)}</div>
      </PopoverContent>
    </Popover>
  )
}
