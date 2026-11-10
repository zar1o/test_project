import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react"
import { Chip } from "@/components/ui/chip"
import { Segmented } from "@/components/ui/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { Money } from "@/components/app/money"
import { RATE_LABEL, REGISTER_RATES } from "@/data/fixtures"
import type { DayTotal, MonthTotal, RateTotal, RegisterKind, RegisterResult } from "@/data/types"
import { useIsMobile } from "@/hooks/use-media-query"
import { MONTHS_GENITIVE, MONTHS_NOMINATIVE, MONTHS_SHORT, formatMoney, pl } from "@/lib/format"
import { cn } from "@/lib/utils"

// The register at a glance, in one row above the documents:
//   the gross total (the one accent card on the page),
//   net and VAT over time (by day, week or month),
//   and the amounts per VAT rate (the chrome card).
// All three read the same filtered result as the table below them.

const DOCS = ["dokument", "dokumenty", "dokumentów"] as [string, string, string]

/* ------------------------------ Total card ------------------------------ */

function Delta({ gross, previous }: { gross: number; previous: NonNullable<RegisterResult["previous"]> }) {
  if (previous.gross === 0) return null
  const change = ((gross - previous.gross) / Math.abs(previous.gross)) * 100
  const Icon = change >= 0 ? TrendingUp : TrendingDown
  const text = `${change > 0 ? "+" : ""}${change.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`
  const versus = `${MONTHS_NOMINATIVE[previous.month - 1]} ${previous.year}`
  return (
    <span
      title={`Wobec okresu: ${versus} (${formatMoney(previous.gross)})`}
      className="tnum inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-[rgb(6_6_28/0.32)] px-2.5 text-xs font-semibold"
    >
      <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />
      {text}
      <span className="font-medium text-mute">m/m</span>
      <span className="sr-only">w porównaniu z okresem {versus}</span>
    </span>
  )
}

function TotalCard({
  totals,
  count,
  previous,
  periodText,
  unavailable,
  className,
}: {
  totals: RegisterResult["totals"]
  count: number
  previous: RegisterResult["previous"]
  periodText: string
  unavailable: boolean
  className?: string
}) {
  return (
    <section className={cn("card-accent flex flex-col rounded-[28px] p-5 sm:p-6", className)} aria-label="Suma rejestru">
      {/* The lavender glow sits in the top right corner, so the only thing
          placed there is the chip, which brings its own dark ground. */}
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold">
          Brutto <span className="font-medium text-mute">· {periodText}</span>
        </h2>
        {!unavailable && previous && <Delta gross={totals.gross} previous={previous} />}
      </div>

      <div className="mt-2">
        {unavailable ? (
          <span className="font-display text-[clamp(2.3rem,1.75rem+1.7vw,3.1rem)] font-medium leading-none text-stone">
            —
          </span>
        ) : (
          <Money grosze={totals.gross} size="hero" animateChanges />
        )}
      </div>
      {!unavailable && (
        <p className="tnum mt-1.5 text-[13px] font-medium text-mute">
          {count} {pl(count, DOCS)}
        </p>
      )}

      <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-hairline pt-3.5 max-lg:mt-4">
        {(
          [
            ["Netto", totals.net],
            ["VAT", totals.vat],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[12.5px] font-medium text-mute">{label}</dt>
            <dd className="mt-1">
              {unavailable ? (
                <span className="font-display text-2xl text-stone">—</span>
              ) : (
                <Money grosze={value} size="lg" animateChanges />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* --------------------------------- Chart -------------------------------- */

// Net and VAT over time, at three grains of the same filtered result:
// the days of the month, its calendar weeks, or the months of the year.

type Grain = "day" | "week" | "month"

const GRAINS: { value: Grain; label: string; plural: string; column: string }[] = [
  { value: "day", label: "Dzień", plural: "dni", column: "Dzień" },
  { value: "week", label: "Tydzień", plural: "tygodni", column: "Tydzień" },
  { value: "month", label: "Miesiąc", plural: "miesięcy", column: "Miesiąc" },
]

interface Bucket {
  key: string
  /** Label under the bar; null where the axis skips it. */
  axis: string | null
  /** Full name of the bucket, for the tooltip and the table. */
  name: string
  net: number
  vat: number
  count: number
  /** The selected period inside a wider view. */
  current?: boolean
}

function bucketsFor(grain: Grain, days: DayTotal[], months: MonthTotal[], year: number, month: number): Bucket[] {
  const of = MONTHS_GENITIVE[month - 1]
  if (grain === "month") {
    return months.map((m) => ({
      key: `m${m.month}`,
      axis: MONTHS_SHORT[m.month - 1],
      name: `${MONTHS_NOMINATIVE[m.month - 1]} ${year}`,
      net: m.net,
      vat: m.vat,
      count: m.count,
      current: m.month === month,
    }))
  }
  if (grain === "week") {
    // Calendar weeks, Monday to Sunday, cut off at the edges of the month.
    const weeks: DayTotal[][] = []
    for (const d of days) {
      const monday = new Date(year, month - 1, d.day).getDay() === 1
      if (monday || weeks.length === 0) weeks.push([])
      weeks[weeks.length - 1].push(d)
    }
    return weeks.map((w) => {
      const from = w[0].day
      const to = w[w.length - 1].day
      const range = from === to ? `${from}` : `${from}–${to}`
      return {
        key: `w${from}`,
        axis: range,
        name: `${range} ${of} ${year}`,
        net: w.reduce((s, d) => s + d.net, 0),
        vat: w.reduce((s, d) => s + d.vat, 0),
        count: w.reduce((s, d) => s + d.count, 0),
      }
    })
  }
  const n = days.length
  return days.map((d) => ({
    key: `d${d.day}`,
    axis: d.day === 1 || d.day === n || (d.day % 5 === 0 && n - d.day > 2) ? `${d.day}` : null,
    name: `${d.day} ${of} ${year}`,
    net: d.net,
    vat: d.vat,
    count: d.count,
  }))
}

const PLOT_H = 124
const AXIS_H = 20
const PAD_TOP = 6
/** Room for the value axis: plain numbers, or the wider compact ones ("15 tys."). */
const PAD_LEFT_PLAIN = 38
const PAD_LEFT_COMPACT = 50
const SEGMENT_GAP = 2

const axisNumber = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 })
const axisCompact = new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 })

/** Round steps (1, 2, 2.5, 5 × 10ⁿ) that fit the range in at most three intervals. */
function niceStep(range: number) {
  if (range <= 0) return 500
  const rough = range / 3
  const power = 10 ** Math.floor(Math.log10(rough))
  const unit = [1, 2, 2.5, 5, 10].find((u) => u * power >= rough) ?? 10
  return unit * power
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    setWidth(Math.round(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** A bar segment with the data end rounded and the baseline end square. */
function segmentPath(x: number, w: number, yFrom: number, yTo: number, round: boolean) {
  const top = Math.min(yFrom, yTo)
  const bottom = Math.max(yFrom, yTo)
  if (!round) return `M${x},${top}h${w}V${bottom}h${-w}Z`
  const r = Math.min(4, w / 2, bottom - top)
  // yTo is the data end: above the baseline for positive values, below it for negative ones.
  return yTo < yFrom
    ? `M${x},${bottom}V${top + r}q0,${-r} ${r},${-r}h${w - 2 * r}q${r},0 ${r},${r}V${bottom}Z`
    : `M${x},${top}V${bottom - r}q0,${r} ${r},${r}h${w - 2 * r}q${r},0 ${r},${-r}V${top}Z`
}

function BarChart({
  buckets,
  grain,
  replayKey,
}: {
  buckets: Bucket[]
  grain: Grain
  /** Changes when the bars should grow in again (a new period, register or grain). */
  replayKey: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const about = GRAINS.find((g) => g.value === grain)!

  // A bucket index from the previous grain means nothing in the new one.
  useEffect(() => setActive(null), [replayKey])

  const scale = useMemo(() => {
    let up = 0
    let down = 0
    for (const b of buckets) {
      up = Math.max(up, Math.max(0, b.net) + Math.max(0, b.vat))
      down = Math.min(down, Math.min(0, b.net) + Math.min(0, b.vat))
    }
    // grosze -> złote for a readable axis
    const step = niceStep(Math.max(up, -down) / 100)
    const top = Math.max(1, Math.ceil(up / 100 / step)) * step
    // Corrections dip below zero. They get the room they need and no more:
    // a whole extra grid step for one small negative bar would squash the rest.
    const low = down / 100
    const bottom = low < 0 ? Math.min(low * 1.2, -top * 0.06) : 0
    const ticks: number[] = []
    for (let v = Math.ceil(bottom / step) * step; v <= top + 1e-6; v += step) ticks.push(v + 0)
    return { top, bottom, ticks }
  }, [buckets])

  const n = buckets.length
  const compactAxis = scale.top >= 10_000
  const PAD_LEFT = compactAxis ? PAD_LEFT_COMPACT : PAD_LEFT_PLAIN
  const plotW = Math.max(0, width - PAD_LEFT)
  const band = n ? plotW / n : 0
  // Thin marks: a bar never fills its slot, and never passes 24px.
  const barW = grain === "day" ? Math.max(3, Math.min(14, band - 4)) : Math.max(6, Math.min(24, band * 0.42))
  const y = (zl: number) => PAD_TOP + ((scale.top - zl) / (scale.top - scale.bottom)) * PLOT_H
  const y0 = y(0)
  const empty = buckets.every((b) => b.count === 0)

  const move = (dir: 1 | -1) => {
    if (!n) return
    setActive((current) => {
      if (current === null) {
        const withData = buckets.map((b, i) => (b.count > 0 ? i : -1)).filter((i) => i >= 0)
        return withData[dir === 1 ? 0 : withData.length - 1] ?? 0
      }
      return Math.min(n - 1, Math.max(0, current + dir))
    })
  }

  const hovered = active === null ? null : (buckets[active] ?? null)
  const cx = active === null ? 0 : PAD_LEFT + band * (active + 0.5)
  const tipOnRight = active !== null && active < n / 2

  return (
    <div
      ref={ref}
      role="group"
      tabIndex={0}
      aria-label={`Wykres: netto i VAT według ${about.plural}. Strzałki w lewo i w prawo zmieniają słupek.`}
      className="relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ height: PAD_TOP + PLOT_H + AXIS_H }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") move(1)
        else if (e.key === "ArrowLeft") move(-1)
        else if (e.key === "Home") setActive(0)
        else if (e.key === "End") setActive(n - 1)
        else if (e.key === "Escape") setActive(null)
        else return
        e.preventDefault()
      }}
      onBlur={() => setActive(null)}
      onPointerLeave={() => setActive(null)}
    >
      {width > 0 && (
        <svg width={width} height={PAD_TOP + PLOT_H + AXIS_H} className="block" aria-hidden focusable="false">
          {scale.ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD_LEFT}
                x2={width}
                y1={Math.round(y(t)) + 0.5}
                y2={Math.round(y(t)) + 0.5}
                stroke={t === 0 ? "var(--hairline-strong)" : "var(--hairline)"}
              />
              <text
                x={PAD_LEFT - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="tnum fill-[var(--stone)] text-[10.5px] font-medium"
              >
                {compactAxis ? axisCompact.format(t) : axisNumber.format(t)}
              </text>
            </g>
          ))}

          {hovered && (
            <rect x={PAD_LEFT + band * active!} y={PAD_TOP} width={band} height={PLOT_H} rx={4} fill="var(--fill-sunken)" />
          )}

          <g key={replayKey}>
            {buckets.map((b, i) => {
              if (b.count === 0) return null
              const x = PAD_LEFT + band * i + (band - barW) / 2
              const net = b.net / 100
              const vat = b.vat / 100
              const segments: React.ReactNode[] = []
              // Positive values stack upwards from the baseline, negative ones downwards.
              for (const sign of [1, -1] as const) {
                const parts = (
                  [
                    ["net", net],
                    ["vat", vat],
                  ] as const
                ).filter(([, v]) => (sign === 1 ? v > 0 : v < 0))
                let from = 0
                parts.forEach(([key, v], k) => {
                  const last = k === parts.length - 1
                  let a = y(from)
                  const end = y(from + v)
                  // The 2px surface gap is taken out of the upper (outer) segment.
                  if (k > 0) a -= sign * SEGMENT_GAP
                  from += v
                  if (Math.abs(a - end) < 0.75 || (sign === 1 ? end >= a : end <= a)) return
                  segments.push(
                    <path
                      key={`${key}${sign}`}
                      d={segmentPath(x, barW, a, end, last)}
                      fill={key === "net" ? "var(--series-net)" : "var(--series-vat)"}
                    />,
                  )
                })
              }
              return (
                <g
                  key={b.key}
                  className="chart-bar"
                  style={{ transformOrigin: `0px ${y0}px`, animationDelay: `${i * (grain === "day" ? 14 : 40)}ms` }}
                  opacity={active === null || active === i ? 1 : 0.55}
                >
                  {segments}
                </g>
              )
            })}
          </g>

          {buckets.map((b, i) =>
            b.axis === null ? null : (
              <text
                key={b.key}
                x={PAD_LEFT + band * (i + 0.5)}
                y={PAD_TOP + PLOT_H + 15}
                textAnchor="middle"
                className={cn(
                  "tnum text-[10.5px]",
                  b.current ? "fill-[var(--ink)] font-bold" : "fill-[var(--stone)] font-medium",
                )}
              >
                {b.axis}
              </text>
            ),
          )}

          {/* Hit targets: the whole column, far bigger than the bar itself. */}
          {buckets.map((b, i) => (
            <rect
              key={b.key}
              x={PAD_LEFT + band * i}
              y={0}
              width={band}
              height={PAD_TOP + PLOT_H}
              fill="transparent"
              onPointerEnter={() => setActive(i)}
              onPointerDown={() => setActive(i)}
            />
          ))}
        </svg>
      )}

      {empty && width > 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-[42%] pl-[38px] text-center text-[13px] font-medium text-mute">
          Brak dokumentów w tym okresie
        </p>
      )}

      {hovered && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 z-10 w-[176px] rounded-2xl bg-[var(--glass-bg-strong)] p-3 text-left shadow-[var(--glass-shadow-float),inset_0_0_0_1px_var(--glass-edge)]"
          style={tipOnRight ? { left: cx + band / 2 + 8 } : { right: width - cx + band / 2 + 8 }}
        >
          <p className="text-xs font-semibold">{hovered.name}</p>
          {hovered.count === 0 ? (
            <p className="mt-1 text-xs text-mute">Brak dokumentów</p>
          ) : (
            <>
              <p className="tnum text-[11.5px] text-mute">
                {hovered.count} {pl(hovered.count, DOCS)}
              </p>
              <dl className="tnum mt-2 space-y-1 text-xs">
                {(
                  [
                    ["VAT", hovered.vat, "var(--series-vat)"],
                    ["Netto", hovered.net, "var(--series-net)"],
                  ] as const
                ).map(([label, value, color]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-1.5 text-mute">
                      <span aria-hidden className="h-[3px] w-2.5 rounded-full" style={{ background: color }} />
                      {label}
                    </dt>
                    <dd className="font-semibold">{formatMoney(value)}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 border-t border-hairline pt-1.5">
                  <dt className="text-mute">Brutto</dt>
                  <dd className="font-semibold">{formatMoney(hovered.net + hovered.vat)}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      )}

      {/* The same numbers without the picture. */}
      <table className="sr-only">
        <caption>Netto i VAT według {about.plural}</caption>
        <thead>
          <tr>
            <th scope="col">{about.column}</th>
            <th scope="col">Dokumenty</th>
            <th scope="col">Netto</th>
            <th scope="col">VAT</th>
            <th scope="col">Brutto</th>
          </tr>
        </thead>
        <tbody>
          {buckets
            .filter((b) => b.count > 0)
            .map((b) => (
              <tr key={b.key}>
                <th scope="row">{b.name}</th>
                <td>{b.count}</td>
                <td>{formatMoney(b.net)}</td>
                <td>{formatMoney(b.vat)}</td>
                <td>{formatMoney(b.net + b.vat)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

function LegendKey({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: color }} />
      {children}
    </span>
  )
}

function ChartCard({
  days,
  months,
  year,
  month,
  register,
  className,
}: {
  days: DayTotal[]
  months: MonthTotal[]
  year: number
  month: number
  register: RegisterKind
  className?: string
}) {
  const [grain, setGrain] = useState<Grain>("day")
  const buckets = useMemo(() => bucketsFor(grain, days, months, year, month), [grain, days, months, year, month])
  return (
    <section className={cn("glass rounded-[28px] p-5", className)} aria-labelledby="chart-title">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id="chart-title" className="text-[13px] font-semibold text-ink-2">
            Netto i VAT <span className="font-medium text-mute">· zł</span>
          </h2>
          <p className="mt-1 flex items-center gap-3.5 text-xs font-medium text-ink-2">
            <LegendKey color="var(--series-net)">Netto</LegendKey>
            <LegendKey color="var(--series-vat)">VAT</LegendKey>
          </p>
        </div>
        {/* Inside a glass card the switch is a sunken well, not a second pane of glass. */}
        <Segmented
          size="sm"
          label="Okres słupka"
          value={grain}
          onChange={setGrain}
          options={GRAINS.map((g) => ({ value: g.value, label: g.label }))}
          className="!bg-[var(--fill-sunken)] !shadow-none ![backdrop-filter:none] before:hidden max-sm:w-full"
        />
      </div>
      <div className="mt-3">
        <BarChart buckets={buckets} grain={grain} replayKey={`${register}-${year}-${month}-${grain}`} />
      </div>
    </section>
  )
}

/* -------------------------------- Rates --------------------------------- */

function RateRows({ rates, unavailable }: { rates: RateTotal[]; unavailable: boolean }) {
  const totalVat = rates.reduce((s, r) => s + Math.abs(r.vat), 0)
  return (
    <ul className="space-y-2.5">
      {rates.map((r) => {
        const share = totalVat ? Math.abs(r.vat) / totalVat : 0
        return (
          <li key={r.rate} className="grid grid-cols-[2.9rem_minmax(0,1fr)] items-center gap-x-3">
            <span className="tnum inline-flex h-7 items-center justify-center rounded-full bg-fill text-[12.5px] font-semibold shadow-[inset_0_0_0_1px_var(--hairline)]">
              {RATE_LABEL[r.rate]}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="tnum truncate text-xs text-mute">
                  netto {unavailable ? "—" : <Money grosze={r.net} className="text-xs font-medium text-mute" />}
                </p>
                {unavailable ? <span className="text-stone">—</span> : <Money grosze={r.vat} className="text-[14px]" />}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill-sunken">
                <motion.div
                  className="h-full rounded-full bg-[image:var(--rate-bar)]"
                  initial={false}
                  animate={{ width: unavailable ? "0%" : `${Math.max(share * 100, share > 0 ? 3 : 0)}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The rest of the card's title, set like the wordmark at the foot of a site:
 * letters as wide as the card, sunk into its lower edge, on the dark band of
 * horizon a chrome surface reflects. Decoration only: the heading says it too.
 */
function ChromeWordmark({ children }: { children: string }) {
  return (
    <span aria-hidden className="chrome-mark">
      <span className="chrome-mark__text">{children}</span>
    </span>
  )
}

function RatesCard({
  rates,
  unavailable,
  className,
}: {
  rates: RateTotal[]
  unavailable: boolean
  className?: string
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const demo = (
    <Chip size="sm" tone="outline">
      DEMO
    </Chip>
  )

  // On a phone the breakdown folds away: the total and the documents come
  // first. Folded, the card is a single line, so it names itself in full; the
  // wordmark comes with the breakdown.
  if (isMobile) {
    return (
      <section className={cn("card-chrome rounded-[24px] p-1", className)} aria-label="Stawki VAT">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="relative z-10 flex h-12 w-full items-center justify-between rounded-[20px] px-4 text-[14px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Stawki VAT
          <ChevronDown className={cn("size-[18px] text-mute transition-transform duration-300", open && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden"
            >
              <div className="chrome-mark-room relative z-10 px-4 pt-1">
                <div className="mb-3">{demo}</div>
                <RateRows rates={rates} unavailable={unavailable} />
              </div>
              <ChromeWordmark>VAT</ChromeWordmark>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    )
  }

  return (
    <section className={cn("card-chrome flex flex-col rounded-[28px]", className)} aria-labelledby="rates-title">
      <div className="chrome-mark-room relative z-10 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="rates-title" className="text-[13px] font-semibold text-ink-2">
            Stawki<span className="sr-only"> VAT</span>
          </h2>
          {demo}
        </div>
        <div className="mt-3.5">
          <RateRows rates={rates} unavailable={unavailable} />
        </div>
      </div>
      <ChromeWordmark>VAT</ChromeWordmark>
    </section>
  )
}

/* ------------------------------ Composite ------------------------------- */

export function Insights({
  register,
  data,
  isPending,
  isError,
  year,
  month,
}: {
  register: RegisterKind
  data: RegisterResult | undefined
  isPending: boolean
  isError: boolean
  year: number
  month: number
}) {
  const emptyDays = useMemo(
    () => Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => ({ day: i + 1, net: 0, vat: 0, count: 0 })),
    [year, month],
  )
  const emptyMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ month: i + 1, net: 0, vat: 0, count: 0 })), [])

  if (isPending && !data) {
    return (
      <div className="grid gap-3 lg:grid-cols-12" aria-busy="true" aria-label="Wczytywanie podsumowania">
        <div className="glass rounded-[28px] p-6 lg:col-span-4">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="mt-4 h-12 w-60 max-w-full rounded-2xl" />
          <div className="mt-8 flex gap-8">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="glass rounded-[28px] p-5 lg:col-span-5">
          <Skeleton className="h-3.5 w-32" />
          <div className="mt-5 flex h-[124px] items-end gap-2">
            {[52, 30, 0, 44, 22, 68, 36, 18, 84, 40, 28, 60, 20, 30].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="glass rounded-[28px] p-5 max-md:hidden lg:col-span-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-6 h-7 w-full" />
          <Skeleton className="mt-4 h-7 w-full" />
        </div>
      </div>
    )
  }

  const unavailable = isError || !data
  const totals = data?.totals ?? { net: 0, vat: 0, gross: 0 }
  const rates = data?.byRate ?? REGISTER_RATES[register].map((rate) => ({ rate, net: 0, vat: 0 }))

  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <TotalCard
        className="lg:col-span-4"
        totals={totals}
        count={data?.total ?? 0}
        previous={unavailable ? null : (data?.previous ?? null)}
        periodText={`${MONTHS_NOMINATIVE[month - 1]} ${year}`}
        unavailable={unavailable}
      />
      <ChartCard
        className="lg:col-span-5"
        days={unavailable ? emptyDays : (data?.daily ?? emptyDays)}
        months={unavailable ? emptyMonths : (data?.monthly ?? emptyMonths)}
        year={year}
        month={month}
        register={register}
      />
      <RatesCard className="lg:col-span-3" rates={rates} unavailable={unavailable} />
    </div>
  )
}
