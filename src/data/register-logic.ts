import { DEFAULT_PERIOD, REGISTER_RATES } from "./fixtures"
import type {
  DayTotal,
  MonthTotal,
  RateTotal,
  RegisterKind,
  RegisterQuery,
  SortKey,
  Totals,
  VatDocument,
} from "./types"

// Pure register logic: filtering, sorting, totals, paging, and the mapping
// between the query and the URL. The mock API and the CSV export share it,
// so what you see, what you count and what you download always agree.

export const PAGE_SIZES = [10, 25, 50] as const

export const DEFAULT_QUERY: RegisterQuery = {
  register: "sprzedaz",
  year: DEFAULT_PERIOD.year,
  month: DEFAULT_PERIOD.month,
  op: "all",
  jpk: "all",
  series: [],
  labels: [],
  q: "",
  sort: null,
  page: 1,
  size: 10,
}

export function grossOf(doc: VatDocument) {
  return doc.lines.reduce((s, l) => s + l.net + l.vat, 0)
}

export function totalsOf(docs: VatDocument[]): Totals {
  let net = 0
  let vat = 0
  for (const d of docs) for (const l of d.lines) {
    net += l.net
    vat += l.vat
  }
  return { net, vat, gross: net + vat }
}

export function ratesOf(register: RegisterKind, docs: VatDocument[]): RateTotal[] {
  const map = new Map<string, RateTotal>()
  for (const r of REGISTER_RATES[register]) map.set(r, { rate: r, net: 0, vat: 0 })
  for (const d of docs) for (const l of d.lines) {
    const t = map.get(l.rate) ?? { rate: l.rate, net: 0, vat: 0 }
    t.net += l.net
    t.vat += l.vat
    map.set(l.rate, t)
  }
  return [...map.values()]
}

/** One entry per calendar day of the month, including days with no documents. */
export function dailyOf(docs: VatDocument[], year: number, month: number): DayTotal[] {
  const days = new Date(year, month, 0).getDate()
  const out: DayTotal[] = Array.from({ length: days }, (_, i) => ({ day: i + 1, net: 0, vat: 0, count: 0 }))
  for (const d of docs) {
    if (!inPeriod(d, year, month)) continue
    const slot = out[Number(d.date.slice(8, 10)) - 1]
    if (!slot) continue
    slot.count += 1
    for (const l of d.lines) {
      slot.net += l.net
      slot.vat += l.vat
    }
  }
  return out
}

/** The twelve months of the query's year, each under the query's own filters. */
export function monthlyOf(all: VatDocument[], q: RegisterQuery): MonthTotal[] {
  return Array.from({ length: 12 }, (_, i) => {
    const { filtered } = filterDocs(all, { ...q, month: i + 1 })
    const { net, vat } = totalsOf(filtered)
    return { month: i + 1, net, vat, count: filtered.length }
  })
}

export function previousPeriod(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

/** Case- and diacritic-insensitive: "zloty klos" finds "Złoty Kłos". */
export function normalize(s: string) {
  return s
    .toLocaleLowerCase("pl-PL")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
}

export function matchesText(doc: VatDocument, term: string) {
  const t = normalize(term)
  if (!t) return true
  const hay = normalize(
    [doc.counterparty, doc.number, doc.identifier, doc.ksef.state === "confirmed" ? doc.ksef.number : ""].join(" "),
  )
  return t.split(/\s+/).every((part) => hay.includes(part))
}

export function inPeriod(doc: VatDocument, year: number, month: number) {
  const [y, m] = doc.date.split("-").map(Number)
  return y === year && m === month
}

export function filterDocs(all: VatDocument[], q: RegisterQuery) {
  const period = all.filter((d) => d.register === q.register && inPeriod(d, q.year, q.month))
  const filtered = period.filter((d) => {
    if (q.op !== "all" && d.operation !== q.op) return false
    if (q.jpk === "none" && d.jpk.length > 0) return false
    if (q.jpk !== "all" && q.jpk !== "none" && !d.jpk.includes(q.jpk)) return false
    if (q.series.length && !q.series.includes(d.series)) return false
    if (q.labels.length && !q.labels.some((l) => d.labels.includes(l))) return false
    return matchesText(d, q.q)
  })
  return { period, filtered }
}

const collator = new Intl.Collator("pl-PL", { numeric: true, sensitivity: "base" })

const sortValue: Record<SortKey, (d: VatDocument) => string | number> = {
  counterparty: (d) => d.counterparty,
  date: (d) => d.date,
  number: (d) => d.number,
  ksef: (d) => (d.ksef.state === "confirmed" ? `1${d.ksef.number}` : "0"),
  identifier: (d) => d.identifier,
  gross: grossOf,
}

export function sortDocs(docs: VatDocument[], sort: RegisterQuery["sort"]) {
  // Default order is the register's natural order: by date, then by number.
  const key = sort?.id ?? "date"
  const dir = sort?.desc ? -1 : 1
  const get = sortValue[key]
  return [...docs].sort((a, b) => {
    const va = get(a)
    const vb = get(b)
    const c = typeof va === "number" && typeof vb === "number" ? va - vb : collator.compare(String(va), String(vb))
    return c !== 0 ? c * dir : collator.compare(a.number, b.number)
  })
}

export function monthsWithData(all: VatDocument[], register: RegisterKind) {
  const out: Record<number, number[]> = {}
  for (const d of all) {
    if (d.register !== register) continue
    const [y, m] = d.date.split("-").map(Number)
    out[y] ??= []
    if (!out[y].includes(m)) out[y].push(m)
  }
  for (const y of Object.keys(out)) out[Number(y)].sort((a, b) => a - b)
  return out
}

export function activeFilterCount(q: RegisterQuery) {
  return (q.op !== "all" ? 1 : 0) + (q.jpk !== "all" ? 1 : 0) + (q.series.length ? 1 : 0) + (q.labels.length ? 1 : 0)
}

/* ------------------------------ URL mapping ------------------------------ */

const SORT_PARAM: Record<SortKey, string> = {
  counterparty: "kontrahent",
  date: "data",
  number: "numer",
  ksef: "ksef",
  identifier: "identyfikator",
  gross: "brutto",
}
const SORT_FROM_PARAM = Object.fromEntries(Object.entries(SORT_PARAM).map(([k, v]) => [v, k])) as Record<string, SortKey>

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : [])
const int = (v: string | null, fallback: number) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

export function queryFromParams(p: URLSearchParams): RegisterQuery {
  const register: RegisterKind = p.get("rejestr") === "zakupy" ? "zakupy" : "sprzedaz"
  const rawSort = p.get("sort")
  let sort: RegisterQuery["sort"] = null
  if (rawSort) {
    const desc = rawSort.startsWith("-")
    const id = SORT_FROM_PARAM[rawSort.replace(/^-/, "")]
    if (id) sort = { id, desc }
  }
  const op = p.get("rodzaj")
  const size = int(p.get("ile"), DEFAULT_QUERY.size)
  return {
    register,
    year: int(p.get("rok"), DEFAULT_QUERY.year),
    month: Math.min(12, int(p.get("miesiac"), DEFAULT_QUERY.month)),
    op: op === "faktury" ? "faktura" : op === "korekty" ? "korekta" : "all",
    jpk: p.get("jpk") ?? "all",
    series: list(p.get("serie")),
    labels: list(p.get("etykiety")),
    q: p.get("q") ?? "",
    sort,
    page: int(p.get("strona"), 1),
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_QUERY.size,
  }
}

export function paramsFromQuery(q: RegisterQuery, extra?: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams()
  if (q.register !== DEFAULT_QUERY.register) p.set("rejestr", q.register)
  if (q.year !== DEFAULT_QUERY.year) p.set("rok", String(q.year))
  if (q.month !== DEFAULT_QUERY.month) p.set("miesiac", String(q.month))
  if (q.op !== "all") p.set("rodzaj", q.op === "faktura" ? "faktury" : "korekty")
  if (q.jpk !== "all") p.set("jpk", q.jpk)
  if (q.series.length) p.set("serie", q.series.join(","))
  if (q.labels.length) p.set("etykiety", q.labels.join(","))
  if (q.q) p.set("q", q.q)
  if (q.sort) p.set("sort", `${q.sort.desc ? "-" : ""}${SORT_PARAM[q.sort.id]}`)
  if (q.page > 1) p.set("strona", String(q.page))
  if (q.size !== DEFAULT_QUERY.size) p.set("ile", String(q.size))
  for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v)
  return p
}
