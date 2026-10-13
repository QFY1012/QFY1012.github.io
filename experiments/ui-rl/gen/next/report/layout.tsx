// The page frame (swiss): 12 columns of 74px with 24px gutters on an 8px
// baseline. Section titles hang in the left 3 columns; section content sits in
// the right 9, so the left margin stays a regular, empty field that gives the
// page its vertical axis.
import * as React from "react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { COLS, SPAN, type Placed } from "./grid"

// Sections are one empty field apart (24 + 144 + 24 = 192px). The title takes the
// 9-column field; the report's facts sit in the margin column, their last line on
// the title's baseline.
function Page({ title, meta = [], className, children }: { title: string; meta?: string[]; className?: string; children: React.ReactNode }) {
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

// Groups inside a section are one empty field apart, so they stay on field lines.
function Section({ title, description, className, children }: { title: string; description?: string; className?: string; children: React.ReactNode }) {
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

// A group of content, 8px from the title to its content and 24px between the
// content pieces. The group's title is a sub-head: it is set at body size and
// bold, one size step below the section title (14px against the section's
// 20px), so a run of groups reads as separate blocks under their section
// instead of repeating the section heading at its own size.
function Group({ title, className, children }: { title?: string; className?: string; children: React.ReactNode }) {
  return (
    <div data-slot="group" className="flex flex-col gap-2">
      {title && <h3 data-slot="group-title" className="text-sm leading-6 font-semibold">{title}</h3>}
      <div data-slot="group-body" className={cn("flex flex-col gap-6", className)}>{children}</div>
    </div>
  )
}

// Rows are 144px fields unless fields={false}; a child takes `span` columns (and a Block `rows` fields).
function Grid({ cols = 9, fields = true, className, children, span }: Placed & { cols?: number; fields?: boolean; children: React.ReactNode }) {
  return (
    <div data-slot="grid" className={cn("grid gap-x-6 gap-y-6", COLS[cols], span && SPAN[span], className)} style={fields ? { gridAutoRows: "144px" } : undefined}>
      {children}
    </div>
  )
}

// A titled block without card chrome. The title sits directly on the line above
// its content, as a bold subhead does in running text, so lines stay on the 24px
// register. The content is flex-1: a block stretched by its grid row passes the
// height on, so elastic content (charts, distributed lists) can fill the band.
function Block({ span, rows, title, description, className, contentClassName, children }: Placed & { rows?: number; title?: string; description?: string; contentClassName?: string; children: React.ReactNode }) {
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

// A group marker: one hairline, the same 1px weight as a table's row lines, with
// an optional label on the line above it. Used where the page groups blocks of
// content (one product per chain-detail group) and the only other rule in sight
// is the table's, so the two read as the same line.
function Rule({ label, className, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div data-slot="rule" className={cn("flex flex-col gap-2", className)} {...props}>
      {label && <span className="text-xs leading-6 text-muted-foreground">{label}</span>}
      <Separator />
    </div>
  )
}

export { Page, Section, Group, Grid, Block, Rule }
