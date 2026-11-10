import { Fragment, useEffect, useMemo, useRef } from "react"
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, type ColumnOrderState } from "@tanstack/react-table"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AnimatePresence, motion } from "motion/react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, GripVertical } from "lucide-react"
import { Monogram } from "@/components/ui/monogram"
import { Money } from "@/components/app/money"
import { grossOf } from "@/data/register-logic"
import type { RegisterQuery, SortKey, VatDocument } from "@/data/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { KsefValue, RowDetails } from "./document-details"

export const DEFAULT_COLUMN_ORDER: SortKey[] = ["counterparty", "date", "number", "ksef", "identifier", "gross"]

const LABEL: Record<SortKey, string> = {
  counterparty: "Kontrahent",
  date: "Data",
  number: "Numer dokumentu",
  ksef: "Numer KSeF",
  identifier: "Identyfikator",
  gross: "Brutto",
}

const WIDTH: Record<SortKey, string> = {
  counterparty: "w-[26%]",
  date: "w-[11%]",
  number: "w-[20%]",
  ksef: "w-[16%]",
  identifier: "w-[14%]",
  gross: "w-[13%]",
}

const col = createColumnHelper<VatDocument>()

const columns = [
  col.accessor("counterparty", {
    id: "counterparty",
    cell: (c) => (
      <span className="flex min-w-0 items-center gap-3">
        <Monogram name={c.getValue()} className="size-9 text-[12px]" />
        <span className="truncate font-semibold">{c.getValue()}</span>
      </span>
    ),
  }),
  col.accessor("date", {
    id: "date",
    cell: (c) => <span className="tnum text-ink-2">{formatDate(c.getValue())}</span>,
  }),
  col.accessor("number", {
    id: "number",
    cell: (c) => <span className="block truncate font-medium" title={c.getValue()}>{c.getValue()}</span>,
  }),
  col.display({
    id: "ksef",
    cell: (c) => <KsefValue doc={c.row.original} quiet />,
  }),
  col.accessor("identifier", {
    id: "identifier",
    cell: (c) => <span className="tnum text-ink-2">{c.getValue()}</span>,
  }),
  col.display({
    id: "gross",
    cell: (c) => <Money grosze={grossOf(c.row.original)} className="justify-end text-[14.5px]" />,
  }),
]

const announcements: Announcements = {
  onDragStart: ({ active }) => `Podniesiono kolumnę ${LABEL[active.id as SortKey]}.`,
  onDragOver: ({ active, over }) =>
    over ? `Kolumna ${LABEL[active.id as SortKey]} jest nad kolumną ${LABEL[over.id as SortKey]}.` : undefined,
  onDragEnd: ({ active, over }) =>
    over ? `Kolumna ${LABEL[active.id as SortKey]} upuszczona w miejscu kolumny ${LABEL[over.id as SortKey]}.` : undefined,
  onDragCancel: ({ active }) => `Anulowano przenoszenie kolumny ${LABEL[active.id as SortKey]}.`,
}

function SortGlyph({ state }: { state: "asc" | "desc" | false }) {
  if (state === "asc") return <ArrowUp className="size-3.5 text-accent" strokeWidth={2.4} />
  if (state === "desc") return <ArrowDown className="size-3.5 text-accent" strokeWidth={2.4} />
  return <ArrowUpDown className="size-3.5 text-stone opacity-0 transition-opacity group-hover/th:opacity-100" strokeWidth={2.2} />
}

function HeaderCell({
  id,
  sortState,
  onSort,
}: {
  id: SortKey
  sortState: "asc" | "desc" | false
  onSort: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const right = id === "gross"
  return (
    <th
      ref={setNodeRef}
      scope="col"
      aria-sort={sortState === "asc" ? "ascending" : sortState === "desc" ? "descending" : "none"}
      style={{ transform: CSS.Translate.toString(transform ? { ...transform, y: 0 } : null), transition }}
      className={cn(
        "group/th relative h-12 border-b border-hairline px-2 text-[12.5px] font-semibold text-mute",
        WIDTH[id],
        isDragging && "z-10",
      )}
    >
      <div
        className={cn(
          "relative flex items-center rounded-xl transition-[background-color,box-shadow]",
          right && "justify-end",
          isDragging && "bg-[var(--glass-control-hover)] shadow-[0_8px_24px_-8px_rgb(var(--shadow-ink)/0.35)]",
        )}
      >
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "inline-flex h-9 min-w-0 items-center gap-1.5 rounded-lg px-1.5 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent",
            sortState && "text-ink",
            right && "flex-row-reverse",
          )}
        >
          <span className="truncate">{LABEL[id]}</span>
          <SortGlyph state={sortState} />
        </button>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Przenieś kolumnę ${LABEL[id]}`}
          aria-roledescription="kolumna do przeniesienia"
          className={cn(
            "absolute top-1/2 grid size-7 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-md bg-[var(--glass-control-hover)] text-stone opacity-0 outline-none transition-opacity hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing group-hover/th:opacity-100",
            right ? "left-0" : "right-0",
          )}
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>
    </th>
  )
}

export function RegisterTable({
  rows,
  query,
  onSort,
  columnOrder,
  onColumnOrderChange,
  expandedId,
  onToggle,
  dimmed,
}: {
  rows: VatDocument[]
  query: RegisterQuery
  onSort: (sort: RegisterQuery["sort"]) => void
  columnOrder: SortKey[]
  onColumnOrderChange: (order: SortKey[]) => void
  expandedId: string | null
  onToggle: (id: string) => void
  dimmed: boolean
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sorting = useMemo(() => (query.sort ? [query.sort] : [{ id: "date", desc: false }]), [query.sort])

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnOrder: columnOrder as ColumnOrderState, sorting },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    getRowId: (r) => r.id,
  })

  const cycleSort = (id: SortKey) => {
    // Each column cycles: first direction → opposite → back to the register's
    // natural order. Amounts start from the largest, everything else from A/oldest.
    const current = query.sort ?? { id: "date" as SortKey, desc: false }
    const firstDesc = id === "gross"
    if (current.id !== id) return onSort({ id, desc: firstDesc })
    if (current.desc === firstDesc) return onSort({ id, desc: !firstDesc })
    onSort(null)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = columnOrder.indexOf(active.id as SortKey)
    const to = columnOrder.indexOf(over.id as SortKey)
    onColumnOrderChange(arrayMove(columnOrder, from, to))
  }

  // A deep link from search lands on a document: bring it into view once.
  const scrolledFor = useRef<string | null>(null)
  useEffect(() => {
    if (!expandedId || scrolledFor.current === expandedId) return
    const el = document.getElementById(`row-${expandedId}`)
    if (el) {
      scrolledFor.current = expandedId
      el.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [expandedId, rows])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Aby przenieść kolumnę, naciśnij spację lub Enter. Strzałkami w lewo i w prawo wybierz miejsce, ponownie naciśnij spację lub Enter, aby upuścić, albo Escape, aby anulować.",
        },
      }}
    >
      <table className="w-full table-fixed border-separate border-spacing-0 text-[14px]">
        <caption className="sr-only">Dokumenty w rejestrze</caption>
        <thead>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            <tr>
              {table.getHeaderGroups()[0].headers.map((h) => {
                const id = h.column.id as SortKey
                const s = sorting[0]
                return (
                  <HeaderCell
                    key={h.id}
                    id={id}
                    sortState={s.id === id ? (s.desc ? "desc" : "asc") : false}
                    onSort={() => cycleSort(id)}
                  />
                )
              })}
              <th scope="col" className="h-12 w-14 border-b border-hairline">
                <span className="sr-only">Szczegóły</span>
              </th>
            </tr>
          </SortableContext>
        </thead>
        <tbody className={cn("transition-opacity duration-200", dimmed && "opacity-55")}>
          {table.getRowModel().rows.map((row, i) => {
            const open = expandedId === row.id
            const last = i === rows.length - 1
            return (
              <Fragment key={row.id}>
                <tr
                  id={`row-${row.id}`}
                  onClick={() => onToggle(row.id)}
                  className={cn(
                    "group/row cursor-pointer transition-colors duration-150",
                    open ? "bg-fill" : "hover:bg-fill/70",
                  )}
                >
                  {row.getVisibleCells().map((cell, ci) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "h-16 px-3.5 align-middle",
                        (!last || open) && "border-b border-hairline",
                        open && "border-transparent",
                        cell.column.id === "gross" && "text-right",
                        ci === 0 && "rounded-l-[18px]",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td
                    className={cn(
                      "h-16 rounded-r-[18px] pr-2.5 text-right align-middle",
                      (!last || open) && "border-b border-hairline",
                      open && "border-transparent",
                    )}
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`details-${row.id}`}
                      aria-label={`${open ? "Zwiń" : "Rozwiń"} szczegóły: ${row.original.number}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle(row.id)
                      }}
                      className="glass-control grid size-9 place-items-center rounded-full text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <ChevronDown
                        className={cn("size-[17px] transition-transform duration-300 ease-[var(--ease-out-expo)]", open && "rotate-180")}
                      />
                    </button>
                  </td>
                </tr>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.tr key="details" id={`details-${row.id}`} className="bg-fill">
                      <td colSpan={columnOrder.length + 1} className={cn("p-0", !last && "border-b border-hairline")}>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3">
                            <RowDetails doc={row.original} />
                          </div>
                        </motion.div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </DndContext>
  )
}
