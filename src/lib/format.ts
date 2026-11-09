// Polish formatting helpers. Amounts are stored in grosze (integers) so sums
// never drift; Intl handles grouping (pl-PL skips grouping below 10 000,
// which matches the source screens: "9700,00 zł" but "12 023,00 zł").

const money = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(grosze: number): string {
  return money.format(grosze / 100)
}

/** Split into the parts Revolut-style money display needs: "12 023" + ",00" + "zł". */
export function moneyParts(grosze: number) {
  const parts = money.formatToParts(grosze / 100)
  let sign = ""
  let integer = ""
  let fraction = ""
  let currency = ""
  for (const p of parts) {
    if (p.type === "minusSign") sign = "−"
    else if (p.type === "integer" || p.type === "group") integer += p.value
    else if (p.type === "decimal" || p.type === "fraction") fraction += p.value
    else if (p.type === "currency") currency = p.value
  }
  return { sign, integer, fraction, currency }
}

export const MONTHS_NOMINATIVE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
] as const

export const MONTHS_LOCATIVE = [
  "styczniu", "lutym", "marcu", "kwietniu", "maju", "czerwcu",
  "lipcu", "sierpniu", "wrześniu", "październiku", "listopadzie", "grudniu",
] as const

export const MONTHS_SHORT = [
  "sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru",
] as const

export function capitalize(s: string) {
  return s.charAt(0).toLocaleUpperCase("pl-PL") + s.slice(1)
}

/** "Październik 2026" */
export function periodLabel(year: number, month: number) {
  return `${capitalize(MONTHS_NOMINATIVE[month - 1])} ${year}`
}

/** "w październiku 2026" */
export function periodLocative(year: number, month: number) {
  return `w ${MONTHS_LOCATIVE[month - 1]} ${year}`
}

/** ISO date "2026-10-01" -> "01.10.2026" */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}.${m}.${y}`
}

/** ISO date -> "1 paź" */
export function formatDateShort(iso: string) {
  const [, m, d] = iso.split("-")
  return `${Number(d)} ${MONTHS_SHORT[Number(m) - 1]}`
}

const plural = new Intl.PluralRules("pl-PL")

/** Polish plural: pl(5, ["dokument", "dokumenty", "dokumentów"]) */
export function pl(n: number, [one, few, many]: [string, string, string]) {
  const rule = plural.select(n)
  if (rule === "one") return one
  if (rule === "few") return few
  return many
}

export function initials(name: string) {
  const words = name
    .replace(/\b(Sp\.|z|o\.o\.|s\.c\.|Sp\. j\.|S\.A\.)\b/gi, "")
    .split(/\s+/)
    .filter((w) => /[\p{L}]/u.test(w))
  const a = words[0]?.[0] ?? "?"
  const b = words[1]?.[0] ?? ""
  return (a + b).toLocaleUpperCase("pl-PL")
}
