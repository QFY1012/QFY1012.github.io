// Renders a UI spec (the generator's output) with the shadcn/ui components.
// Every spec node's outer element carries data-spec="<id>" so that injected
// defects and judge marks can be traced back to the spec.
import * as React from "react"
import { CircleAlert } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
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

type Ctx = { span?: number }

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
  switch (node.type) {
    case "page":
      return (
        <main {...mark(node)} data-slot="page" className={outer(node, ctx, "mx-auto flex w-full max-w-6xl flex-col gap-24 px-0 py-16")}>
          <header data-slot="page-header" className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{p.title}</h1>
            {p.subtitle && <p className="text-sm text-muted-foreground">{p.subtitle}</p>}
          </header>
          {kids(node)}
        </main>
      )

    case "section":
      return (
        <section {...mark(node)} data-slot="section" className={cn("flex flex-col gap-6", ctx.span && SPAN[ctx.span])}>
          <div data-slot="section-header" className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{p.title}</h2>
            {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
          </div>
          <div data-slot="section-body" className={cn("flex flex-col gap-12", node.className)}>
            {kids(node)}
          </div>
        </section>
      )

    case "group":
      return (
        <div {...mark(node)} data-slot="group" className={cn("flex flex-col gap-4", ctx.span && SPAN[ctx.span])}>
          {p.title && <h3 className="text-lg font-medium">{p.title}</h3>}
          <div data-slot="group-body" className={cn("flex flex-col gap-6", node.className)}>
            {kids(node)}
          </div>
        </div>
      )

    case "grid":
      return (
        <div {...mark(node)} data-slot="grid" className={outer(node, ctx, "grid grid-cols-12 gap-6")}>
          {(node.children ?? []).map((c, i) => (
            <Node key={c.id ?? i} node={c} ctx={{ span: c.span ?? 12 }} />
          ))}
        </div>
      )

    // A titled block without card chrome. Inside spacing (12px) is kept below
    // the 24px between blocks, since nothing but space separates them.
    case "block":
      return (
        <div {...mark(node)} data-slot="block" className={outer(node, ctx, "flex flex-col gap-3")}>
          {(p.title || p.description) && (
            <div data-slot="block-header" className="flex flex-col gap-1">
              {p.title && <h3 className="text-base leading-6 font-semibold">{p.title}</h3>}
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
            </div>
          )}
          <div data-slot="block-content" className={cn("flex flex-col gap-3", node.contentClassName as string)}>
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
        <div {...mark(node)} data-slot="custom-stat" className={outer(node, ctx, "flex flex-col gap-2")}>
          <span className="text-sm text-muted-foreground">{p.label}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{p.value}</span>
            {p.unit && <span className="text-sm text-muted-foreground">{p.unit}</span>}
          </div>
          {(p.delta || p.note) && (
            <div className="flex items-center gap-2">
              {p.delta && (
                <Badge variant="outline" className={dir === "down" ? "text-destructive" : undefined}>
                  {p.delta}
                </Badge>
              )}
              {p.note && <span className="text-xs text-muted-foreground">{p.note}</span>}
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
      const cols = p.columns as { key: string; label: string; align?: "left" | "right" }[]
      const rows = p.rows as Record<string, React.ReactNode>[]
      return (
        <div {...mark(node)} data-slot="custom-table" className={outer(node, ctx)}>
          <Table>
            {p.caption && <TableCaption>{p.caption}</TableCaption>}
            <TableHeader>
              <TableRow>
                {cols.map((c) => (
                  <TableHead key={c.key} className={c.align === "right" ? "text-right" : undefined}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {cols.map((c) => (
                    <TableCell key={c.key} className={c.align === "right" ? "text-right tabular-nums" : undefined}>
                      {r[c.key]}
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
      const height = (p.height as string) ?? "h-60"
      const horizontal = p.layout === "horizontal"
      const data = p.data as Record<string, unknown>[]
      // Horizontal bars read like a ranked list: category, a thin bar in the
      // same ink as the progress bars, the value at its end. No grid or value
      // axis; the height follows the number of bars.
      if (node.type === "bar-chart" && horizontal && series.length === 1) {
        const key = series[0].key
        return (
          <div {...mark(node)} data-slot="custom-chart" className={outer(node, ctx)}>
            <ChartContainer config={cfg} className="aspect-auto w-full" style={{ height: data.length * 52 }}>
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
      return (
        <div {...mark(node)} data-slot="custom-chart" className={outer(node, ctx)}>
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
              <LineChart data={p.data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey={p.xKey} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
                {series.map((s) => (
                  <Line key={s.key} dataKey={s.key} stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
              </LineChart>
            )}
          </ChartContainer>
        </div>
      )
    }

    case "progress-list":
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
      const items = p.items as { title: string; description?: string; meta?: string }[]
      return (
        <ItemGroup {...mark(node)} className={outer(node, ctx)}>
          {items.map((it, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ItemSeparator />}
              <Item size="sm" className="px-0">
                <ItemContent>
                  <ItemTitle>{it.title}</ItemTitle>
                  {it.description && <ItemDescription>{it.description}</ItemDescription>}
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
        <dl {...mark(node)} data-slot="custom-kv" className={outer(node, ctx, "grid grid-cols-2 gap-x-4 gap-y-3 text-sm")}>
          {(p.items as { label: string; value: string }[]).map((it, i) => (
            <React.Fragment key={i}>
              <dt className="text-muted-foreground">{it.label}</dt>
              <dd className="text-right font-medium tabular-nums">{it.value}</dd>
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
