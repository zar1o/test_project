import { describe, expect, it } from "vitest"
import { DOCUMENTS } from "../fixtures"
import {
  DEFAULT_QUERY,
  filterDocs,
  normalize,
  paramsFromQuery,
  queryFromParams,
  ratesOf,
  sortDocs,
  totalsOf,
} from "../register-logic"

describe("register logic", () => {
  it("reproduces the source screen totals for October 2026 sales", () => {
    const { filtered } = filterDocs(DOCUMENTS, DEFAULT_QUERY)
    expect(filtered).toHaveLength(14)
    expect(totalsOf(filtered)).toEqual({ net: 970000, vat: 232300, gross: 1202300 })
    const rates = ratesOf("sprzedaz", filtered)
    expect(rates.find((r) => r.rate === "23")?.vat).toBe(232300)
    expect(rates.find((r) => r.rate === "np")?.vat).toBe(0)
  })

  it("filters by operation, JPK code, series and labels", () => {
    const korekty = filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, op: "korekta" }).filtered
    expect(korekty.map((d) => d.number)).toEqual(["KOR/3/10/2026/DEMO"])
    expect(filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, jpk: "TP" }).filtered).toHaveLength(1)
    expect(filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, jpk: "none" }).filtered).toHaveLength(11)
    expect(filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, series: ["KOR"] }).filtered).toHaveLength(1)
    expect(filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, labels: ["pilne"] }).filtered).toHaveLength(2)
  })

  it("searches without diacritics", () => {
    expect(normalize("Złoty Kłos")).toBe("zloty klos")
    const hits = filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, q: "zloty klos" }).filtered
    expect(hits.map((d) => d.counterparty)).toEqual(["Piekarnia Złoty Kłos"])
  })

  it("tells an empty month apart from a filter that excludes everything", () => {
    const empty = filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, month: 11 })
    expect(empty.period).toHaveLength(0)
    const excluded = filterDocs(DOCUMENTS, { ...DEFAULT_QUERY, q: "nie ma takiego" })
    expect(excluded.period).toHaveLength(14)
    expect(excluded.filtered).toHaveLength(0)
  })

  it("sorts by amount descending", () => {
    const sorted = sortDocs(filterDocs(DOCUMENTS, DEFAULT_QUERY).filtered, { id: "gross", desc: true })
    expect(sorted[0].counterparty).toBe("Mebloteka Nowak Sp. z o.o.")
    expect(sorted.at(-1)?.number).toBe("KOR/3/10/2026/DEMO")
  })

  it("round-trips the query through the URL", () => {
    const q = { ...DEFAULT_QUERY, register: "zakupy" as const, month: 9, jpk: "MK", series: ["FZ"], sort: { id: "gross" as const, desc: true }, page: 2 }
    expect(queryFromParams(paramsFromQuery(q))).toEqual(q)
    expect(paramsFromQuery(DEFAULT_QUERY).toString()).toBe("")
  })
})
