import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"
import { JPK_CODES, LABELS } from "@/data/fixtures"
import type { RegisterQuery } from "@/data/types"
import { clearedFilters } from "./filters"

// Every active filter is visible as a removable chip, so the reason a list
// looks short is never hidden behind a closed panel.

export function ActiveFilters({ query, update }: { query: RegisterQuery; update: (p: Partial<RegisterQuery>) => void }) {
  const chips: { key: string; label: string; clear: Partial<RegisterQuery> }[] = []
  if (query.q) chips.push({ key: "q", label: `„${query.q}”`, clear: { q: "" } })
  if (query.op !== "all")
    chips.push({ key: "op", label: query.op === "faktura" ? "Faktury" : "Korekty", clear: { op: "all" } })
  if (query.jpk !== "all") {
    const code = JPK_CODES[query.register].find((c) => c.value === query.jpk)
    chips.push({ key: "jpk", label: `JPK: ${query.jpk === "none" ? "bez oznaczeń" : (code?.label ?? query.jpk)}`, clear: { jpk: "all" } })
  }
  if (query.series.length) chips.push({ key: "series", label: `Serie: ${query.series.join(", ")}`, clear: { series: [] } })
  if (query.labels.length)
    chips.push({
      key: "labels",
      label: query.labels.map((id) => LABELS.find((l) => l.id === id)?.name ?? id).join(", "),
      clear: { labels: [] },
    })

  return (
    <AnimatePresence initial={false}>
      {chips.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="no-print overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <AnimatePresence initial={false} mode="popLayout">
              {chips.map((c) => (
                <motion.button
                  layout
                  key={c.key}
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  onClick={() => update(c.clear)}
                  aria-label={`Usuń filtr ${c.label}`}
                  className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-accent-tint pl-3.5 pr-2 text-[13px] font-semibold text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="truncate">{c.label}</span>
                  <X className="size-4 shrink-0 opacity-70" />
                </motion.button>
              ))}
            </AnimatePresence>
            {chips.length > 1 && (
              <button
                type="button"
                onClick={() => update({ ...clearedFilters(), q: "" })}
                className="h-9 rounded-full px-3 text-[13px] font-semibold text-mute underline-offset-4 hover:text-ink hover:underline"
              >
                Wyczyść wszystko
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
