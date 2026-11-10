import { motion } from "motion/react"
import { ReceiptText, TriangleAlert, WalletCards } from "lucide-react"
import { Chip } from "@/components/ui/chip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Segmented } from "@/components/ui/segmented"
import { REGISTER_NAMES } from "@/data/fixtures"
import type { RegisterKind } from "@/data/types"
import { useMediaQuery } from "@/hooks/use-media-query"
import { enter } from "@/lib/enter"

// The page title lives in the top bar (see top-bar.tsx), so this is a single
// row of controls and the figures start right under the navigation.

function ContextChip() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="glass-control inline-flex h-8 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-[12.5px] font-semibold text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <TriangleAlert className="size-3.5 text-warn" strokeWidth={2.2} />
          Wymaga potwierdzenia
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80 text-sm">
        <p className="font-semibold">Kontekst VAT wymaga potwierdzenia.</p>
        <p className="mt-1 text-mute">
          Sprzedaż i zakupy w wybranym okresie to wyłącznie dane demonstracyjne, nie ewidencja organizacji.
        </p>
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
    <motion.header
      {...enter(0, 10, 0.45)}
      className="flex flex-col gap-2.5 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4"
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
    </motion.header>
  )
}
