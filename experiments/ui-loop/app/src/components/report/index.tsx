// Report components: the page frame and the content pieces a report is built from.
// Content components draw with render.tsx (the same code the eval-set pages were
// rendered with); the frame components take JSX children.
//
// Frame (swiss): 12 columns of 74px with 24px gutters, 1152px wide. Section titles
// hang in the left 3 columns; section content sits in the right 9.
import * as React from "react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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

// Screenshots: one screen per Figure, laid out in a FigureStrip that scrolls
// sideways on a shadcn ScrollArea. Every image is drawn at the same height and
// keeps its own width, so phone screenshots and wider analysis screenshots line
// up in one row without being cropped; anything past the right edge is clipped
// and reached with the scrollbar. The scrollbar only appears while the strip is
// hovered: an always-visible bar reads as a rule under the row of screens, which
// is not a line the design gives.
export function FigureStrip({ className, children, ...props }: React.ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea data-slot="figure-strip" type="hover" className={cn("w-full min-w-0", className)} {...props}>
      <div className="flex w-max gap-12 pb-4">{children}</div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

// The screenshots in a comparison set (one interface plus its colour-vision
// simulations) are read side by side, so they take the content width two to a
// row instead of being shrunk to one strip height. Each image fills its cell and
// keeps its ratio, which keeps the text inside the screenshots legible.
export function FigureGrid({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="figure-grid"
      className={cn(
        "grid w-full grid-cols-2 gap-x-6 gap-y-6",
        "[&>[data-slot=figure]]:w-full [&>[data-slot=figure]]:min-w-0",
        "[&_[data-slot=figure-image]]:h-auto [&_[data-slot=figure-image]]:w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// A group marker: one hairline, the same 1px weight as a table's row lines, with
// an optional label on the line above it. Used where the page groups blocks of
// content (one product per chain-detail group) and the only other rule in sight
// is the table's, so the two read as the same line.
export function Rule({ label, className, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div data-slot="rule" className={cn("flex flex-col gap-2", className)} {...props}>
      {label && <span className="text-xs leading-6 text-muted-foreground">{label}</span>}
      <Separator />
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
