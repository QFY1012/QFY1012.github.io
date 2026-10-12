"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

// A bar that carries a count. Three things are drawn so the count can be read
// without a legend: the track (the baseline the bar is measured from), optional
// ticks on that baseline (the scale), and an optional threshold mark (a
// reference value the count is judged against, e.g. the 4.5 contrast minimum).
// The fill is a two-pixel rule in the foreground ink, dark enough to read
// against the lighter track; it is still a line, not a filled block, so it
// never outweighs the number it annotates.
function Progress({
  className,
  value,
  max = 100,
  ticks,
  threshold,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  // value and max are the count and the top of its scale, not a percentage.
  max?: number
  ticks?: number[]
  threshold?: number
}) {
  const at = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn("relative h-4 w-full", className)}
      {...props}
    >
      <div
        data-slot="progress-track"
        className="absolute inset-x-0 bottom-0 border-t border-border"
      />
      {ticks?.map((t, i) => (
        <div
          key={i}
          data-slot="progress-tick"
          aria-hidden="true"
          className="absolute bottom-0 h-2 border-l border-muted-foreground/50"
          style={{ left: at(t) }}
        />
      ))}
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="absolute bottom-0 left-0 border-t-2 border-foreground transition-all"
        style={{ width: at(value ?? 0) }}
      />
      {threshold != null && (
        <div
          data-slot="progress-threshold"
          aria-hidden="true"
          className="absolute inset-y-0 border-l border-destructive"
          style={{ left: at(threshold) }}
        />
      )}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
