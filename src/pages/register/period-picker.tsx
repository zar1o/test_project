import { useState } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Segmented } from "@/components/ui/segmented"
import { YEARS } from "@/data/fixtures"
import { MONTHS_NOMINATIVE, MONTHS_SHORT, capitalize, periodLabel } from "@/lib/format"
import { cn } from "@/lib/utils"

// "Rok" and "Miesiąc" from the source screen, merged into one control: the
// period is a single idea, so it gets a single chip. Dots mark months that
// hold documents, so nobody has to guess their way into an empty month.

export function PeriodPicker({
  year,
  month,
  monthsWithData,
  onChange,
  className,
}: {
  year: number
  month: number
  monthsWithData: Record<number, number[]> | undefined
  onChange: (p: { year: number; month: number }) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(year)

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setViewYear(year)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Okres: ${periodLabel(year, month)}. Zmień rok lub miesiąc`}
          className={cn(
            "glass-control sheen inline-flex h-12 items-center gap-2.5 rounded-full pl-4 pr-3.5 text-[14.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]",
            className,
          )}
        >
          <CalendarDays className="size-[18px] text-accent" strokeWidth={2} />
          <span className="truncate max-xs:hidden">{periodLabel(year, month)}</span>
          <span className="truncate capitalize xs:hidden">
            {MONTHS_SHORT[month - 1]} {year}
          </span>
          <ChevronDown className="ml-auto size-4 text-mute" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-mute" id="year-label">
            Rok
          </p>
        </div>
        <Segmented
          size="sm"
          label="Rok"
          value={String(viewYear)}
          onChange={(v) => setViewYear(Number(v))}
          options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          className="mt-2 w-full"
        />
        <p className="mt-4 text-xs font-semibold text-mute">Miesiąc</p>
        <div role="radiogroup" aria-label="Miesiąc" className="mt-2 grid grid-cols-4 gap-1.5">
          {MONTHS_SHORT.map((m, i) => {
            const value = i + 1
            const selected = viewYear === year && value === month
            const hasData = monthsWithData?.[viewYear]?.includes(value)
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${capitalize(MONTHS_NOMINATIVE[i])} ${viewYear}${hasData ? ", są dokumenty" : ""}`}
                onClick={() => {
                  onChange({ year: viewYear, month: value })
                  setOpen(false)
                }}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center rounded-[14px] text-[13.5px] font-semibold capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                  selected
                    ? "bg-primary text-on-primary"
                    : hasData
                      ? "text-ink hover:bg-fill-hover"
                      : "font-medium text-stone hover:bg-fill-hover",
                )}
              >
                {m}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-mute">Wyszarzone miesiące nie zawierają dokumentów.</p>
      </PopoverContent>
    </Popover>
  )
}
