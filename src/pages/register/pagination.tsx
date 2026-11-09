import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PAGE_SIZES } from "@/data/register-logic"

export function Pagination({
  page,
  pageCount,
  size,
  total,
  onPage,
  onSize,
}: {
  page: number
  pageCount: number
  size: number
  total: number
  onPage: (p: number) => void
  onSize: (s: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(page * size, total)
  const nav = "grid size-10 place-items-center rounded-full text-ink-2 outline-none transition-colors hover:bg-fill-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-35"
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-2 pt-4 sm:px-3">
      <p className="tnum text-[13px] text-mute" aria-live="polite">
        <span className="font-semibold text-ink">
          {from}–{to}
        </span>{" "}
        z {total} {total === 1 ? "zapisu" : "zapisów"}
      </p>
      <div className="flex items-center gap-2">
        <nav aria-label="Strony" className="flex items-center rounded-full bg-fill p-0.5 shadow-[inset_0_0_0_1px_var(--hairline)]">
          <button type="button" className={nav} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Poprzednia strona">
            <ChevronLeft className="size-[18px]" />
          </button>
          <span className="tnum min-w-12 text-center text-[13px] font-semibold" aria-current="page">
            {page} / {pageCount}
          </span>
          <button type="button" className={nav} onClick={() => onPage(page + 1)} disabled={page >= pageCount} aria-label="Następna strona">
            <ChevronRight className="size-[18px]" />
          </button>
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Liczba zapisów na stronie: ${size}`}
              className="tnum inline-flex h-11 items-center gap-1.5 rounded-full bg-fill pl-4 pr-3 text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--hairline)] outline-none transition-colors hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-accent"
            >
              {size} na stronie
              <ChevronDown className="size-4 text-mute" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-44" side="top">
            <DropdownMenuRadioGroup value={String(size)} onValueChange={(v) => onSize(Number(v))}>
              {PAGE_SIZES.map((s) => (
                <DropdownMenuRadioItem key={s} value={String(s)} className="tnum">
                  {s} na stronie
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
