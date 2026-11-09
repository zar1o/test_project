import { LABELS, RATE_LABEL, REGISTER_NAMES } from "./fixtures"
import { grossOf } from "./register-logic"
import type { RegisterQuery, VatDocument } from "./types"

const cell = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const amount = (g: number) => (g / 100).toFixed(2).replace(".", ",")

/** Semicolon CSV with BOM: opens correctly in Polish Excel. */
export function downloadCsv(rows: VatDocument[], q: RegisterQuery) {
  const head = [
    "Kontrahent", "Data", "Numer dokumentu", "Numer KSeF", "Identyfikator", "Rodzaj operacji",
    "Kod JPK V7", "Seria", "Stawki VAT", "Netto", "VAT", "Brutto", "Etykiety",
  ]
  const lines = rows.map((d) => {
    const net = d.lines.reduce((s, l) => s + l.net, 0)
    const vat = d.lines.reduce((s, l) => s + l.vat, 0)
    return [
      d.counterparty,
      d.date,
      d.number,
      d.ksef.state === "confirmed" ? d.ksef.number : "Brak potwierdzenia",
      d.identifier,
      d.operation === "korekta" ? "Korekta" : "Faktura",
      d.jpk.join(" ") || "—",
      d.series,
      d.lines.map((l) => RATE_LABEL[l.rate]).join(" "),
      amount(net),
      amount(vat),
      amount(grossOf(d)),
      d.labels.map((id) => LABELS.find((l) => l.id === id)?.name ?? id).join(", "),
    ]
      .map(cell)
      .join(";")
  })
  const csv = "﻿" + [head.join(";"), ...lines].join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  const slug = REGISTER_NAMES[q.register].short.toLowerCase().replace("ż", "z")
  a.href = url
  a.download = `rejestr-vat-${slug}-${q.year}-${String(q.month).padStart(2, "0")}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
