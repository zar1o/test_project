import { motion } from "motion/react"
import { StatusDot } from "@/components/ui/chip"
import { Monogram } from "@/components/ui/monogram"
import { Dialog, SheetContent } from "@/components/ui/dialog"
import { Money } from "@/components/app/money"
import { grossOf } from "@/data/register-logic"
import type { VatDocument } from "@/data/types"
import { formatDateShort } from "@/lib/format"
import { cn } from "@/lib/utils"
import { SheetDetails } from "./document-details"

// Phone layout: the register reads like a transaction feed. Name and number
// on the left, amount and date on the right; the rest lives one tap away.

export function RegisterList({
  rows,
  openId,
  onOpen,
  dimmed,
}: {
  rows: VatDocument[]
  openId: string | null
  onOpen: (id: string | null) => void
  dimmed: boolean
}) {
  const openDoc = rows.find((r) => r.id === openId) ?? null
  return (
    <>
      <ul className={cn("transition-opacity duration-200", dimmed && "opacity-55")}>
        {rows.map((d, i) => (
          <motion.li
            key={d.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.2), duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="border-b border-hairline last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onOpen(d.id)}
              className="flex min-h-[72px] w-full items-center gap-3 rounded-[18px] px-2 py-3 text-left outline-none transition-colors active:bg-fill focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Monogram name={d.counterparty} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-tight">{d.counterparty}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-mute">
                  {d.ksef.state === "unconfirmed" && <StatusDot tone="attention" className="size-1.5 shrink-0" />}
                  <span className="truncate">{d.number}</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <Money grosze={grossOf(d)} className="text-[15px]" />
                <span className="mt-1 block text-[12.5px] text-mute">{formatDateShort(d.date)}</span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
      <p className="flex items-center gap-1.5 px-2 pt-3 text-[12px] text-mute">
        <StatusDot tone="attention" className="size-1.5" /> numer KSeF bez potwierdzenia
      </p>

      <Dialog open={!!openDoc} onOpenChange={(o) => !o && onOpen(null)}>
        {openDoc && (
          <SheetContent title={openDoc.number} description="Szczegóły dokumentu">
            <SheetDetails doc={openDoc} />
          </SheetContent>
        )}
      </Dialog>
    </>
  )
}
