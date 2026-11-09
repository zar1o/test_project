export type RegisterKind = "sprzedaz" | "zakupy"
export type VatRate = "23" | "8" | "5" | "0" | "zw" | "np"
export type OperationKind = "faktura" | "korekta"

/** All amounts in grosze. */
export interface VatLine {
  rate: VatRate
  net: number
  vat: number
}

export type KsefStatus = { state: "unconfirmed" } | { state: "confirmed"; number: string }

export interface VatDocument {
  id: string
  register: RegisterKind
  counterparty: string
  date: string
  number: string
  series: string
  operation: OperationKind
  jpk: string[]
  ksef: KsefStatus
  identifier: string
  lines: VatLine[]
  labels: string[]
}

export interface Label {
  id: string
  name: string
}

export type AreaStatus = "ready" | "attention" | "blocked"

export interface AreaCondition {
  label: string
  state: "ok" | "attention" | "missing"
  note: string
}

export interface Area {
  id: string
  name: string
  status: AreaStatus
  statusLabel: string
  conditions: AreaCondition[]
}

export interface HubData {
  organization: string
  period: {
    year: number
    status: string
    description: string
  } | null
  areas: Area[]
}

export interface Totals {
  net: number
  vat: number
  gross: number
}

export interface RateTotal {
  rate: VatRate
  net: number
  vat: number
}

export type SortKey = "counterparty" | "date" | "number" | "ksef" | "identifier" | "gross"

export interface RegisterQuery {
  register: RegisterKind
  year: number
  month: number
  op: "all" | OperationKind
  jpk: string
  series: string[]
  labels: string[]
  q: string
  sort: { id: SortKey; desc: boolean } | null
  page: number
  size: number
}

export interface RegisterResult {
  rows: VatDocument[]
  /** Documents matching every filter (all pages). */
  total: number
  /** Documents in the period before filters: tells "empty month" from "no match". */
  periodTotal: number
  totals: Totals
  byRate: RateTotal[]
  /** Months that hold documents, per year, for the period picker. */
  monthsWithData: Record<number, number[]>
  page: number
  pageCount: number
}

export interface SearchHit {
  doc: VatDocument
  gross: number
}

export interface SearchResult {
  documents: SearchHit[]
  documentCount: number
}
