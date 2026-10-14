import * as React from "react"

import { cn } from "@/lib/utils"
import { place, type Placed } from "./grid"

type KVProps = Placed & {
  items: { label: string; value: string }[]
  // the label takes n grid columns and the value starts on the next column line
  labelCols?: number
}

// Label–value pairs.
function KV({ items, labelCols, span, start, rowSpan, rowStart, className }: KVProps) {
  return (
    <dl
      data-slot="custom-kv"
      className={cn(cn("grid text-sm leading-6", labelCols ? "gap-x-6 gap-y-0" : "grid-cols-2 gap-x-4 gap-y-3"), place({ span, start, rowSpan, rowStart }), className)}
      style={labelCols ? { gridTemplateColumns: `${labelCols * 98 - 24}px 1fr` } : undefined}
    >
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <dt className="text-muted-foreground">{it.label}</dt>
          <dd className={cn("tabular-nums", labelCols ? "text-left" : "text-right font-medium")}>{it.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

export { KV }
