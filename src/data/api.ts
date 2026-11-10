import type { Scenario } from "@/lib/scenario"
import { DOCUMENTS, HUB } from "./fixtures"
import {
  dailyOf,
  filterDocs,
  grossOf,
  matchesText,
  monthlyOf,
  monthsWithData,
  previousPeriod,
  ratesOf,
  sortDocs,
  totalsOf,
} from "./register-logic"
import type { HubData, RegisterQuery, RegisterResult, SearchResult, VatDocument } from "./types"

// Mock API with real latency, so loading states are genuine rather than
// staged. The demo scenario decides whether a call succeeds, returns an
// empty organisation, or fails.

export class ApiError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

function source(scenario: Scenario): VatDocument[] {
  return scenario === "empty" ? [] : DOCUMENTS
}

export async function fetchHub(scenario: Scenario, signal?: AbortSignal): Promise<HubData> {
  await wait(650, signal)
  if (scenario === "error") throw new ApiError("ORG-503", "Usługa organizacji nie odpowiada.")
  if (scenario === "empty") return { organization: HUB.organization, period: null, areas: [] }
  return HUB
}

export async function fetchRegister(
  q: RegisterQuery,
  scenario: Scenario,
  signal?: AbortSignal,
): Promise<RegisterResult> {
  await wait(520, signal)
  if (scenario === "error") throw new ApiError("VAT-503", "Serwer rejestru VAT nie odpowiada.")
  const all = source(scenario)
  const { period, filtered } = filterDocs(all, q)
  const sorted = sortDocs(filtered, q.sort)
  const pageCount = Math.max(1, Math.ceil(sorted.length / q.size))
  const page = Math.min(q.page, pageCount)
  const before = previousPeriod(q.year, q.month)
  const earlier = filterDocs(all, { ...q, ...before })
  return {
    rows: sorted.slice((page - 1) * q.size, page * q.size),
    total: sorted.length,
    periodTotal: period.length,
    totals: totalsOf(filtered),
    byRate: ratesOf(q.register, filtered),
    daily: dailyOf(filtered, q.year, q.month),
    monthly: monthlyOf(all, q),
    previous: earlier.period.length ? { ...before, gross: totalsOf(earlier.filtered).gross } : null,
    monthsWithData: monthsWithData(all, q.register),
    page,
    pageCount,
  }
}

/** Everything matching the current filters, unpaged: feeds CSV export and print. */
export function exportRows(q: RegisterQuery, scenario: Scenario) {
  return sortDocs(filterDocs(source(scenario), q).filtered, q.sort)
}

export async function searchDocuments(
  term: string,
  scenario: Scenario,
  signal?: AbortSignal,
): Promise<SearchResult> {
  await wait(220, signal)
  if (scenario === "error") throw new ApiError("SRCH-503", "Wyszukiwarka jest chwilowo niedostępna.")
  const hits = source(scenario)
    .filter((d) => matchesText(d, term))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  return {
    documents: hits.slice(0, 6).map((doc) => ({ doc, gross: grossOf(doc) })),
    documentCount: hits.length,
  }
}
