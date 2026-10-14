import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from "@/components/ui/item"
import { place, type Placed } from "./grid"

// Columns for `columns` (no 6 here: a 6-column list has never been laid out on the grid).
const LIST_COLS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 9: "grid-cols-9", 12: "grid-cols-12" }

type ListItem = { title?: string; description?: string; meta?: string }

type ListProps = Placed & {
  items: ListItem[]
  // "01", "02" … with a hairline between rows
  numbered?: boolean
  // 1, 2 … before each item: the items are a sequence (e.g. priority)
  ordered?: boolean
  // the items sit side by side, each with its number (or its meta) as a small line above
  columns?: number
  divided?: boolean
  metaTone?: "destructive"
}

const num = (i: number) => String(i + 1).padStart(2, "0")

// A list. Where `meta` shows depends on the mode: with `columns` it is the small
// line above the title (in red with metaTone="destructive"); with `numbered` it is
// not shown; otherwise it is an outline badge at the right end of the row.
function List({ items, numbered, ordered, columns, divided, metaTone, span, start, rowSpan, className }: ListProps) {
  const cls = (base?: string) => cn(base, place({ span, start, rowSpan }), className)
  if (columns)
    return (
      <div data-slot="custom-list" className={cls(cn("grid gap-x-6 gap-y-6", LIST_COLS[columns]))}>
        {items.map((it, i) => (
          <div key={i} className="flex flex-col text-sm leading-6">
            {(numbered || it.meta) && (
              <span className={cn("text-xs leading-6", it.meta && metaTone === "destructive" ? "text-destructive" : "text-muted-foreground")}>
                {it.meta ?? num(i)}
              </span>
            )}
            {it.title && <span className="font-semibold">{it.title}</span>}
            {it.description && <span className="text-foreground/70">{it.description}</span>}
          </div>
        ))}
      </div>
    )
  if (numbered)
    return (
      <ol data-slot="custom-list" className={cls("flex flex-col")}>
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
  // Undivided lists: an item's title and description sit tight (two 24px lines),
  // with a 12px gap only between items.
  return (
    <ItemGroup className={cls(divided === false ? "gap-3" : undefined)}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && divided !== false && <ItemSeparator />}
          <Item size="sm" className={cn(divided === false ? "border-0 p-0" : "px-0", ordered && "items-start gap-0")}>
            {ordered && <span className="w-6 shrink-0 text-sm leading-6 font-medium tabular-nums">{i + 1}</span>}
            <ItemContent className={divided === false ? "gap-0" : undefined}>
              <ItemTitle className={divided === false ? "leading-6" : undefined}>{it.title}</ItemTitle>
              {it.description && <ItemDescription className={divided === false ? "leading-6" : undefined}>{it.description}</ItemDescription>}
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

export { List }
