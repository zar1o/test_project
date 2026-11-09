import { Archive, Banknote, FileText, Landmark, ListChecks, ReceiptText, type LucideIcon } from "lucide-react"

export interface AreaNavItem {
  id: string
  label: string
  icon: LucideIcon
  /** Route when the area is part of the demo. */
  to?: string
  /** Availability entry that feeds the status dot. */
  statusId?: string
  keywords: string
}

/** The four working areas (the "Obszary" tabs of the source screen). */
export const AREA_NAV: AreaNavItem[] = [
  { id: "rejestry-vat", label: "Rejestry i VAT", icon: ReceiptText, to: "/rejestry-vat", statusId: "rejestr-vat", keywords: "rejestr vat sprzedaz zakupy jpk ksef faktury" },
  { id: "ksiegowania", label: "Księgowania", icon: Landmark, keywords: "ksiegowania kpir ksiegi ewidencja przychodow" },
  { id: "majatek", label: "Majątek", icon: Archive, keywords: "majatek srodki trwale amortyzacja" },
  { id: "kontrole", label: "Kontrole", icon: ListChecks, keywords: "kontrole reguly weryfikacja" },
]

/** Icons for the six availability entries. */
export const AREA_ICONS: Record<string, LucideIcon> = {
  "rejestr-vat": ReceiptText,
  kpir: Landmark,
  "ewidencja-przychodow": Banknote,
  "pelne-ksiegi": FileText,
  majatek: Archive,
  kontrole: ListChecks,
}
