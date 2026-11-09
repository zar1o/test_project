import { useEffect, useRef, useState } from "react"
import {
  ArrowDownWideNarrow,
  Columns3,
  Download,
  Ellipsis,
  Printer,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { RegisterQuery, SortKey } from "@/data/types"
import { useIsMobile } from "@/hooks/use-media-query"
import { useDebounced } from "@/hooks/use-debounced"
import { cn } from "@/lib/utils"
import { FiltersButton } from "./filters"
import { PeriodPicker } from "./period-picker"

export const SORT_OPTIONS: { value: string; label: string; sort: RegisterQuery["sort"] }[] = [
  { value: "date", label: "Data: od najstarszych", sort: null },
  { value: "-date", label: "Data: od najnowszych", sort: { id: "date", desc: true } },
  { value: "counterparty", label: "Kontrahent: A–Z", sort: { id: "counterparty", desc: false } },
  { value: "number", label: "Numer dokumentu", sort: { id: "number", desc: false } },
  { value: "identifier", label: "Identyfikator", sort: { id: "identifier", desc: false } },
  { value: "ksef", label: "Numer KSeF", sort: { id: "ksef", desc: false } },
  { value: "-gross", label: "Brutto: od najwyższej", sort: { id: "gross", desc: true } },
  { value: "gross", label: "Brutto: od najniższej", sort: { id: "gross" as SortKey, desc: false } },
]

function sortValue(sort: RegisterQuery["sort"]) {
  if (!sort) return "date"
  return `${sort.desc ? "-" : ""}${sort.id}`
}

/** Debounced search: the URL updates once typing pauses. */
function RegisterSearch({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [text, setText] = useState(value)
  const debounced = useDebounced(text, 250)
  const lastSent = useRef(value)

  useEffect(() => {
    // External changes (clear-all, a deep link) win over the local draft.
    if (value !== lastSent.current) {
      lastSent.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    if (debounced !== lastSent.current) {
      lastSent.current = debounced
      onChange(debounced)
    }
  }, [debounced, onChange])

  return (
    <label className="glass-control sheen flex h-12 w-full min-w-0 shrink-0 items-center gap-2.5 rounded-full pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-accent md:w-auto md:flex-1">
      <Search className="size-[18px] shrink-0 text-mute" strokeWidth={2} />
      <span className="sr-only">Szukaj w rejestrze</span>
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && text) {
            e.preventDefault()
            setText("")
          }
        }}
        placeholder="Szukaj kontrahenta, numeru, KSeF…"
        enterKeyHint="search"
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none"
      />
      {text && (
        <button
          type="button"
          aria-label="Wyczyść wyszukiwanie"
          onClick={() => setText("")}
          className="grid size-9 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-fill hover:text-ink"
        >
          <X className="size-[17px]" />
        </button>
      )}
    </label>
  )
}

export function Toolbar({
  query,
  update,
  monthsWithData,
  resultCount,
  canExport,
  onExport,
  onPrint,
  columnsCustomized,
  onResetColumns,
}: {
  query: RegisterQuery
  update: (p: Partial<RegisterQuery>) => void
  monthsWithData: Record<number, number[]> | undefined
  resultCount: number | undefined
  canExport: boolean
  onExport: () => void
  onPrint: () => void
  columnsCustomized: boolean
  onResetColumns: () => void
}) {
  const isMobile = useIsMobile()

  const more = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="icon" className="size-12" aria-label="Więcej akcji">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {isMobile && (
          <>
            <DropdownMenuItem disabled={!canExport} onSelect={onExport}>
              <Download />
              Eksportuj CSV
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowDownWideNarrow />
                Sortuj
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={sortValue(query.sort)}
                  onValueChange={(v) => update({ sort: SORT_OPTIONS.find((o) => o.value === v)?.sort ?? null })}
                >
                  {SORT_OPTIONS.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        <DropdownMenuItem disabled={!canExport} onSelect={onPrint}>
          <Printer />
          Drukuj rejestr
        </DropdownMenuItem>
        {!isMobile && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tabela</DropdownMenuLabel>
            <DropdownMenuItem disabled={!columnsCustomized} onSelect={onResetColumns}>
              <Columns3 />
              Przywróć kolejność kolumn
            </DropdownMenuItem>
            <p className="px-3 pb-2 pt-0.5 text-xs leading-snug text-mute">
              Przeciągnij nagłówek kolumny, aby zmienić jej miejsce.
            </p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="no-print flex flex-col gap-2.5 md:flex-row md:items-center">
      <RegisterSearch value={query.q} onChange={(q) => update({ q })} />
      <div className="flex items-center gap-2.5">
        <PeriodPicker
          year={query.year}
          month={query.month}
          monthsWithData={monthsWithData}
          onChange={(p) => update(p)}
          className={cn(isMobile && "min-w-0 flex-1")}
        />
        <FiltersButton query={query} onChange={update} resultCount={resultCount} />
        {!isMobile && (
          <Button variant="glass" className="h-12 px-4 text-[14.5px]" onClick={onExport} disabled={!canExport}>
            <Download strokeWidth={2} />
            <span className="max-lg:sr-only">Eksportuj</span>
          </Button>
        )}
        {more}
      </div>
    </div>
  )
}
