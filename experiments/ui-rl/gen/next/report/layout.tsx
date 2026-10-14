// The page frame (swiss): 12 columns of 74px with 24px gutters on an 8px
// baseline. Section titles hang in the left 3 columns; section content sits in
// the right 9, so the left margin stays a regular, empty field that gives the
// page its vertical axis.
import * as React from "react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { COLS, Width, place, type Placed } from "./grid"

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

// The page's rows are fields: 144px tall with a 24px gutter, so field lines are
// 168px apart, counted from the top of the page header (itself one field).
// A section takes a whole number of fields: once its content is laid out, its
// height is rounded up to n fields (n × 168 − 24), the rest left empty. With the
// 192px gap (24 + 144 + 24, one empty field) every section then starts on a field
// line. Inside a section the content is free: several pieces can share a field as
// long as they fit.
const FIELD = 168, GUTTER = 24

function useWholeFields() {
  const ref = React.useRef<HTMLElement>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      // the content's own height: the header and the body, without the rounding
      const h = Math.max(...[...el.children].map((c) => c.getBoundingClientRect().bottom)) - el.getBoundingClientRect().top
      el.style.minHeight = `${Math.ceil((h + GUTTER) / FIELD) * FIELD - GUTTER}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    for (const c of el.children) ro.observe(c)
    return () => ro.disconnect()
  }, [])
  return ref
}

// Groups inside a section are one empty field apart, so they stay on field lines.
// layout "side" (default): the title hangs in the left 3 columns, the content takes
// the right 9. layout "stack": the title sits above the content and the content
// takes all 12 columns, for what needs the full width (a wide table, a matrix of
// screens). Both keep every edge on the page's column lines.
function Section({ title, description, layout = "side", className, children }: { title: string; description?: string; layout?: "side" | "stack"; className?: string; children: React.ReactNode }) {
  const ref = useWholeFields()
  const stack = layout === "stack"
  return (
    <section ref={ref} data-slot="section" className={cn("grid grid-cols-12 content-start items-start gap-x-6", stack && "gap-y-6")}>
      <div data-slot="section-header" className={cn(stack ? "col-span-12" : "col-span-3", "flex flex-col")}>
        <h2 className="text-xl leading-6 font-medium">{title}</h2>
        {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      <div data-slot="section-body" className={cn(stack ? "col-span-12" : "col-span-9", "flex flex-col gap-[192px]", className)}>
        {stack ? <Width.Provider value={12}>{children}</Width.Provider> : children}
      </div>
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

// Rows are 144px fields unless fields={false}; a child takes `span` columns from
// column `start` (and a Block `rows` fields). Without `cols` the grid has one
// column per page column it is wide (its `span`, else the width around it).
function Grid({ cols, fields = true, className, children, span, start, rowSpan }: Placed & { cols?: number; fields?: boolean; children: React.ReactNode }) {
  const around = React.useContext(Width)
  const n = cols ?? span ?? around
  return (
    <div data-slot="grid" className={cn("grid gap-x-6 gap-y-6", COLS[n], place({ span, start, rowSpan }), className)} style={fields ? { gridAutoRows: "144px" } : undefined}>
      <Width.Provider value={n}>{children}</Width.Provider>
    </div>
  )
}

// A titled block without card chrome. The title sits directly on the line above
// its content, as a bold subhead does in running text, so lines stay on the 24px
// register. The content is flex-1: a block stretched by its grid row passes the
// height on, so elastic content (charts, distributed lists) can fill the band.
// `rowSpan` is how many rows it spans, the same prop every other piece takes.
// `rows` is the old name for it, kept so existing pages render as before.
function Block({ span, start, rowSpan, rows, title, description, className, contentClassName, children }: Placed & { rows?: number; title?: string; description?: string; contentClassName?: string; children: React.ReactNode }) {
  return (
    <div data-slot="block" className={cn("flex min-h-0 flex-col", place({ span, start, rowSpan }), className)} style={rows && !rowSpan ? { gridRow: `span ${rows}` } : undefined}>
      {(title || description) && (
        <div data-slot="block-header" className="flex flex-col">
          {title && <h3 className="text-sm leading-6 font-semibold">{title}</h3>}
          {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      )}
      <div data-slot="block-content" className={cn("flex flex-1 flex-col gap-3", contentClassName)}>{span ? <Width.Provider value={span}>{children}</Width.Provider> : children}</div>
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
