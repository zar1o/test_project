import { useCallback, useEffect, useState } from "react"
import { CalendarX2, FunnelX, Inbox, SearchX, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState } from "@/components/app/state-views"
import { ApiError, exportRows } from "@/data/api"
import { downloadCsv } from "@/data/csv"
import { REGISTER_NAMES } from "@/data/fixtures"
import { grossOf } from "@/data/register-logic"
import type { RegisterQuery, RegisterResult, SortKey } from "@/data/types"
import { useIsDesktop } from "@/hooks/use-media-query"
import { formatDate, periodLabel, periodLocative, MONTHS_NOMINATIVE, pl } from "@/lib/format"
import { useScenario } from "@/lib/scenario"
import { readStorage, writeStorage } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { ActiveFilters } from "./active-filters"
import { clearedFilters } from "./filters"
import { Pagination } from "./pagination"
import { RegisterHeader } from "./register-header"
import { RegisterList } from "./register-list"
import { DEFAULT_COLUMN_ORDER, RegisterTable } from "./register-table"
import { SummaryCard } from "./summary-card"
import { Toolbar } from "./toolbar"
import { useRegisterData, useRegisterParams } from "./use-register"

const ORDER_KEY = "rejestr.kolumny"

function loadColumnOrder(): SortKey[] {
  try {
    const saved = JSON.parse(readStorage(ORDER_KEY) ?? "null") as SortKey[] | null
    if (
      Array.isArray(saved) &&
      saved.length === DEFAULT_COLUMN_ORDER.length &&
      DEFAULT_COLUMN_ORDER.every((c) => saved.includes(c))
    )
      return saved
  } catch {
    /* corrupt value: fall back to the default order */
  }
  return DEFAULT_COLUMN_ORDER
}

function nearestMonthWithData(data: RegisterResult, year: number, month: number) {
  const target = year * 12 + month
  let best: { year: number; month: number } | null = null
  let bestDist = Infinity
  for (const [y, months] of Object.entries(data.monthsWithData)) {
    for (const m of months) {
      const d = Math.abs(Number(y) * 12 + m - target)
      if (d < bestDist) {
        bestDist = d
        best = { year: Number(y), month: m }
      }
    }
  }
  return best
}

function ListSkeleton({ desktop }: { desktop: boolean }) {
  return (
    <div aria-busy="true" aria-label="Wczytywanie dokumentów" className="px-2 py-2 sm:px-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex h-16 items-center gap-3 border-b border-hairline last:border-b-0">
          <Skeleton className="size-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40 max-w-[60%]" />
            {!desktop && <Skeleton className="h-2.5 w-28" />}
          </div>
          {desktop && (
            <>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-20" />
            </>
          )}
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  )
}

function EmptyBody({
  data,
  query,
  update,
}: {
  data: RegisterResult
  query: RegisterQuery
  update: (p: Partial<RegisterQuery>) => void
}) {
  const hasAnyData = Object.values(data.monthsWithData).some((m) => m.length > 0)
  if (!hasAnyData) {
    return (
      <EmptyState
        icon={Inbox}
        title="Rejestr jest pusty"
        description={`${REGISTER_NAMES[query.register].full} nie zawiera jeszcze dokumentów. Pojawią się tu po wystawieniu faktur lub ich imporcie z KSeF.`}
      />
    )
  }
  if (data.periodTotal === 0) {
    const near = nearestMonthWithData(data, query.year, query.month)
    return (
      <EmptyState
        icon={CalendarX2}
        title={`Brak dokumentów ${periodLocative(query.year, query.month)}`}
        description="W tym miesiącu nie zarejestrowano żadnego dokumentu. Wybierz inny okres — miesiące z dokumentami są oznaczone w wyborze okresu."
        action={
          near && (
            <Button variant="primary" onClick={() => update(near)}>
              Przejdź do: {periodLabel(near.year, near.month)}
            </Button>
          )
        }
      />
    )
  }
  if (query.q) {
    return (
      <EmptyState
        icon={SearchX}
        title={`Brak wyników dla „${query.q}”`}
        description="Sprawdź pisownię albo szukaj po nazwie kontrahenta, numerze dokumentu, identyfikatorze lub numerze KSeF."
        action={
          <Button variant="primary" onClick={() => update({ q: "" })}>
            Wyczyść wyszukiwanie
          </Button>
        }
      />
    )
  }
  return (
    <EmptyState
      icon={FunnelX}
      title="Żaden dokument nie pasuje do filtrów"
      description={`W okresie ${MONTHS_NOMINATIVE[query.month - 1]} ${query.year} jest ${data.periodTotal} ${pl(data.periodTotal, ["dokument", "dokumenty", "dokumentów"])}, ale wybrane filtry wykluczają każdy z nich.`}
      action={
        <Button variant="primary" onClick={() => update(clearedFilters())}>
          <FunnelX />
          Wyczyść filtry
        </Button>
      }
    />
  )
}

/** Print-only: the full filtered register, not just the visible page. */
function PrintTable({ query }: { query: RegisterQuery }) {
  const { scenario } = useScenario()
  const rows = exportRows(query, scenario)
  return (
    <table className="hidden w-full border-collapse text-[10px] print:table">
      <caption className="pb-2 text-left text-sm font-semibold">
        {REGISTER_NAMES[query.register].full} · {periodLabel(query.year, query.month)} · dane demonstracyjne
      </caption>
      <thead>
        <tr className="border-b border-black text-left">
          <th className="py-1">Kontrahent</th>
          <th>Data</th>
          <th>Numer dokumentu</th>
          <th>Numer KSeF</th>
          <th>Identyfikator</th>
          <th className="text-right">Brutto</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <tr key={d.id} className="border-b border-neutral-300">
            <td className="py-1">{d.counterparty}</td>
            <td>{formatDate(d.date)}</td>
            <td>{d.number}</td>
            <td>{d.ksef.state === "confirmed" ? d.ksef.number : "Brak potwierdzenia"}</td>
            <td>{d.identifier}</td>
            <td className="text-right">{(grossOf(d) / 100).toFixed(2).replace(".", ",")} zł</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function RegisterPage() {
  const { query, docId, update, setDoc } = useRegisterParams()
  const result = useRegisterData(query)
  const { scenario } = useScenario()
  const isDesktop = useIsDesktop()
  const [columnOrder, setColumnOrder] = useState<SortKey[]>(loadColumnOrder)

  useEffect(() => {
    document.title = "Rejestry i VAT"
  }, [])

  const changeColumnOrder = useCallback((order: SortKey[]) => {
    setColumnOrder(order)
    writeStorage(ORDER_KEY, JSON.stringify(order))
  }, [])

  const data = result.data
  const error = result.isError ? result.error : null
  const dimmed = result.isFetching && result.isPlaceholderData
  const hasRows = !!data && !error && data.total > 0

  let body: React.ReactNode
  if (error) {
    body = (
      <ErrorState
        icon={ServerCrash}
        title="Nie udało się wczytać rejestru"
        description="Serwer rejestru VAT nie odpowiada. Twoje filtry zostały zachowane — spróbuj ponownie za chwilę."
        code={error instanceof ApiError ? error.code : undefined}
        onRetry={() => result.refetch()}
        retrying={result.isFetching}
      />
    )
  } else if (!data) {
    body = <ListSkeleton desktop={isDesktop} />
  } else if (data.total === 0) {
    body = <EmptyBody data={data} query={query} update={update} />
  } else if (isDesktop) {
    body = (
      <RegisterTable
        rows={data.rows}
        query={query}
        onSort={(sort) => update({ sort })}
        columnOrder={columnOrder}
        onColumnOrderChange={changeColumnOrder}
        expandedId={docId}
        onToggle={(id) => setDoc(docId === id ? null : id)}
        dimmed={dimmed}
      />
    )
  } else {
    body = <RegisterList rows={data.rows} openId={docId} onOpen={setDoc} dimmed={dimmed} />
  }

  return (
    <div>
      <RegisterHeader
        register={query.register}
        onRegisterChange={(register) => update({ register, jpk: "all", series: [] })}
      />

      <div className="mt-6 sm:mt-8">
        <SummaryCard
          register={query.register}
          data={data}
          isPending={result.isPending}
          isError={!!error}
          periodText={`${MONTHS_NOMINATIVE[query.month - 1]} ${query.year}`}
        />
      </div>

      <div className="mt-6 sm:mt-8">
        <Toolbar
          query={query}
          update={update}
          monthsWithData={data?.monthsWithData}
          resultCount={error ? undefined : data?.total}
          canExport={hasRows}
          onExport={() => downloadCsv(exportRows(query, scenario), query)}
          onPrint={() => window.print()}
          columnsCustomized={columnOrder.join() !== DEFAULT_COLUMN_ORDER.join()}
          onResetColumns={() => changeColumnOrder(DEFAULT_COLUMN_ORDER)}
        />
        <ActiveFilters query={query} update={update} />
      </div>

      <section
        aria-label={REGISTER_NAMES[query.register].full}
        aria-busy={result.isFetching}
        className="glass relative mt-4 overflow-hidden rounded-[28px] p-2 print:hidden sm:p-3 lg:p-4"
      >
        <div
          aria-hidden
          className={cn(
            "progress-bar pointer-events-none absolute inset-x-8 top-0 h-[2px] overflow-hidden rounded-full transition-opacity duration-300",
            dimmed ? "opacity-100" : "opacity-0",
          )}
        />
        {body}
        {hasRows && (
          <div className="mt-2">
            <Pagination
              page={data.page}
              pageCount={data.pageCount}
              size={query.size}
              total={data.total}
              onPage={(page) => update({ page })}
              onSize={(size) => update({ size })}
            />
          </div>
        )}
      </section>

      <PrintTable query={query} />
    </div>
  )
}
