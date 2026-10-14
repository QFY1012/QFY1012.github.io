import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { place, type Placed } from "./grid"

type StatProps = Placed & {
  label?: string
  value: React.ReactNode
  unit?: string
  size?: "lg" | "xl"
  // the number comes first, so a row of figures can align on their baselines
  captionBelow?: boolean
  quiet?: boolean
  delta?: string
  note?: string
  direction?: "up" | "down"
}

// A key figure.
function Stat({ label, value, unit, size, captionBelow, quiet, delta, note, direction, span, start, rowSpan, className }: StatProps) {
  return (
    <div data-slot="custom-stat" className={cn(cn("flex flex-col", captionBelow ? "gap-0" : "gap-2"), place({ span, start, rowSpan }), className)}>
      {label && !captionBelow && <span className="text-sm leading-6 text-muted-foreground">{label}</span>}
      <div className="flex items-baseline gap-2">
        <span className={cn("font-light tabular-nums", size === "lg" ? "text-5xl leading-[60px]" : size === "xl" ? "text-[44px] leading-[56px]" : "text-3xl leading-9")}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {label && captionBelow && <span className={quiet ? "text-xs leading-6 text-muted-foreground" : "text-sm leading-6"}>{label}</span>}
      {(delta || note) && (
        <div className="flex items-center gap-2">
          {delta && (
            <Badge variant="outline" className={direction === "down" ? "text-destructive" : undefined}>
              {delta}
            </Badge>
          )}
          {/* without a delta badge the note carries the change, so a fall is drawn in the destructive colour */}
          {note && <span className={cn("text-xs leading-6", !delta && direction === "down" ? "text-destructive" : "text-muted-foreground")}>{note}</span>}
        </div>
      )}
    </div>
  )
}

export { Stat }
