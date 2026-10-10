// Renders a UI spec (the generator's output) with the shadcn/ui components.
// Every spec node's outer element carries data-spec="<id>" so that injected
// defects and judge marks can be traced back to the spec.
import * as React from "react"
import { CircleAlert } from "lucide-react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type SpecNode = {
  id?: string
  type: string
  className?: string
  contentClassName?: string
  span?: number
  src?: string | string[]
  children?: SpecNode[]
  [key: string]: unknown
}

const GRID_COLS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 9: "grid-cols-9", 12: "grid-cols-12" }

// The page frame, chosen by the spec: "swiss" (default) hangs section titles in
// the left 3 of 12 columns; "column" is one 1040px column with section titles
// above their content.
type Frame = "swiss" | "column"
const FrameContext = React.createContext<Frame>("swiss")

// Static strings so Tailwind generates them.
const SPAN = [
  "",
  "col-span-1",
  "col-span-2",
  "col-span-3",
  "col-span-4",
  "col-span-5",
  "col-span-6",
  "col-span-7",
  "col-span-8",
  "col-span-9",
  "col-span-10",
  "col-span-11",
  "col-span-12",
]

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type Ctx = { span?: number; rows?: number }

function mark(node: SpecNode) {
  return { "data-spec": node.id, "data-type": node.type }
}

function outer(node: SpecNode, ctx: Ctx, base?: string) {
  return cn(base, ctx.span ? SPAN[ctx.span] : undefined, node.className)
}

function kids(node: SpecNode) {
  return (node.children ?? []).map((c, i) => <Node key={c.id ?? i} node={c} />)
}

type Series = { key: string; label: string }

function chartConfig(series: Series[]): ChartConfig {
  const cfg: ChartConfig = {}
  series.forEach((s, i) => {
    cfg[s.key] = { label: s.label, color: CHART_COLORS[i % CHART_COLORS.length] }
  })
  return cfg
}

export function Node({ node, ctx = {} }: { node: SpecNode; ctx?: Ctx }) {
  const p = node as Record<string, any>
  const frame = React.useContext(FrameContext)
  switch (node.type) {
    // Page and section frame (Swiss layout): 12 columns of 74px with 24px
    // gutters on an 8px baseline. Section titles hang in the left 3 columns;
    // content sits in the 9 columns to the right, so the left margin stays a
    // regular, empty field that gives the page its vertical axis.
    case "page":
      if (p.frame === "column")
        return (
          <FrameContext.Provider value="column">
            <main {...mark(node)} data-slot="page" className={outer(node, ctx, "mx-auto flex w-full max-w-[1040px] flex-col gap-[88px] py-[88px]")}>
              <header data-slot="page-header" className="flex flex-col">
                {((p.meta as string[] | undefined) ?? []).length > 0 && (
                  <span className="text-[13px] leading-6 text-muted-foreground">{(p.meta as string[]).join(" · ")}</span>
                )}
                <h1 className="mt-3 text-[44px] leading-[56px] font-semibold">{p.title}</h1>
                {p.lead && <p className="mt-6 max-w-[760px] text-xl leading-[34px] font-light text-foreground/75">{p.lead}</p>}
              </header>
              {kids(node)}
            </main>
          </FrameContext.Provider>
        )
      return (
        // Modular grid: 4 columns of 270px (each divisible into thirds) by fields of
        // 144px (six 24px lines) with a one-line interval. Sections are one empty
        // field apart (24 + 144 + 24 = 192px).
        <main {...mark(node)} data-slot="page" className={outer(node, ctx, "mx-auto flex w-full max-w-6xl flex-col gap-[192px] py-[72px]")}>
          {/* The title takes the 9-column field; the report's facts sit in the
              margin column, their last line on the title's baseline. */}
          <header data-slot="page-header" className="grid h-36 grid-cols-12 content-start items-baseline-last gap-x-6">
            <div className="col-span-3 flex flex-col text-sm leading-6 text-muted-foreground">
              {((p.meta as string[] | undefined) ?? (p.subtitle ? [p.subtitle as string] : [])).map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
            <h1 className="col-span-9 text-5xl leading-[48px] font-medium">{p.title}</h1>
          </header>
          {kids(node)}
        </main>
      )

    case "section":
      if (frame === "column")
        return (
          <section {...mark(node)} data-slot="section" className={cn("flex flex-col", ctx.span && SPAN[ctx.span])}>
            {/* title on the left, a note (units, period) on the right, a hairline under both */}
            <div data-slot="section-header" className="mb-6 flex items-baseline justify-between gap-6 border-b pb-3">
              <h2 className="text-[22px] leading-8 font-semibold">{p.title}</h2>
              {(p.aside || p.description) && <span className="text-[13px] text-muted-foreground">{p.aside ?? p.description}</span>}
            </div>
            <div data-slot="section-body" className={cn("flex flex-col gap-6", node.className)}>
              {kids(node)}
            </div>
          </section>
        )
      return (
        <section {...mark(node)} data-slot="section" className={cn("grid grid-cols-12 items-start gap-x-6", ctx.span && SPAN[ctx.span])}>
          <div data-slot="section-header" className="col-span-3 flex flex-col">
            <h2 className="text-xl leading-6 font-medium">{p.title}</h2>
            {p.description && <p className="text-sm leading-6 text-muted-foreground">{p.description}</p>}
          </div>
          {/* groups inside a section are one empty field apart, so they stay on field lines */}
          <div data-slot="section-body" className={cn("col-span-9 flex flex-col gap-[192px]", node.className)}>
            {kids(node)}
          </div>
        </section>
      )

    case "group":
      return (
        <div {...mark(node)} data-slot="group" className={cn("flex flex-col gap-2", ctx.span && SPAN[ctx.span])}>
          {p.title && <h3 className="text-sm leading-6 font-semibold">{p.title}</h3>}
          <div data-slot="group-body" className={cn("flex flex-col gap-6", node.className)}>
            {kids(node)}
          </div>
        </div>
      )

    case "grid":
      return (
        // Fields: rows are 48px with 24px intervals; a child takes `rows` whole fields.
        <div
          {...mark(node)}
          data-slot="grid"
          className={outer(
            node,
            ctx,
            cn(
              "grid gap-x-6 gap-y-6",
              GRID_COLS[(p.cols as number) ?? 12],
              // ruled: a dark rule over the row and hairlines between its cells
              p.ruled && "gap-x-0 border-t border-foreground [&>*]:pt-4 [&>*]:pr-6 [&>*+*]:border-l [&>*+*]:pl-6",
            ),
          )}
          // fields: false lets rows take their content's height instead of whole 144px fields
          style={p.fields === false ? undefined : { gridAutoRows: "144px" }}
        >
          {(node.children ?? []).map((c, i) => (
            <Node key={c.id ?? i} node={c} ctx={{ span: c.span ?? ((p.cols as number) ?? 12), rows: c.rows as number | undefined }} />
          ))}
        </div>
      )

    // A titled block without card chrome: 8px from title to content, 16px
    // between parts, both below the 24px / 40px between blocks.
    case "block":
      return (
        // The block title sits directly on the line above its content, as a bold
        // subhead does in running text: no extra space, so lines stay on the 24px register.
        <div {...mark(node)} data-slot="block" className={outer(node, ctx, "flex min-h-0 flex-col")} style={ctx.rows ? { gridRow: `span ${ctx.rows}` } : undefined}>
          {(p.title || p.description) && (
            <div data-slot="block-header" className="flex flex-col">
              {p.title && <h3 className="text-sm leading-6 font-semibold">{p.title}</h3>}
              {p.description && <p className="text-sm leading-6 text-muted-foreground">{p.description}</p>}
            </div>
          )}
          {/* flex-1: a block stretched by its grid row passes the height on, so
              elastic content (charts, distributed lists) can fill the band. */}
          <div data-slot="block-content" className={cn("flex flex-1 flex-col gap-3", node.contentClassName as string)}>
            {kids(node)}
          </div>
        </div>
      )

    case "card":
      return (
        <Card {...mark(node)} className={outer(node, ctx)}>
          {(p.title || p.description || p.badge) && (
            <CardHeader>
              {p.title && <CardTitle>{p.title}</CardTitle>}
              {p.description && <CardDescription>{p.description}</CardDescription>}
              {p.badge && (
                <CardAction>
                  <Badge variant="outline">{p.badge}</Badge>
                </CardAction>
              )}
            </CardHeader>
          )}
          <CardContent className={cn("flex flex-col gap-6", node.contentClassName as string)}>
            {kids(node)}
          </CardContent>
          {p.footer && (
            <CardFooter className="text-sm text-muted-foreground">{p.footer}</CardFooter>
          )}
        </Card>
      )

    case "stat": {
      const dir = p.direction as "up" | "down" | undefined
      return (
        <div {...mark(node)} data-slot="custom-stat" className={outer(node, ctx, cn("flex flex-col", p.captionBelow ? "gap-0" : "gap-2"))}>
          {/* captionBelow: the number comes first, so a row of figures can align on their baselines */}
          {p.label && !p.captionBelow && <span className="text-sm leading-6 text-muted-foreground">{p.label}</span>}
          <div className="flex items-baseline gap-2">
            <span className={cn("font-light tabular-nums", p.size === "lg" ? "text-5xl leading-[60px]" : p.size === "xl" ? "text-[44px] leading-[56px]" : "text-3xl leading-9")}>{p.value}</span>
            {p.unit && <span className="text-sm text-muted-foreground">{p.unit}</span>}
          </div>
          {p.label && p.captionBelow && <span className={p.quiet ? "text-xs leading-6 text-muted-foreground" : "text-sm leading-6"}>{p.label}</span>}
          {(p.delta || p.note) && (
            <div className="flex items-center gap-2">
              {p.delta && (
                <Badge variant="outline" className={dir === "down" ? "text-destructive" : undefined}>
                  {p.delta}
                </Badge>
              )}
              {/* without a delta badge the note carries the change, so a fall is drawn in the destructive colour */}
              {p.note && <span className={cn("text-xs leading-6", !p.delta && dir === "down" ? "text-destructive" : "text-muted-foreground")}>{p.note}</span>}
            </div>
          )}
        </div>
      )
    }

    case "text":
      return (
        <p {...mark(node)} data-slot="text" className={outer(node, ctx, "text-sm leading-6")}>
          {p.text}
        </p>
      )

    case "table": {
      // span: the column's width in grid columns, so cell text starts on a column line.
      // tone: values listed here are drawn in the destructive colour (a state, e.g. 严重).
      // interval: the cell draws the row's estimate (key) with its range (low..high) on an axis shared by the column.
      // muteWhen: the cell is greyed when the row's field equals the value (e.g. not significant).
      type Col = {
        key: string; label: string; align?: "left" | "right"; bar?: boolean; span?: number; tone?: string[]
        interval?: { low: string; high: string; domain: [number, number] }
        muteWhen?: { key: string; equals: unknown }
      }
      const cols = p.columns as Col[]
      const onGrid = cols.some((c) => c.span)
      const rows = p.rows as Record<string, React.ReactNode>[]
      // A numeric column can carry an inline bar, scaled to the column's max.
      const max = Object.fromEntries(cols.filter((c) => c.bar).map((c) => [c.key, Math.max(...rows.map((r) => Number(r[c.key]) || 0))]))
      const interval = (c: Col, r: Record<string, React.ReactNode>, muted: boolean) => {
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
      const cell = (c: Col, v: React.ReactNode, r: Record<string, React.ReactNode>, muted: boolean) =>
        c.interval ? (
          interval(c, r, muted)
        ) : c.bar ? (
          <div className="flex items-center gap-3">
            <span className="w-8 tabular-nums">{v}</span>
            <div className="h-1 flex-1 rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${((Number(v) || 0) / max[c.key]) * 100}%` }} />
            </div>
          </div>
        ) : (
          v
        )
      return (
        <div {...mark(node)} data-slot="custom-table" className={outer(node, ctx)}>
          <Table className={onGrid ? "table-fixed" : undefined}>
            {onGrid && (
              <colgroup>
                {cols.map((c, i) => (
                  // n columns plus the gutter after them; the last column has no gutter
                  <col key={c.key} style={{ width: (c.span ?? 1) * 98 - (i === cols.length - 1 ? 24 : 0) }} />
                ))}
              </colgroup>
            )}
            {p.caption && <TableCaption>{p.caption}</TableCaption>}
            <TableHeader>
              <TableRow>
                {cols.map((c, i) => (
                  <TableHead key={c.key} className={cn(c.align === "right" && "text-right", onGrid && "h-[39px] pl-0 pr-6 text-muted-foreground font-normal", onGrid && i === cols.length - 1 && "pr-0")}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {cols.map((c, i) => (
                    <TableCell
                      key={c.key}
                      className={cn(
                        c.align === "right" && "text-right tabular-nums",
                        // 39px + the 1px row rule = a 40px row
                        onGrid && "h-[39px] py-0 pl-0 pr-6 whitespace-normal",
                        onGrid && i === cols.length - 1 && "pr-0",
                        c.tone?.includes(String(r[c.key])) && "font-medium text-destructive",
                        c.muteWhen && r[c.muteWhen.key] === c.muteWhen.equals && "text-muted-foreground/70",
                      )}
                    >
                      {cell(c, r[c.key], r, !!c.muteWhen && r[c.muteWhen.key] === c.muteWhen.equals)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    case "bar-chart":
    case "line-chart": {
      const series = p.series as Series[]
      const cfg = chartConfig(series)
      // height "fill": the chart takes whatever height its block is given.
      const fill = p.height === "fill"
      const height = fill ? "flex-1 min-h-24" : ((p.height as string) ?? "h-60")
      const horizontal = p.layout === "horizontal"
      const data = p.data as Record<string, unknown>[]
      // Line charts: y range rounded out to tens, one tick every 10.
      const vals = data.flatMap((r) => series.map((x) => Number(r[x.key]))).filter((v) => !Number.isNaN(v))
      const yLo = Math.floor((Math.min(...vals) - 1) / 10) * 10
      const yHi = Math.ceil((Math.max(...vals) + 1) / 10) * 10
      const yTicks = Array.from({ length: (yHi - yLo) / 10 + 1 }, (_, i) => yLo + i * 10)
      // Horizontal bars read like a ranked list: category, a thin bar in the
      // same ink as the progress bars, the value at its end. No grid or value
      // axis; the height follows the number of bars.
      if (node.type === "bar-chart" && horizontal && series.length === 1) {
        const key = series[0].key
        return (
          <div {...mark(node)} data-slot="custom-chart" className={outer(node, ctx)}>
            <ChartContainer config={cfg} className="aspect-auto w-full" style={{ height: data.length * 30 }}>
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }} barCategoryGap={0}>
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis type="category" dataKey={p.xKey} tickLine={false} axisLine={false} width={64} tick={{ fill: "var(--foreground)", fontSize: 13 }} />
                <Bar dataKey={key} fill="var(--primary)" barSize={10} radius={[0, 5, 5, 0]} isAnimationActive={false}>
                  <LabelList dataKey={key} position="right" offset={10} className="fill-muted-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        )
      }
      // One series drawn as a quiet trend: optional y ticks with a grid, a
      // shaded range (band), a zero line, sparse x labels and only the last
      // point labelled.
      if (node.type === "line-chart" && series.length === 1 && (p.band || p.yTicks || p.pointLabels === "last")) {
        const key = series[0].key
        const ticks = p.yTicks as number[] | undefined
        const band = p.band as { low: string; high: string } | undefined
        const rows = band ? data.map((r) => ({ ...r, __band: [r[band.low], r[band.high]] })) : data
        const n = data.length
        return (
          <div {...mark(node)} data-slot="custom-chart" className={outer(node, ctx, fill ? "flex min-h-0 flex-1 flex-col" : undefined)}>
            <ChartContainer config={cfg} className={cn("aspect-auto w-full", height)}>
              <ComposedChart data={rows} margin={{ left: 0, right: 24, top: 24, bottom: 0 }}>
                {ticks && <CartesianGrid vertical={false} strokeOpacity={0.5} />}
                <XAxis dataKey={p.xKey} tickLine={false} axisLine={false} tickMargin={12} fontSize={12} interval={(p.xInterval as number | undefined) ?? "preserveStartEnd"} />
                <YAxis hide={!ticks} domain={ticks ? [ticks[0], ticks[ticks.length - 1]] : ["auto", "auto"]} ticks={ticks} interval={0} tickLine={false} axisLine={false} width={32} fontSize={12} />
                {band && <Area dataKey="__band" stroke="none" fill="var(--foreground)" fillOpacity={0.06} isAnimationActive={false} />}
                {p.zero && <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />}
                <Line dataKey={key} stroke="var(--foreground)" strokeWidth={1.5} dot={false} isAnimationActive={false}>
                  <LabelList
                    dataKey={key}
                    content={(lp: any) =>
                      lp.index === n - 1 ? (
                        <g>
                          <circle cx={lp.x} cy={lp.y} r={3} fill="var(--foreground)" />
                          <text x={lp.x - 6} y={lp.y - 10} textAnchor="end" fontSize={12} fontWeight={500} fill="var(--foreground)">
                            {(p.lastLabel as string | undefined) ?? lp.value}
                          </text>
                        </g>
                      ) : null
                    }
                  />
                </Line>
              </ComposedChart>
            </ChartContainer>
          </div>
        )
      }
      return (
        <div {...mark(node)} data-slot="custom-chart" className={outer(node, ctx, fill ? "flex min-h-0 flex-1 flex-col" : undefined)}>
          <ChartContainer config={cfg} className={cn("aspect-auto w-full", height)}>
            {node.type === "bar-chart" ? (
              <BarChart
                data={p.data}
                layout={horizontal ? "vertical" : "horizontal"}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
                {horizontal ? (
                  <>
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey={p.xKey} tickLine={false} axisLine={false} width={72} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey={p.xKey} tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                  </>
                )}
                {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
                {series.map((s) => (
                  <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={4} isAnimationActive={false} />
                ))}
              </BarChart>
            ) : (
              series.length === 1 ? (
                // One series: no axes or grid; each point carries its value, so
                // the line is read directly (and the values are in the DOM).
                <LineChart data={p.data} margin={{ left: 16, right: 16, top: 24, bottom: 0 }}>
                  <XAxis dataKey={p.xKey} tickLine={false} axisLine={false} tickMargin={12} fontSize={12} interval={0} padding={{ left: 8, right: 8 }} />
                  <YAxis hide domain={[yTicks[0], yTicks[yTicks.length - 1]]} />
                  <Line dataKey={series[0].key} stroke="var(--primary)" strokeWidth={1.5} dot={{ r: 2.5, fill: "var(--primary)", strokeWidth: 0 }} isAnimationActive={false}>
                    <LabelList dataKey={series[0].key} position="top" offset={10} fontSize={12} className="fill-foreground" />
                  </Line>
                </LineChart>
              ) : (
              <LineChart data={p.data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.6} />
                <XAxis dataKey={p.xKey} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                {/* a trend reads by its slope, so the axis fits the data range instead of starting at 0 */}
                <YAxis tickLine={false} axisLine={false} width={32} fontSize={12} domain={[yTicks[0], yTicks[yTicks.length - 1]]} ticks={yTicks} interval={0} />
                {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
                {series.map((s) => (
                  <Line key={s.key} dataKey={s.key} stroke={series.length > 1 ? `var(--color-${s.key})` : "var(--primary)"} strokeWidth={2} dot={{ r: 3, fill: "var(--background)", strokeWidth: 2 }} isAnimationActive={false} />
                ))}
              </LineChart>
              )
            )}
          </ChartContainer>
        </div>
      )
    }

    case "progress-list":
      // compact: one line per item (label, bar, value)
      if (p.compact)
        return (
          <div {...mark(node)} data-slot="custom-progress-list" className={outer(node, ctx, "flex flex-col gap-2")}>
            {(p.items as { label: string; value: number; max?: number; display?: string }[]).map((it, i) => (
              <div key={i} className="grid h-6 grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span>{it.label}</span>
                <Progress value={(it.value / (it.max ?? 100)) * 100} className="h-1 bg-primary/10" />
                <span className="text-right tabular-nums">{it.display ?? it.value}</span>
              </div>
            ))}
          </div>
        )
      return (
        <div {...mark(node)} data-slot="custom-progress-list" className={outer(node, ctx, "flex flex-col gap-4")}>
          {(p.items as { label: string; value: number; max?: number; display?: string }[]).map((it, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span>{it.label}</span>
                <span className="tabular-nums text-muted-foreground">{it.display ?? it.value}</span>
              </div>
              <Progress value={(it.value / (it.max ?? 100)) * 100} />
            </div>
          ))}
        </div>
      )

    case "badges":
      return (
        <div {...mark(node)} data-slot="custom-badges" className={outer(node, ctx, "flex flex-wrap gap-2")}>
          {(p.items as string[]).map((t, i) => (
            <Badge key={i} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      )

    case "list": {
      const items = p.items as { title?: string; description?: string; meta?: string }[]
      // numbered: "01", "02" … instead of 1, 2; columns: the items sit side by
      // side, each with its number (or its meta) as a small line above.
      const num = (i: number) => String(i + 1).padStart(2, "0")
      if (p.columns)
        return (
          <div {...mark(node)} data-slot="custom-list" className={outer(node, ctx, cn("grid gap-x-6 gap-y-6", GRID_COLS[p.columns as number]))}>
            {items.map((it, i) => (
              <div key={i} className="flex flex-col text-sm leading-6">
                {(p.numbered || it.meta) && (
                  <span className={cn("text-xs leading-6", it.meta && p.metaTone === "destructive" ? "text-destructive" : "text-muted-foreground")}>
                    {it.meta ?? num(i)}
                  </span>
                )}
                {it.title && <span className="font-semibold">{it.title}</span>}
                {it.description && <span className="text-foreground/70">{it.description}</span>}
              </div>
            ))}
          </div>
        )
      if (p.numbered)
        return (
          <ol {...mark(node)} data-slot="custom-list" className={outer(node, ctx, "flex flex-col")}>
            {items.map((it, i) => (
              <li key={i} className="grid grid-cols-[48px_1fr] border-b py-5 text-sm leading-6">
                <span className="text-xs leading-6 text-muted-foreground tabular-nums">{num(i)}</span>
                <div className="flex flex-col">
                  {it.title && <span className="font-semibold">{it.title}</span>}
                  {it.description && <span className="text-foreground/70">{it.description}</span>}
                </div>
              </li>
            ))}
          </ol>
        )
      return (
        // Undivided lists: an item's title and description sit tight (two 24px lines),
        // with a 12px gap only between items.
        <ItemGroup {...mark(node)} className={outer(node, ctx, p.divided === false ? "gap-3" : undefined)}>
          {items.map((it, i) => (
            <React.Fragment key={i}>
              {i > 0 && p.divided !== false && <ItemSeparator />}
              <Item size="sm" className={cn(p.divided === false ? "border-0 p-0" : "px-0", p.ordered && "items-start gap-0")}>
                {/* ordered: the items are a sequence (e.g. priority), so they carry their number */}
                {p.ordered && <span className="w-6 shrink-0 text-sm leading-6 font-medium tabular-nums">{i + 1}</span>}
                <ItemContent className={p.divided === false ? "gap-0" : undefined}>
                  <ItemTitle className={p.divided === false ? "leading-6" : undefined}>{it.title}</ItemTitle>
                  {it.description && <ItemDescription className={p.divided === false ? "leading-6" : undefined}>{it.description}</ItemDescription>}
                </ItemContent>
                {it.meta && (
                  <ItemActions>
                    <Badge variant="outline">{it.meta}</Badge>
                  </ItemActions>
                )}
              </Item>
            </React.Fragment>
          ))}
        </ItemGroup>
      )
    }

    case "alert":
      return (
        <Alert {...mark(node)} variant={p.variant ?? "default"} className={outer(node, ctx)}>
          <CircleAlert />
          <AlertTitle>{p.title}</AlertTitle>
          {p.text && <AlertDescription>{p.text}</AlertDescription>}
        </Alert>
      )

    case "kv":
      return (
        // labelCols: the label takes n grid columns and the value starts on the next column line.
        <dl
          {...mark(node)}
          data-slot="custom-kv"
          className={outer(node, ctx, cn("grid text-sm leading-6", p.labelCols ? "gap-x-6 gap-y-0" : "grid-cols-2 gap-x-4 gap-y-3"))}
          style={p.labelCols ? { gridTemplateColumns: `${(p.labelCols as number) * 98 - 24}px 1fr` } : undefined}
        >
          {(p.items as { label: string; value: string }[]).map((it, i) => (
            <React.Fragment key={i}>
              <dt className="text-muted-foreground">{it.label}</dt>
              <dd className={cn("tabular-nums", p.labelCols ? "text-left" : "text-right font-medium")}>{it.value}</dd>
            </React.Fragment>
          ))}
        </dl>
      )

    default:
      return (
        <div {...mark(node)} data-slot="unknown" className="text-destructive">
          unknown node type: {node.type}
        </div>
      )
  }
}
