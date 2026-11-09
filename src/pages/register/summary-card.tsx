import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown } from "lucide-react"
import { Chip } from "@/components/ui/chip"
import { Skeleton } from "@/components/ui/skeleton"
import { Money } from "@/components/app/money"
import { RATE_LABEL, REGISTER_RATES } from "@/data/fixtures"
import type { RateTotal, RegisterKind, RegisterResult } from "@/data/types"
import { useIsMobile } from "@/hooks/use-media-query"
import { pl } from "@/lib/format"
import { cn } from "@/lib/utils"

function Stat({ label, grosze, unavailable }: { label: string; grosze: number; unavailable?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-mute">{label}</p>
      <div className="mt-1.5">
        {unavailable ? (
          <span className="font-display text-2xl text-stone">—</span>
        ) : (
          <Money grosze={grosze} size="lg" animateChanges />
        )}
      </div>
    </div>
  )
}

function RateRows({ rates, unavailable }: { rates: RateTotal[]; unavailable?: boolean }) {
  const totalVat = rates.reduce((s, r) => s + Math.abs(r.vat), 0)
  return (
    <ul className="space-y-3.5">
      {rates.map((r) => {
        const share = totalVat ? Math.abs(r.vat) / totalVat : 0
        return (
          <li key={r.rate} className="grid grid-cols-[3.25rem_minmax(0,1fr)_6.5rem] items-center gap-3">
            <span className="tnum inline-flex h-7 items-center justify-center rounded-full bg-fill text-[12.5px] font-semibold shadow-[inset_0_0_0_1px_var(--hairline)]">
              {RATE_LABEL[r.rate]}
            </span>
            <div className="min-w-0">
              <div className="h-2 overflow-hidden rounded-full bg-fill-sunken">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-soft),var(--accent))]"
                  initial={false}
                  animate={{ width: unavailable ? "0%" : `${Math.max(share * 100, share > 0 ? 3 : 0)}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="tnum mt-1.5 truncate text-xs text-mute">
                netto {unavailable ? "—" : <Money grosze={r.net} className="text-xs font-medium text-mute" />}
              </p>
            </div>
            <span className="text-right">
              {unavailable ? <span className="text-stone">—</span> : <Money grosze={r.vat} className="text-[14.5px]" />}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function SummaryCard({
  data,
  isPending,
  isError,
  periodText,
  register,
}: {
  register: RegisterKind
  data: RegisterResult | undefined
  isPending: boolean
  isError: boolean
  periodText: string
}) {
  const isMobile = useIsMobile()
  const [ratesOpen, setRatesOpen] = useState(false)

  if (isPending && !data) {
    return (
      <section className="glass rounded-[28px] p-6 sm:p-8" aria-busy="true" aria-label="Wczytywanie podsumowania">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="mt-4 h-14 w-72 max-w-full rounded-2xl" />
            <div className="mt-7 flex gap-10">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </div>
          <div className="hidden space-y-5 lg:block">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        </div>
      </section>
    )
  }

  const unavailable = isError || !data
  const totals = data?.totals ?? { net: 0, vat: 0, gross: 0 }
  const rates = data?.byRate ?? REGISTER_RATES[register].map((rate) => ({ rate, net: 0, vat: 0 }))
  const count = data?.total ?? 0

  const ratesBlock = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-ink-2">Kwoty według stawek VAT</h3>
        <span className="flex gap-1.5">
          <Chip size="sm" tone="neutral">VAT</Chip>
          <Chip size="sm" tone="outline">DEMO</Chip>
        </span>
      </div>
      <div className="mt-4">
        <RateRows rates={rates} unavailable={unavailable} />
      </div>
    </>
  )

  return (
    <section className="glass rounded-[28px] p-5 sm:p-8" aria-label="Podsumowanie rejestru">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-mute">
            Brutto · {periodText}
            {!unavailable && (
              <span className="tnum">
                {" "}
                · {count} {pl(count, ["dokument", "dokumenty", "dokumentów"])}
              </span>
            )}
          </p>
          <div className="mt-2.5">
            {unavailable ? (
              <span className="font-display text-[clamp(2.6rem,1.9rem+3vw,4.25rem)] font-medium leading-none text-stone">—</span>
            ) : (
              <Money grosze={totals.gross} size="xl" animateChanges />
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-hairline pt-5 sm:mt-7 sm:flex sm:gap-12">
            <Stat label="Netto" grosze={totals.net} unavailable={unavailable} />
            <Stat label="VAT" grosze={totals.vat} unavailable={unavailable} />
          </div>
        </div>

        {isMobile ? (
          <div className="-mx-1 rounded-[20px] bg-fill-sunken/60 p-1">
            <button
              type="button"
              aria-expanded={ratesOpen}
              onClick={() => setRatesOpen((o) => !o)}
              className="flex h-12 w-full items-center justify-between rounded-[16px] px-3.5 text-[14px] font-semibold"
            >
              Kwoty według stawek VAT
              <ChevronDown className={cn("size-[18px] text-mute transition-transform duration-300", ratesOpen && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {ratesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-4 pt-1">
                    <div className="mb-3 flex gap-1.5">
                      <Chip size="sm" tone="neutral">VAT</Chip>
                      <Chip size="sm" tone="outline">DEMO</Chip>
                    </div>
                    <RateRows rates={rates} unavailable={unavailable} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="min-w-0 lg:border-l lg:border-hairline lg:pl-10">{ratesBlock}</div>
        )}
      </div>
    </section>
  )
}
