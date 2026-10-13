import * as React from "react"
import { Area, Bar, BarChart as RechartsBarChart, CartesianGrid, ComposedChart, LabelList, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { ChartContainer, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { SPAN, type Placed } from "./grid"

type Series = { key: string; label: string }

type ChartProps = Placed & {
  series: Series[]
  data: Record<string, unknown>[]
  xKey: string
  // a height class (default h-60), or "fill": the chart takes whatever height its block is given
  height?: string
}

// Series colours. A chart on a report page is evidence under a verdict, not the
// page's subject: a palette of four saturated hues made the chart the heaviest
// block on the page and pulled the eye off the conclusion, and it fought the
// page's black-and-grey with one red mark. So a series is drawn in ink, not in
// colour: the first series at full strength and the rest stepping down through
// greys. The order is still readable in greyscale print and to a colour-blind
// reader, the chart's weight stays below the conclusion's, and red is left to
// the verdict alone. The steps are mixed from the page's own tokens, so they
// follow the theme instead of being a second palette beside it.
const SERIES_INK_STEPS = [100, 66, 42, 26]

function seriesInk(i: number) {
  const pct = SERIES_INK_STEPS[i] ?? Math.max(8, 26 - (i - SERIES_INK_STEPS.length + 1) * 6)
  return pct >= 100 ? "var(--foreground)" : `color-mix(in oklab, var(--foreground) ${pct}%, var(--background))`
}

function chartConfig(series: Series[]): ChartConfig {
  const cfg: ChartConfig = {}
  series.forEach((s, i) => {
    cfg[s.key] = { label: s.label, color: seriesInk(i) }
  })
  return cfg
}

// The legend lists the series in the order they are drawn, which is the order
// the ink steps down: darkest first. Recharts' default sorter is the data key,
// which shuffles an ordered palette, so the reader would see the greys out of
// order and read the ramp backwards.
function legendOrder(series: Series[]) {
  return (item: { dataKey?: unknown }) => Math.max(0, series.findIndex((s) => s.key === item.dataKey))
}

function frame(height: string | undefined) {
  const fill = height === "fill"
  return { fill, height: fill ? "flex-1 min-h-24" : (height ?? "h-60") }
}

type TrendChartProps = ChartProps & {
  band?: { low: string; high: string }
  yTicks?: number[]
  pointLabels?: "last"
  zero?: boolean
  xInterval?: number
  lastLabel?: string
}

// A line chart.
function TrendChart({ series, data, xKey, height: h, band, yTicks: ticks, pointLabels, zero, xInterval, lastLabel, span, className }: TrendChartProps) {
  const cfg = chartConfig(series)
  const { fill, height } = frame(h)
  const wrap = cn(fill ? "flex min-h-0 flex-1 flex-col" : undefined, span ? SPAN[span] : undefined, className)
  // One series drawn as a quiet trend: optional y ticks with a grid, a shaded range
  // (band), a zero line, sparse x labels and only the last point labelled.
  if (series.length === 1 && (band || ticks || pointLabels === "last")) {
    const key = series[0].key
    const rows = band ? data.map((r) => ({ ...r, __band: [r[band.low], r[band.high]] })) : data
    const n = data.length
    return (
      <div data-slot="custom-chart" className={wrap}>
        <ChartContainer config={cfg} className={cn("aspect-auto w-full", height)}>
          <ComposedChart data={rows} margin={{ left: 0, right: 24, top: 24, bottom: 0 }}>
            {ticks && <CartesianGrid vertical={false} strokeOpacity={0.5} />}
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={12} fontSize={12} interval={xInterval ?? "preserveStartEnd"} />
            <YAxis hide={!ticks} domain={ticks ? [ticks[0], ticks[ticks.length - 1]] : ["auto", "auto"]} ticks={ticks} interval={0} tickLine={false} axisLine={false} width={32} fontSize={12} />
            {band && <Area dataKey="__band" stroke="none" fill="var(--foreground)" fillOpacity={0.06} isAnimationActive={false} />}
            {zero && <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />}
            <Line dataKey={key} stroke="var(--foreground)" strokeWidth={1.5} dot={false} isAnimationActive={false}>
              <LabelList
                dataKey={key}
                content={(lp: any) =>
                  lp.index === n - 1 ? (
                    <g>
                      <circle cx={lp.x} cy={lp.y} r={3} fill="var(--foreground)" />
                      <text x={lp.x - 6} y={lp.y - 10} textAnchor="end" fontSize={12} fontWeight={500} fill="var(--foreground)">
                        {lastLabel ?? lp.value}
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
  // The y range is rounded out to tens, one tick every 10: a trend reads by its
  // slope, so the axis fits the data range instead of starting at 0.
  const vals = data.flatMap((r) => series.map((x) => Number(r[x.key]))).filter((v) => !Number.isNaN(v))
  const yLo = Math.floor((Math.min(...vals) - 1) / 10) * 10
  const yHi = Math.ceil((Math.max(...vals) + 1) / 10) * 10
  const yTicks = Array.from({ length: (yHi - yLo) / 10 + 1 }, (_, i) => yLo + i * 10)
  return (
    <div data-slot="custom-chart" className={wrap}>
      <ChartContainer config={cfg} className={cn("aspect-auto w-full", height)}>
        {series.length === 1 ? (
          // One series: no axes or grid; each point carries its value, so the line
          // is read directly (and the values are in the DOM).
          <LineChart data={data} margin={{ left: 16, right: 16, top: 24, bottom: 0 }}>
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={12} fontSize={12} interval={0} padding={{ left: 8, right: 8 }} />
            <YAxis hide domain={[yTicks[0], yTicks[yTicks.length - 1]]} />
            <Line dataKey={series[0].key} stroke="var(--primary)" strokeWidth={1.5} dot={{ r: 2.5, fill: "var(--primary)", strokeWidth: 0 }} isAnimationActive={false}>
              <LabelList dataKey={series[0].key} position="top" offset={10} fontSize={12} className="fill-foreground" />
            </Line>
          </LineChart>
        ) : (
          <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.6} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={32} fontSize={12} domain={[yTicks[0], yTicks[yTicks.length - 1]]} ticks={yTicks} interval={0} />
            {series.length > 1 && <ChartLegend content={<ChartLegendContent />} itemSorter={legendOrder(series)} />}
            {series.map((s) => (
              <Line key={s.key} dataKey={s.key} stroke={series.length > 1 ? `var(--color-${s.key})` : "var(--primary)"} strokeWidth={2} dot={{ r: 3, fill: "var(--background)", strokeWidth: 2 }} isAnimationActive={false} />
            ))}
          </LineChart>
        )}
      </ChartContainer>
    </div>
  )
}

// A bar chart; layout="horizontal" draws the bars sideways.
function BarChart({ series, data, xKey, height: h, layout, span, className }: ChartProps & { layout?: "horizontal" }) {
  const cfg = chartConfig(series)
  const { fill, height } = frame(h)
  const horizontal = layout === "horizontal"
  // Horizontal bars of one series read like a ranked list: category, a thin bar in
  // the same ink as the progress bars, the value at its end. No grid or value
  // axis; the height follows the number of bars.
  if (horizontal && series.length === 1) {
    const key = series[0].key
    return (
      <div data-slot="custom-chart" className={cn(span ? SPAN[span] : undefined, className)}>
        <ChartContainer config={cfg} className="aspect-auto w-full" style={{ height: data.length * 30 }}>
          <RechartsBarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }} barCategoryGap={0}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey={xKey} tickLine={false} axisLine={false} width={64} tick={{ fill: "var(--foreground)", fontSize: 13 }} />
            <Bar dataKey={key} fill="var(--primary)" barSize={10} radius={[0, 5, 5, 0]} isAnimationActive={false}>
              <LabelList dataKey={key} position="right" offset={10} className="fill-muted-foreground" fontSize={12} />
            </Bar>
          </RechartsBarChart>
        </ChartContainer>
      </div>
    )
  }
  return (
    <div data-slot="custom-chart" className={cn(fill ? "flex min-h-0 flex-1 flex-col" : undefined, span ? SPAN[span] : undefined, className)}>
      <ChartContainer config={cfg} className={cn("aspect-auto w-full", height)}>
        <RechartsBarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey={xKey} tickLine={false} axisLine={false} width={72} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} />
            </>
          )}
          {series.length > 1 && <ChartLegend content={<ChartLegendContent />} itemSorter={legendOrder(series)} />}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={4} isAnimationActive={false} />
          ))}
        </RechartsBarChart>
      </ChartContainer>
    </div>
  )
}

export { TrendChart, BarChart }
