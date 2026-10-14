// The page grid: 12 columns of 74px with 24px gutters, 1152px wide.
import * as React from "react"

// Class names are written out in full so Tailwind generates them.

export const SPAN = ["", "col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-5", "col-span-6", "col-span-7", "col-span-8", "col-span-9", "col-span-10", "col-span-11", "col-span-12"]

export const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6", 7: "grid-cols-7", 8: "grid-cols-8", 9: "grid-cols-9", 10: "grid-cols-10", 11: "grid-cols-11", 12: "grid-cols-12" }

// The first column a piece starts on, and how many rows it spans. A piece can
// start on any column line, so a row may leave cells empty; what it cannot do is
// sit between column lines.
export const START = ["", "col-start-1", "col-start-2", "col-start-3", "col-start-4", "col-start-5", "col-start-6", "col-start-7", "col-start-8", "col-start-9", "col-start-10", "col-start-11", "col-start-12"]

export const ROWS = ["", "row-span-1", "row-span-2", "row-span-3", "row-span-4", "row-span-5", "row-span-6", "row-span-7", "row-span-8", "row-span-9", "row-span-10", "row-span-11", "row-span-12"]

// Every component takes `span` (columns it takes in a Grid), `start` (the column
// it starts on; default: the next free cell), `rowSpan` (rows it spans) and `className`.
export type Placed = { span?: number; start?: number; rowSpan?: number; className?: string }

// The grid classes for a placed piece.
export function place({ span, start, rowSpan }: Placed) {
  return [span ? SPAN[span] : "", start ? START[start] : "", rowSpan ? ROWS[rowSpan] : ""].filter(Boolean).join(" ") || undefined
}

// How many page columns the content around a piece is wide: 9 in a side section
// body, 12 in a stacked one, a Grid's own cols, a Block's span. A Grid (or a
// FigureStrip with `span`) without `cols` takes it, so its columns are the
// page's columns and everything in it lands on them.
export const Width = React.createContext(9)
