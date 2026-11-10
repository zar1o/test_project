import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Command } from "cmdk"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, CornerDownLeft, Lock, LoaderCircle, Search, SearchX, WifiOff, X } from "lucide-react"
import { Dialog, FullscreenContent } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { Monogram } from "@/components/ui/monogram"
import { Money } from "@/components/app/money"
import { searchDocuments } from "@/data/api"
import { REGISTER_NAMES } from "@/data/fixtures"
import { AREA_NAV } from "@/data/navigation"
import { DEFAULT_QUERY, normalize, paramsFromQuery } from "@/data/register-logic"
import type { SearchResult, VatDocument } from "@/data/types"
import { useDebounced } from "@/hooks/use-debounced"
import { useIsMobile } from "@/hooks/use-media-query"
import { formatDateShort } from "@/lib/format"
import { useScenario } from "@/lib/scenario"
import { cn } from "@/lib/utils"
import { iconHover } from "./icon-hover"

const PLACEHOLDER = "Szukaj dokumentów, kontrahentów, numerów KSeF…"
const PLACEHOLDER_SHORT = "Szukaj dokumentów"

function periodOf(doc: VatDocument) {
  const [year, month] = doc.date.split("-").map(Number)
  return { year, month }
}

export function docHref(doc: VatDocument) {
  const p = paramsFromQuery(
    { ...DEFAULT_QUERY, register: doc.register, ...periodOf(doc), q: doc.number },
    { dok: doc.id },
  )
  return `/rejestry-vat?${p}`
}

function useDocumentSearch(term: string) {
  const { scenario } = useScenario()
  const debounced = useDebounced(term.trim(), 160)
  const query = useQuery({
    queryKey: ["search", debounced, scenario],
    queryFn: ({ signal }) => searchDocuments(debounced, scenario, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  })
  const settling = debounced !== term.trim() || query.isFetching
  return { ...query, settling, debounced }
}

function matchAreas(t: string) {
  return t ? AREA_NAV.filter((a) => normalize(a.label).includes(t) || a.keywords.includes(t)) : AREA_NAV.slice(0, 1)
}

/** cmdk does not re-select when results arrive async: keep the best hit active. */
function useActiveItem(term: string, data: SearchResult | undefined) {
  const [value, setValue] = useState("")
  useEffect(() => {
    const doc = data?.documents[0]
    const area = matchAreas(normalize(term))[0]
    setValue(doc ? doc.doc.id : area ? `area-${area.id}` : "")
    // Re-evaluate only when results change, not on every keystroke.
  }, [data])
  return [value, setValue] as const
}

const groupStyles =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-mute"

const itemStyles =
  "flex min-h-14 cursor-pointer items-center gap-3 rounded-[18px] px-3 py-2 outline-none transition-colors data-[selected=true]:bg-fill-hover data-[disabled=true]:cursor-default"

function Results({
  term,
  search,
  onPick,
}: {
  term: string
  search: ReturnType<typeof useDocumentSearch>
  onPick: (href: string) => void
}) {
  const t = normalize(term)
  const areas = matchAreas(t)
  const docs = search.data?.documents ?? []
  const count = search.data?.documentCount ?? 0

  if (search.isError) {
    return (
      <Command.List className="p-2">
        <div role="alert" className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-danger-tint text-danger">
            <WifiOff className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Wyszukiwarka jest chwilowo niedostępna</p>
            <p className="mt-1 text-sm text-mute">Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.</p>
          </div>
          <button
            type="button"
            onClick={() => search.refetch()}
            className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
          >
            {search.isFetching ? "Ponawiam…" : "Spróbuj ponownie"}
          </button>
        </div>
      </Command.List>
    )
  }

  const nothing = t && !search.settling && count === 0 && areas.length === 0

  return (
    <Command.List className={cn("max-h-[min(58vh,460px)] overflow-y-auto overscroll-contain p-2", groupStyles)}>
      {nothing && (
        <div role="status" className="flex flex-col items-center gap-3 px-6 py-9 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-tint text-accent">
            <SearchX className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Brak wyników dla „{term.trim()}”</p>
            <p className="mt-1 max-w-[40ch] text-sm text-mute">
              Szukaj po nazwie kontrahenta, numerze dokumentu, identyfikatorze lub numerze KSeF.
            </p>
          </div>
        </div>
      )}

      {!t && !search.isPending && docs.length === 0 && (
        <p className="px-3 py-6 text-center text-sm text-mute">Organizacja nie ma jeszcze dokumentów.</p>
      )}

      {docs.length > 0 && (
        <Command.Group heading={t ? `Dokumenty · ${count}` : "Ostatnie dokumenty"}>
          {docs.slice(0, t ? 6 : 4).map(({ doc, gross }) => (
            <Command.Item key={doc.id} value={doc.id} onSelect={() => onPick(docHref(doc))} className={itemStyles}>
              <Monogram name={doc.counterparty} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold">{doc.counterparty}</span>
                <span className="block truncate text-[12.5px] text-mute">
                  {doc.number} · {REGISTER_NAMES[doc.register].short}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <Money grosze={gross} className="text-[14.5px]" />
                <span className="block pt-1 text-[12px] text-mute">{formatDateShort(doc.date)}</span>
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {t && count > 6 && (
        <Command.Item
          value="show-all"
          onSelect={() => {
            const first = docs[0].doc
            const [year, month] = first.date.split("-").map(Number)
            onPick(`/rejestry-vat?${paramsFromQuery({ ...DEFAULT_QUERY, register: first.register, year, month, q: term.trim() })}`)
          }}
          className={cn(itemStyles, "min-h-11 justify-center text-[13.5px] font-semibold text-accent")}
        >
          Pokaż wszystkie ({count}) w rejestrze
          <ArrowRight className="size-4" />
        </Command.Item>
      )}

      {areas.length > 0 && (
        <Command.Group heading="Obszary">
          {areas.map((a) => (
            <Command.Item
              key={a.id}
              value={`area-${a.id}`}
              disabled={!a.to}
              onSelect={() => a.to && onPick(a.to)}
              className={itemStyles}
            >
              <span className={cn("grid size-10 place-items-center rounded-full", a.to ? "bg-accent-tint text-accent" : "bg-neutral-tint text-stone")}>
                <a.icon className="size-[18px]" />
              </span>
              <span className={cn("flex-1 text-[14.5px] font-semibold", !a.to && "text-mute")}>{a.label}</span>
              {a.to ? (
                <ArrowRight className="size-4 text-mute" />
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-stone">
                  <Lock className="size-3.5" />
                  Niedostępne w demo
                </span>
              )}
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </Command.List>
  )
}

function Hints() {
  return (
    <div className="hidden items-center gap-4 border-t border-hairline px-5 py-3 text-xs text-mute md:flex">
      <span className="flex items-center gap-1.5">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> wybierz
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>
          <CornerDownLeft className="size-3" />
        </Kbd>
        otwórz
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>esc</Kbd> zamknij
      </span>
    </div>
  )
}

function InlineSearch() {
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const search = useDocumentSearch(term)
  const [active, setActive] = useActiveItem(term, search.data)
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [])

  return (
    <Command
      ref={rootRef}
      value={active}
      onValueChange={setActive}
      shouldFilter={false}
      loop
      label="Wyszukiwanie dokumentów"
      className="relative z-20 w-full"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          if (open) setOpen(false)
          else setTerm("")
        } else if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
          setOpen(true)
        }
      }}
    >
      <div
        {...iconHover("search")}
        className={cn(
          "glass sheen flex h-12 items-center gap-2.5 rounded-full pl-4 pr-1.5 transition-shadow duration-200",
          open && "shadow-[var(--glass-shadow-float),inset_0_1px_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-edge)]",
        )}
      >
        <Search className="size-[18px] shrink-0 text-ink-2" strokeWidth={2} />
        <Command.Input
          ref={inputRef}
          value={term}
          onValueChange={(v) => {
            setTerm(v)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={PLACEHOLDER}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none"
        />
        {search.settling && term ? (
          <LoaderCircle className="size-5 shrink-0 animate-spin text-mute" aria-label="Szukam" />
        ) : null}
        {term ? (
          <button
            type="button"
            aria-label="Wyczyść wyszukiwanie"
            onClick={() => {
              setTerm("")
              inputRef.current?.focus()
            }}
            className="grid size-10 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-fill hover:text-ink"
          >
            <X className="size-[18px]" />
          </button>
        ) : (
          <span className="mr-2 flex shrink-0 gap-1">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top center" }}
            className="glass-strong absolute inset-x-0 top-[calc(100%+10px)] overflow-hidden rounded-[28px] text-left"
          >
            <Results
              term={term}
              search={search}
              onPick={(href) => {
                setOpen(false)
                navigate(href)
              }}
            />
            <Hints />
          </motion.div>
        )}
      </AnimatePresence>
    </Command>
  )
}

function MobileSearch() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const navigate = useNavigate()
  const search = useDocumentSearch(term)
  const [active, setActive] = useActiveItem(term, search.data)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass flex h-12 w-full items-center gap-2.5 rounded-full pl-4 pr-4 text-left"
      >
        <Search className="size-5 shrink-0 text-ink-2" strokeWidth={2} />
        <span className="truncate text-[15px] font-medium text-stone">{PLACEHOLDER_SHORT}</span>
      </button>
      <FullscreenContent title="Wyszukiwanie dokumentów" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command
          value={active}
          onValueChange={setActive}
          shouldFilter={false}
          loop
          label="Wyszukiwanie dokumentów"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-center gap-2 px-3 pb-2 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Zamknij wyszukiwanie"
              className="glass-control grid size-11 shrink-0 place-items-center rounded-full"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex h-12 flex-1 items-center gap-2 rounded-full bg-fill pl-4 pr-1.5 shadow-[inset_0_0_0_1px_var(--hairline)]">
              <Search className="size-[18px] shrink-0 text-mute" />
              <Command.Input
                autoFocus
                value={term}
                onValueChange={setTerm}
                placeholder={PLACEHOLDER_SHORT}
                className="h-full min-w-0 flex-1 bg-transparent text-base font-medium outline-none"
              />
              {search.settling && term && <LoaderCircle className="size-[18px] shrink-0 animate-spin text-mute" />}
              {term && (
                <button
                  type="button"
                  aria-label="Wyczyść wyszukiwanie"
                  onClick={() => setTerm("")}
                  className="grid size-9 place-items-center rounded-full text-mute"
                >
                  <X className="size-[18px]" />
                </button>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 [&_[cmdk-list]]:!max-h-none [&_[cmdk-list]]:h-full">
            <Results
              term={term}
              search={search}
              onPick={(href) => {
                setOpen(false)
                navigate(href)
              }}
            />
          </div>
        </Command>
      </FullscreenContent>
    </Dialog>
  )
}

export function GlobalSearch() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileSearch /> : <InlineSearch />
}
