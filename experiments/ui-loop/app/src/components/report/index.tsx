// Report components: the page frame and the content pieces a report is built from.
// Content components draw with render.tsx (the same code the eval-set pages were
// rendered with); the frame components take JSX children.
//
// Frame (swiss): 12 columns of 74px with 24px gutters, 1152px wide. Section titles
// hang in the left 3 columns; section content sits in the right 9.
import * as React from "react"

import { cn } from "@/lib/utils"
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
