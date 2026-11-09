import { Chip, StatusDot } from "@/components/ui/chip"
import { Monogram } from "@/components/ui/monogram"
import { Money } from "@/components/app/money"
import { JPK_CODES, LABELS, RATE_LABEL, REGISTER_NAMES } from "@/data/fixtures"
import type { VatDocument } from "@/data/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * In the table the status is quiet (dot + muted text): when most rows share
 * it, a filled chip on every line is noise. The sheet uses the full chip.
 */
export function KsefValue({ doc, quiet }: { doc: VatDocument; quiet?: boolean }) {
  if (doc.ksef.state === "confirmed") {
    return (
      <span className="tnum flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-2" title={doc.ksef.number}>
        <StatusDot tone="ok" className="size-1.5 shrink-0" />
        <span className="truncate font-mono tracking-tight">{doc.ksef.number}</span>
      </span>
    )
  }
  if (quiet) {
    return (
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-mute">
        <StatusDot tone="attention" className="size-1.5 shrink-0" />
        Brak potwierdzenia
      </span>
    )
  }
  return (
    <Chip tone="attention" size="sm" dot>
      Brak potwierdzenia
    </Chip>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-medium text-mute">{label}</dt>
      <dd className="mt-1 text-[14px] font-semibold leading-snug">{children}</dd>
    </div>
  )
}

function sums(doc: VatDocument) {
  const net = doc.lines.reduce((s, l) => s + l.net, 0)
  const vat = doc.lines.reduce((s, l) => s + l.vat, 0)
  return { net, vat, gross: net + vat }
}

function jpkText(doc: VatDocument) {
  if (!doc.jpk.length) return "Bez oznaczeń"
  return doc.jpk
    .map((c) => {
      const hint = JPK_CODES[doc.register].find((j) => j.value === c)?.hint
      return hint ? `${c} · ${hint}` : c
    })
    .join(", ")
}

function LabelsValue({ doc }: { doc: VatDocument }) {
  if (!doc.labels.length) return <span className="font-medium text-mute">Brak</span>
  return (
    <span className="flex flex-wrap gap-1.5">
      {doc.labels.map((id) => (
        <Chip key={id} size="sm" tone="accent">
          {LABELS.find((l) => l.id === id)?.name ?? id}
        </Chip>
      ))}
    </span>
  )
}

const KSEF_NOTE =
  "Numer KSeF pojawi się po potwierdzeniu kontekstu VAT i przyjęciu dokumentu przez Krajowy System e-Faktur."

/** Desktop: unfolds under a row and shows only what the row does not. */
export function RowDetails({ doc }: { doc: VatDocument }) {
  const s = sums(doc)
  return (
    <div className="grid gap-6 rounded-[22px] bg-fill-sunken/70 p-5 shadow-[inset_0_0_0_1px_var(--hairline)] xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-medium text-mute">Netto</p>
          <Money grosze={s.net} className="mt-1.5 text-[17px]" />
        </div>
        <div>
          <p className="text-xs font-medium text-mute">VAT</p>
          <Money grosze={s.vat} className="mt-1.5 text-[17px]" />
        </div>
        <div>
          <p className="text-xs font-medium text-mute">Brutto</p>
          <Money grosze={s.gross} className="mt-1.5 text-[17px]" />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 xl:grid-cols-4">
        <Field label="Rodzaj operacji">{doc.operation === "korekta" ? "Korekta" : "Faktura"}</Field>
        <Field label="Stawki VAT">{doc.lines.map((l) => RATE_LABEL[l.rate]).join(", ")}</Field>
        <Field label="Seria">{doc.series}</Field>
        <Field label="Kod JPK V7">{jpkText(doc)}</Field>
        <Field label="Etykiety" className="col-span-2">
          <LabelsValue doc={doc} />
        </Field>
        {doc.ksef.state === "unconfirmed" && (
          <p className="col-span-2 text-[12.5px] leading-snug text-mute">{KSEF_NOTE}</p>
        )}
      </dl>
    </div>
  )
}

/** Phone: the full record in a sheet, every field of the desktop row included. */
export function SheetDetails({ doc }: { doc: VatDocument }) {
  const s = sums(doc)
  return (
    <div>
      <div className="flex items-center gap-3.5">
        <Monogram name={doc.counterparty} className="size-12 text-sm" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{doc.counterparty}</p>
          <p className="truncate text-[13px] text-mute">{REGISTER_NAMES[doc.register].full}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] bg-fill p-4 shadow-[inset_0_0_0_1px_var(--hairline)]">
        <p className="text-xs font-medium text-mute">Brutto</p>
        <Money grosze={s.gross} size="lg" className="mt-1.5" />
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-hairline pt-3.5">
          <div>
            <p className="text-xs font-medium text-mute">Netto</p>
            <Money grosze={s.net} className="mt-1" />
          </div>
          <div>
            <p className="text-xs font-medium text-mute">VAT · {doc.lines.map((l) => RATE_LABEL[l.rate]).join(", ")}</p>
            <Money grosze={s.vat} className="mt-1" />
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 pb-2">
        <Field label="Data">{formatDate(doc.date)}</Field>
        <Field label="Identyfikator">{doc.identifier}</Field>
        <Field label="Numer dokumentu" className="col-span-2">
          <span className="break-all">{doc.number}</span>
        </Field>
        <Field label="Numer KSeF" className="col-span-2">
          <KsefValue doc={doc} />
          {doc.ksef.state === "unconfirmed" && (
            <span className="mt-1.5 block text-[12.5px] font-normal leading-snug text-mute">{KSEF_NOTE}</span>
          )}
        </Field>
        <Field label="Rodzaj operacji">{doc.operation === "korekta" ? "Korekta" : "Faktura"}</Field>
        <Field label="Seria">{doc.series}</Field>
        <Field label="Kod JPK V7" className="col-span-2">
          {jpkText(doc)}
        </Field>
        <Field label="Etykiety" className="col-span-2">
          <LabelsValue doc={doc} />
        </Field>
      </dl>
    </div>
  )
}
