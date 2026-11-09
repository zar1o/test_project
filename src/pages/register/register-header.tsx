import { Link } from "react-router"
import { motion } from "motion/react"
import { ArrowLeft, ReceiptText, TriangleAlert, WalletCards } from "lucide-react"
import { Chip } from "@/components/ui/chip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Segmented } from "@/components/ui/segmented"
import { ORGANIZATION, REGISTER_NAMES } from "@/data/fixtures"
import type { RegisterKind } from "@/data/types"
import { useMediaQuery } from "@/hooks/use-media-query"

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
})

function ContextChip() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-warn-tint px-3 text-[12.5px] font-semibold text-warn outline-none transition-colors hover:bg-warn-tint/80 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <TriangleAlert className="size-3.5" strokeWidth={2.2} />
          Wymaga potwierdzenia
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80 text-sm">
        <p className="font-semibold">Kontekst VAT wymaga potwierdzenia.</p>
        <p className="mt-1 text-mute">Poniżej wyłącznie dane demonstracyjne, nie ewidencja organizacji.</p>
      </PopoverContent>
    </Popover>
  )
}

export function RegisterHeader({
  register,
  onRegisterChange,
}: {
  register: RegisterKind
  onRegisterChange: (r: RegisterKind) => void
}) {
  const wide = useMediaQuery("(min-width: 640px)")
  return (
    <header className="pt-5 sm:pt-8">
      <motion.div {...rise(0)}>
        <Link
          to="/"
          className="glass-control sheen inline-flex h-9 items-center gap-2 rounded-full pl-2.5 pr-3.5 text-[13px] font-semibold text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft className="size-4" />
          Obszary księgowe
        </Link>
      </motion.div>

      <motion.div {...rise(0.05)} className="mt-6 min-w-0 sm:mt-8">
        <p className="text-[13px] font-semibold text-accent">{ORGANIZATION}</p>
        <h1 className="mt-2 font-display text-[clamp(2.25rem,1.7rem+2.4vw,3.5rem)] font-medium leading-[0.98] tracking-[-0.035em]">
          Rejestry i VAT
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] text-mute text-pretty">
          Sprzedaż i zakupy w wybranym okresie — podgląd danych demonstracyjnych.
        </p>
      </motion.div>

      <motion.div
        {...rise(0.12)}
        className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center sm:justify-between"
      >
        <Segmented
          label="Rejestr"
          value={register}
          onChange={onRegisterChange}
          className="w-full sm:w-auto"
          options={(["sprzedaz", "zakupy"] as const).map((r) => ({
            value: r,
            ariaLabel: REGISTER_NAMES[r].full,
            icon: r === "sprzedaz" ? <ReceiptText /> : <WalletCards />,
            label: wide ? REGISTER_NAMES[r].full : REGISTER_NAMES[r].short,
          }))}
        />
        <div className="flex shrink-0 items-center gap-2">
          <ContextChip />
          <Chip tone="outline" className="h-8 tracking-[0.06em]">
            DEMO
          </Chip>
        </div>
      </motion.div>
    </header>
  )
}
