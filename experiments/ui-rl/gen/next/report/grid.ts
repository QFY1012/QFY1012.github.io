// The page grid: 12 columns of 74px with 24px gutters, 1152px wide.
// Class names are written out in full so Tailwind generates them.

export const SPAN = ["", "col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-5", "col-span-6", "col-span-7", "col-span-8", "col-span-9", "col-span-10", "col-span-11", "col-span-12"]

export const COLS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 6: "grid-cols-6", 9: "grid-cols-9", 12: "grid-cols-12" }

// Every component takes `span` (columns it takes in a Grid) and `className`.
export type Placed = { span?: number; className?: string }
