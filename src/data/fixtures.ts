import type { Area, HubData, Label, RegisterKind, VatDocument, VatLine, VatRate } from "./types"

// Demonstration data. October 2026 sales reproduce the totals of the source
// screen exactly: netto 9700,00 zł, VAT 2323,00 zł, brutto 12 023,00 zł,
// with VAT split 23% = 2323,00 zł and np = 0,00 zł.

export const ORGANIZATION = "Onsaldo Preview Sp. z o.o."
export const USER = { name: "Preview Reviewer", role: "Konto użytkownika" }

export const LABELS: Label[] = [
  { id: "do-wyjasnienia", name: "Do wyjaśnienia" },
  { id: "pilne", name: "Pilne" },
  { id: "zweryfikowane", name: "Zweryfikowane" },
]

export const RATE_LABEL: Record<VatRate, string> = {
  "23": "23%",
  "8": "8%",
  "5": "5%",
  "0": "0%",
  zw: "zw",
  np: "np",
}

/** Rates each register reports, even when a rate holds nothing this month. */
export const REGISTER_RATES: Record<RegisterKind, VatRate[]> = {
  sprzedaz: ["23", "np"],
  zakupy: ["23", "8", "zw"],
}

export const JPK_CODES: Record<RegisterKind, { value: string; label: string; hint: string }[]> = {
  sprzedaz: [
    { value: "TP", label: "TP", hint: "Powiązania między nabywcą a dostawcą" },
    { value: "MPP", label: "MPP", hint: "Mechanizm podzielonej płatności" },
    { value: "FP", label: "FP", hint: "Faktura do paragonu" },
  ],
  zakupy: [
    { value: "MK", label: "MK", hint: "Metoda kasowa" },
    { value: "IMP", label: "IMP", hint: "Import towarów lub usług" },
  ],
}

export const SERIES: Record<RegisterKind, { value: string; label: string }[]> = {
  sprzedaz: [
    { value: "FV", label: "FV · faktury sprzedaży" },
    { value: "KOR", label: "KOR · korekty sprzedaży" },
  ],
  zakupy: [
    { value: "FZ", label: "FZ · faktury zakupu" },
    { value: "KZ", label: "KZ · korekty zakupu" },
  ],
}

export const REGISTER_NAMES: Record<RegisterKind, { full: string; short: string }> = {
  sprzedaz: { full: "Rejestr VAT sprzedaży", short: "Sprzedaż" },
  zakupy: { full: "Rejestr VAT zakupów", short: "Zakupy" },
}

const RATE_FACTOR: Record<VatRate, number> = { "23": 0.23, "8": 0.08, "5": 0.05, "0": 0, zw: 0, np: 0 }

function line(rate: VatRate, netZl: number): VatLine {
  const net = Math.round(netZl * 100)
  return { rate, net, vat: Math.round(net * RATE_FACTOR[rate]) }
}

const unconfirmed = { state: "unconfirmed" } as const
const confirmed = (number: string) => ({ state: "confirmed", number }) as const

type Seed = Omit<VatDocument, "id" | "register" | "identifier" | "series" | "operation"> & {
  operation?: VatDocument["operation"]
}

function build(register: RegisterKind, prefix: string, startIndex: number, seeds: Seed[]): VatDocument[] {
  return seeds.map((s, i) => {
    const n = startIndex + i
    const operation = s.operation ?? "faktura"
    const series =
      register === "sprzedaz"
        ? operation === "korekta"
          ? "KOR"
          : "FV"
        : operation === "korekta"
          ? "KZ"
          : "FZ"
    return {
      ...s,
      id: `${prefix}${n}`,
      register,
      operation,
      series,
      identifier: `DEMO-${prefix}-${n}`,
    }
  })
}

const SALES_OCT: Seed[] = [
  { counterparty: "Hydrobud Serwis Sp. z o.o.", date: "2026-10-01", number: "FV/1/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 1200)], labels: [] },
  { counterparty: "Piekarnia Złoty Kłos", date: "2026-10-02", number: "FV/2/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 450)], labels: [] },
  { counterparty: "Studio Lumen s.c.", date: "2026-10-03", number: "KOR/3/10/2026/DEMO", operation: "korekta", jpk: [], ksef: unconfirmed, lines: [line("np", -400)], labels: ["do-wyjasnienia"] },
  { counterparty: "Ogrody Wierzbowe Sp. j.", date: "2026-10-04", number: "FV/4/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 980)], labels: [] },
  { counterparty: "Kawiarnia Pod Arkadami", date: "2026-10-05", number: "FV/5/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 300)], labels: [] },
  { counterparty: "Transkom Logistyka Sp. z o.o.", date: "2026-10-06", number: "FV/6/10/2026/DEMO", jpk: ["TP"], ksef: unconfirmed, lines: [line("23", 1500)], labels: ["pilne"] },
  { counterparty: "Pracownia Ceramiki Glina", date: "2026-10-07", number: "FV/7/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 640)], labels: [] },
  { counterparty: "Apteka Pod Lipami", date: "2026-10-08", number: "FV/8/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 210)], labels: [] },
  { counterparty: "Mebloteka Nowak Sp. z o.o.", date: "2026-10-09", number: "FV/9/10/2026/DEMO", jpk: ["MPP"], ksef: unconfirmed, lines: [line("23", 1850)], labels: ["zweryfikowane"] },
  { counterparty: "Biuro Podróży Horyzont", date: "2026-10-10", number: "FV/10/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 720)], labels: [] },
  { counterparty: "Optyk Soczewka", date: "2026-10-11", number: "FV/11/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 390)], labels: [] },
  { counterparty: "Drukarnia Akapit Sp. z o.o.", date: "2026-10-12", number: "FV/12/10/2026/DEMO", jpk: ["FP"], ksef: unconfirmed, lines: [line("23", 1160)], labels: [] },
  { counterparty: "Warsztat Auto-Kamiński", date: "2026-10-13", number: "FV/13/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 260)], labels: ["pilne"] },
  { counterparty: "Szkoła Językowa Lingwa", date: "2026-10-14", number: "FV/14/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 440)], labels: ["zweryfikowane"] },
]

const SALES_SEP: Seed[] = [
  { counterparty: "Hydrobud Serwis Sp. z o.o.", date: "2026-09-03", number: "FV/1/09/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 840)], labels: [] },
  { counterparty: "Kawiarnia Pod Arkadami", date: "2026-09-08", number: "FV/2/09/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 270)], labels: [] },
  { counterparty: "Mebloteka Nowak Sp. z o.o.", date: "2026-09-12", number: "FV/3/09/2026/DEMO", jpk: ["MPP"], ksef: unconfirmed, lines: [line("23", 2100)], labels: ["zweryfikowane"] },
  { counterparty: "Optyk Soczewka", date: "2026-09-17", number: "FV/4/09/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 360)], labels: [] },
  { counterparty: "Transkom Logistyka Sp. z o.o.", date: "2026-09-22", number: "FV/5/09/2026/DEMO", jpk: ["TP"], ksef: unconfirmed, lines: [line("23", 1320)], labels: [] },
  { counterparty: "Drukarnia Akapit Sp. z o.o.", date: "2026-09-29", number: "FV/6/09/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 580)], labels: [] },
]

const PURCHASES_OCT: Seed[] = [
  { counterparty: "Hurtownia Papieru Arkusz", date: "2026-10-01", number: "FA/1187/10/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 480)], labels: [] },
  { counterparty: "Telekom Prim Sp. z o.o.", date: "2026-10-02", number: "F/26/10/0412/DEMO", jpk: [], ksef: confirmed("0000000000-20261002-4F1A9C2B7D30-5E"), lines: [line("23", 159)], labels: ["zweryfikowane"] },
  { counterparty: "Paliwa Wschód Sp. z o.o.", date: "2026-10-05", number: "PW/10/2026/0931/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 365.85)], labels: [] },
  { counterparty: "Kancelaria Rachunkowa Saldo", date: "2026-10-06", number: "12/10/2026/DEMO", jpk: [], ksef: confirmed("0000000000-20261006-9B04E7713AC2-1D"), lines: [line("23", 900)], labels: ["zweryfikowane"] },
  { counterparty: "Catering Smaczny Kąsek", date: "2026-10-08", number: "SK/544/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("8", 420)], labels: [] },
  { counterparty: "Wynajem Lokali Rondo", date: "2026-10-10", number: "WL/10/2026/07/DEMO", jpk: ["MK"], ksef: unconfirmed, lines: [line("23", 2500)], labels: ["pilne"] },
  { counterparty: "Ubezpieczenia Puls TU", date: "2026-10-12", number: "POL/88213/DEMO", jpk: [], ksef: unconfirmed, lines: [line("zw", 180)], labels: [] },
  { counterparty: "Serwis IT Bajt", date: "2026-10-15", number: "FV/2026/10/58/DEMO", jpk: [], ksef: confirmed("0000000000-20261015-C3D58A0F6E19-8A"), lines: [line("23", 640)], labels: [] },
  { counterparty: "Hurtownia Papieru Arkusz", date: "2026-10-20", number: "KOR/FA/1187/10/2026/DEMO", operation: "korekta", jpk: [], ksef: unconfirmed, lines: [line("23", -60)], labels: ["do-wyjasnienia"] },
  { counterparty: "Cloudfield Services Ltd.", date: "2026-10-21", number: "INV-2026-10-3391-DEMO", jpk: ["IMP"], ksef: unconfirmed, lines: [line("23", 1200)], labels: [] },
]

const PURCHASES_SEP: Seed[] = [
  { counterparty: "Telekom Prim Sp. z o.o.", date: "2026-09-02", number: "F/26/09/0388/DEMO", jpk: [], ksef: confirmed("0000000000-20260902-1E77B0A4C915-3C"), lines: [line("23", 159)], labels: [] },
  { counterparty: "Kancelaria Rachunkowa Saldo", date: "2026-09-06", number: "11/09/2026/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 900)], labels: [] },
  { counterparty: "Paliwa Wschód Sp. z o.o.", date: "2026-09-09", number: "PW/09/2026/0874/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 412.2)], labels: [] },
  { counterparty: "Serwis IT Bajt", date: "2026-09-18", number: "FV/2026/09/51/DEMO", jpk: [], ksef: unconfirmed, lines: [line("23", 640)], labels: [] },
]

export const DOCUMENTS: VatDocument[] = [
  ...build("sprzedaz", "S", 1, SALES_OCT),
  ...build("sprzedaz", "S", 21, SALES_SEP),
  ...build("zakupy", "Z", 1, PURCHASES_OCT),
  ...build("zakupy", "Z", 21, PURCHASES_SEP),
]

export const DEFAULT_PERIOD = { year: 2026, month: 10 }
export const YEARS = [2025, 2026]

const AREAS: Area[] = [
  {
    id: "rejestr-vat",
    name: "Rejestr VAT",
    status: "attention",
    statusLabel: "Wymaga potwierdzenia",
    conditions: [
      { label: "Status podatnika VAT", state: "ok", note: "Czynny podatnik VAT" },
      { label: "Kontekst VAT", state: "attention", note: "Wymaga potwierdzenia przed pierwszym rozliczeniem" },
      { label: "Serie dokumentów", state: "ok", note: "FV, KOR, FZ i KZ skonfigurowane" },
      { label: "Połączenie z KSeF", state: "missing", note: "Nie skonfigurowano, numery KSeF bez potwierdzenia" },
    ],
  },
  {
    id: "kpir",
    name: "KPiR",
    status: "blocked",
    statusLabel: "Brak warunków",
    conditions: [
      { label: "Forma opodatkowania", state: "missing", note: "Wymagana skala podatkowa lub podatek liniowy" },
      { label: "Okres księgowy", state: "attention", note: "Wymaga konfiguracji" },
    ],
  },
  {
    id: "ewidencja-przychodow",
    name: "Ewidencja przychodów",
    status: "blocked",
    statusLabel: "Brak warunków",
    conditions: [
      { label: "Forma opodatkowania", state: "missing", note: "Wymagany ryczałt od przychodów ewidencjonowanych" },
      { label: "Okres księgowy", state: "attention", note: "Wymaga konfiguracji" },
    ],
  },
  {
    id: "pelne-ksiegi",
    name: "Pełne księgi",
    status: "blocked",
    statusLabel: "Brak warunków",
    conditions: [
      { label: "Plan kont", state: "missing", note: "Nie wybrano planu kont" },
      { label: "Okres księgowy", state: "attention", note: "Wymaga konfiguracji" },
    ],
  },
  {
    id: "majatek",
    name: "Majątek",
    status: "attention",
    statusLabel: "Wymaga konfiguracji",
    conditions: [
      { label: "Ewidencja środków trwałych", state: "attention", note: "Brak zdefiniowanych grup KŚT" },
      { label: "Okres księgowy", state: "attention", note: "Wymaga konfiguracji" },
    ],
  },
  {
    id: "kontrole",
    name: "Kontrole",
    status: "attention",
    statusLabel: "Wymaga konfiguracji",
    conditions: [
      { label: "Reguły kontroli", state: "ok", note: "Domyślny zestaw reguł" },
      { label: "Źródła danych", state: "attention", note: "Dostępny wyłącznie rejestr VAT" },
    ],
  },
]

export const HUB: HubData = {
  organization: ORGANIZATION,
  period: {
    year: 2026,
    status: "Wymaga konfiguracji",
    description:
      "Orientacyjny rok rozliczeniowy aktywnej organizacji. Wymaga potwierdzenia przed uruchomieniem operacji księgowych.",
  },
  areas: AREAS,
}

export interface Notification {
  id: string
  title: string
  context: string
  time: string
  tone: "attention" | "info"
}

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Kontekst VAT wymaga potwierdzenia", context: "Rejestry i VAT", time: "dziś, 09:12", tone: "attention" },
  { id: "n2", title: "Okres księgowy 2026 wymaga konfiguracji", context: "Obszary księgowe", time: "wczoraj, 16:40", tone: "attention" },
  { id: "n3", title: "14 dokumentów sprzedaży bez potwierdzenia KSeF", context: "Rejestr VAT sprzedaży", time: "wczoraj, 08:05", tone: "info" },
  { id: "n4", title: "Dane demonstracyjne zostały odświeżone", context: "System", time: "7 lis, 10:30", tone: "info" },
]
