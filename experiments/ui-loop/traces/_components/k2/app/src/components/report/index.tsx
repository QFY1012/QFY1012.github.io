// Report components: the page frame and the content pieces a report is built from.
// Content components draw with render.tsx (the same code the eval-set pages were
// rendered with); the frame components take JSX children.
//
// Frame (swiss): 12 columns of 74px with 24px gutters, 1152px wide. Section titles
// hang in the left 3 columns; section content sits in the right 9.
import * as React from "react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { Node, type SpecNode } from "./render"

const SPAN = ["", "col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-5", "col-span-6", "col-span-7", "col-span-8", "col-span-9", "col-span-10", "col-span-11", "col-span-12"]
const COLS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 6: "grid-cols-6", 9: "grid-cols-9", 12: "grid-cols-12" }

type Placed = { span?: number; className?: string }

export function Page({ title, meta = [], className, children }: { title: string; meta?: string[]; className?: string; children: React.ReactNode }) {
  return (
    <main data-slot="page" className={cn("mx-auto flex w-full max-w-6xl flex-col gap-[192px] py-[72px]", className)}>
      <header data-slot="page-header" className="grid h-36 grid-cols-12 content-start items-baseline-last gap-x-6">
        <div className="col-span-3 flex flex-col text-sm leading-6 text-muted-foreground">
          {meta.map((m, i) => <span key={i}>{m}</span>)}
        </div>
        <h1 className="col-span-9 text-5xl leading-[48px] font-medium">{title}</h1>
      </header>
      {children}
    </main>
  )
}

export function Section({ title, description, className, children }: { title: string; description?: string; className?: string; children: React.ReactNode }) {
  return (
    <section data-slot="section" className="grid grid-cols-12 items-start gap-x-6">
      <div data-slot="section-header" className="col-span-3 flex flex-col">
        <h2 className="text-xl leading-6 font-medium">{title}</h2>
        {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      <div data-slot="section-body" className={cn("col-span-9 flex flex-col gap-[192px]", className)}>{children}</div>
    </section>
  )
}

export function Group({ title, className, children }: { title?: string; className?: string; children: React.ReactNode }) {
  return (
    <div data-slot="group" className="flex flex-col gap-2">
      {title && <h3 className="text-sm leading-6 font-semibold">{title}</h3>}
      <div data-slot="group-body" className={cn("flex flex-col gap-6", className)}>{children}</div>
    </div>
  )
}

// A labelled rule that marks where one group ends and the next begins (the
// products in a chain, one block of screenshots after another). The two lines
// are the same 1px border as a table row, so a grouping mark reads at the same
// weight as the rest of the page instead of as a heavier grey bar.
export function GroupMarker({ className, children, ...props }: React.ComponentProps<typeof Marker>) {
  return (
    <Marker variant="separator" className={cn("leading-6", className)} {...props}>
      <MarkerContent>{children}</MarkerContent>
    </Marker>
  )
}

// Rows are 144px fields unless fields={false}; a child takes `span` columns (and a Block `rows` fields).
export function Grid({ cols = 9, fields = true, className, children, span }: Placed & { cols?: number; fields?: boolean; children: React.ReactNode }) {
  return (
    <div data-slot="grid" className={cn("grid gap-x-6 gap-y-6", COLS[cols], span && SPAN[span], className)} style={fields ? { gridAutoRows: "144px" } : undefined}>
      {children}
    </div>
  )
}

export function Block({ span, rows, title, description, className, contentClassName, children }: Placed & { rows?: number; title?: string; description?: string; contentClassName?: string; children: React.ReactNode }) {
  return (
    <div data-slot="block" className={cn("flex min-h-0 flex-col", span && SPAN[span], className)} style={rows ? { gridRow: `span ${rows}` } : undefined}>
      {(title || description) && (
        <div data-slot="block-header" className="flex flex-col">
          {title && <h3 className="text-sm leading-6 font-semibold">{title}</h3>}
          {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      )}
      <div data-slot="block-content" className={cn("flex flex-1 flex-col gap-3", contentClassName)}>{children}</div>
    </div>
  )
}

// Content components: props are the fields documented in components.md.
const content = (type: string) =>
  function Content(props: Placed & Record<string, unknown>) {
    return <Node node={{ type, ...props } as SpecNode} ctx={{ span: props.span }} />
  }

export const Stat = content("stat")
export const DataTable = content("table")
export const TrendChart = content("line-chart")
export const BarChart = content("bar-chart")
export const ProgressList = content("progress-list")
export const List = content("list")
export const KV = content("kv")

export function Text({ children, className, span }: Placed & { children: string }) {
  return <Node node={{ type: "text", text: children, className }} ctx={{ span }} />
}

// The line of small print a table needs for its units, thresholds and how the
// values were read. It is a block, so it sits flush with the table's left edge
// (put it directly under the DataTable) instead of centring under the table.
export function TableNote({ className, span, ...props }: Placed & React.ComponentProps<"p">) {
  return <p data-slot="table-note" className={cn("text-xs leading-6 text-muted-foreground", span && SPAN[span], className)} {...props} />
}

// A few counts drawn as thin bars, one row each: label, bar, value, and a scale
// under the group. The bar and its track are the page's 1px hairline weight and
// a light grey ink, so the group shares the table's alignment line and a value
// baseline without pulling weight away from the text.
type BarItem = { label: string; value: number; display?: string }
export function BarList({ items, max, ticks, className, span, ...props }: Placed & { items: BarItem[]; max?: number; ticks?: number[] } & React.ComponentProps<"div">) {
  const hi = max ?? Math.max(...items.map((it) => it.value), 1)
  const scale = ticks ?? Array.from(new Set([0, Math.round(hi / 2), hi]))
  return (
    <div data-slot="bar-list" className={cn("flex flex-col gap-2", span && SPAN[span], className)} {...props}>
      {items.map((it, i) => (
        <div key={i} className="grid h-6 grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate">{it.label}</span>
          {/* A hairline bar drawn with borders, not a filled track: the filled part and the
              rest sit on the same 1px line as the page's rules, so the group keeps the
              table's weight instead of laying down a block of colour. */}
          <div className="flex items-center">
            <span className="shrink-0 border-t border-muted-foreground" style={{ width: `${(it.value / hi) * 100}%` }} />
            <span className="flex-1 border-t border-border" />
          </div>
          <span className="text-right tabular-nums text-muted-foreground">{it.display ?? it.value}</span>
        </div>
      ))}
      <div className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3">
        <span />
        <div className="flex justify-between border-t border-border pt-1 text-xs leading-6 text-muted-foreground tabular-nums">
          {scale.map((t) => <span key={t}>{t}</span>)}
        </div>
        <span />
      </div>
    </div>
  )
}

// Screenshots: one screen per Figure, laid out in a FigureStrip that scrolls
// sideways on a shadcn ScrollArea. Every image is drawn at the same height and
// keeps its own width, so phone screenshots and wider analysis screenshots line
// up in one row without being cropped; anything past the right edge is clipped
// and reached with the scrollbar.
export function FigureStrip({ className, children, ...props }: React.ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea data-slot="figure-strip" type="always" className={cn("w-full min-w-0", className)} {...props}>
      <div className="flex w-max gap-12 pb-4">{children}</div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

// A strip that keeps its scrollbar out of the way: at rest there is no bar
// under the group (the shadcn ScrollArea shows one only while the strip is
// hovered), so a short row of screens sits clean under its label.
export function FigureRow({ className, children, ...props }: React.ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea data-slot="figure-row" className={cn("w-full min-w-0", className)} {...props}>
      <div className="flex w-max gap-6 pb-4">{children}</div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

const FIGURE_COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }

// Comparison views side by side: every cell is the same width and the images
// fill their cell, so four screens fit the content column two by two with the
// text inside them still readable. Nothing overflows, so no scrollbar appears.
export function FigureGrid({ cols = 2, className, children, ...props }: React.ComponentProps<"div"> & { cols?: number }) {
  return (
    <div
      data-slot="figure-grid"
      className={cn(
        "grid gap-6",
        FIGURE_COLS[cols] ?? FIGURE_COLS[2],
        "[&>[data-slot=figure]]:w-full [&_[data-slot=figure-image]]:h-auto [&_[data-slot=figure-image]]:w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// As wide as its image: the label and text wrap under it instead of widening (and stretching) the image.
export function Figure({ className, ...props }: React.ComponentProps<"figure">) {
  return <figure data-slot="figure" className={cn("flex w-min shrink-0 flex-col gap-2", className)} {...props} />
}

// The image keeps its own ratio at the strip's height, so nothing is cropped.
export function FigureImage({ className, ...props }: React.ComponentProps<"img">) {
  return <img data-slot="figure-image" className={cn("h-96 w-auto max-w-none", className)} {...props} />
}

// The screen or view name, on the line the design gives 12px notes.
export function FigureLabel({ className, ...props }: React.ComponentProps<"figcaption">) {
  return <figcaption data-slot="figure-label" className={cn("text-xs leading-6 text-muted-foreground", className)} {...props} />
}

// What happens on the screen (content, action, fields), in body type.
export function FigureText({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="figure-text" className={cn("text-sm leading-6", className)} {...props} />
}
