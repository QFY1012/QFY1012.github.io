import * as React from "react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { place, type Placed } from "./grid"

type Column = {
  key: string
  label: string
  align?: "left" | "right"
  // a numeric column can carry an inline bar, scaled to the column's max
  bar?: boolean
  // the column's width in grid columns, so cell text starts on a column line
  span?: number
  // values listed here are a state (e.g. 严重): drawn in the destructive colour and
  // two weights heavier than the body. Red on its own is a lighter grey than black
  // in greyscale printing and is invisible to a colour-blind reader, so the state
  // has to carry a second, non-colour channel: the weight.
  tone?: string[]
  // the values are one ordered scale, low to high (see `step`)
  levels?: string[]
  // the cell draws the row's estimate (key) with its range (low..high) on an axis shared by the column
  interval?: { low: string; high: string; domain: [number, number] }
  // the cell is greyed when the row's field equals the value (e.g. not significant)
  muteWhen?: { key: string; equals: unknown }
}

type Row = Record<string, React.ReactNode>

type DataTableProps = Placed & {
  columns: Column[]
  rows: Row[]
  caption?: string
}

// levels: the top of the scale carries the destructive colour; the step below it
// is bold; the steps under that fall back to the note grey. Colour alone would
// only mark one state, so the weight and the grey carry the rest of the order and
// the reader can rank the values.
function step(c: Column, v: React.ReactNode) {
  const i = c.levels ? c.levels.indexOf(String(v)) : -1
  if (i < 0) return undefined
  const fromTop = c.levels!.length - 1 - i
  return fromTop === 0 ? "font-semibold text-destructive" : fromTop === 1 ? "font-semibold" : "text-muted-foreground"
}

function Interval({ c, r, muted }: { c: Column; r: Row; muted: boolean }) {
  const [lo, hi] = c.interval!.domain
  const x = (v: unknown) => ((Number(v) - lo) / (hi - lo)) * 100
  const ink = muted ? "var(--muted-foreground)" : "var(--foreground)"
  return (
    <svg width="100%" height="16" className="block overflow-visible" aria-label={`${r[c.key]} [${r[c.interval!.low]}, ${r[c.interval!.high]}]`}>
      <line x1={`${x(0)}%`} x2={`${x(0)}%`} y1="-12" y2="28" stroke="var(--border)" />
      <line x1={`${x(r[c.interval!.low])}%`} x2={`${x(r[c.interval!.high])}%`} y1="8" y2="8" stroke={ink} strokeOpacity={muted ? 0.5 : 1} strokeWidth="1.5" />
      <circle cx={`${x(r[c.key])}%`} cy="8" r="3.5" fill={ink} fillOpacity={muted ? 0.5 : 1} />
    </svg>
  )
}

// A table. When any column has `span`, the columns sit on the page grid: each is
// n columns plus the gutter after it, and a row is 39px + the 1px row rule = 40px.
function DataTable({ columns, rows, caption, span, start, rowSpan, className }: DataTableProps) {
  const onGrid = columns.some((c) => c.span)
  const max = Object.fromEntries(columns.filter((c) => c.bar).map((c) => [c.key, Math.max(...rows.map((r) => Number(r[c.key]) || 0))]))
  const muted = (c: Column, r: Row) => !!c.muteWhen && r[c.muteWhen.key] === c.muteWhen.equals
  const cell = (c: Column, v: React.ReactNode, r: Row) =>
    c.interval ? (
      <Interval c={c} r={r} muted={muted(c, r)} />
    ) : c.bar ? (
      <div className="flex items-center gap-3">
        <span className="w-8 tabular-nums">{v}</span>
        {/* the count is drawn as a two-pixel bar on a hairline baseline, so the
            length against that baseline is the difference the eye reads (a
            hairline on a hairline made every row look the same) */}
        <Progress value={((Number(v) || 0) / max[c.key]) * 100} className="flex-1" />
      </div>
    ) : (
      v
    )
  return (
    <div data-slot="custom-table" className={cn(place({ span, start, rowSpan }), className)}>
      <Table className={onGrid ? "table-fixed" : undefined}>
        {onGrid && (
          <colgroup>
            {columns.map((c, i) => (
              // the last column has no gutter after it
              <col key={c.key} style={{ width: (c.span ?? 1) * 98 - (i === columns.length - 1 ? 24 : 0) }} />
            ))}
          </colgroup>
        )}
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={c.key} className={cn(c.align === "right" && "text-right", onGrid && "h-[39px] pl-0 pr-6 text-muted-foreground font-normal", onGrid && i === columns.length - 1 && "pr-0")}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {columns.map((c, i) => (
                <TableCell
                  key={c.key}
                  className={cn(
                    c.align === "right" && "text-right tabular-nums",
                    onGrid && "h-[39px] py-0 pl-0 pr-6 whitespace-normal",
                    onGrid && i === columns.length - 1 && "pr-0",
                    c.tone?.includes(String(r[c.key])) && "font-semibold text-destructive",
                    step(c, r[c.key]),
                    muted(c, r) && "text-muted-foreground/70",
                  )}
                >
                  {cell(c, r[c.key], r)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
