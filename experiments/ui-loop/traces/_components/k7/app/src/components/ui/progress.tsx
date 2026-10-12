"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

// A bar that carries a count, read against a baseline: the value is the length
// of the ink laid along that line, so two counts are told apart by how far the
// bar reaches, not by a tint. The baseline is a hairline the width of the scale
// (zero to max), the same weight and grey as the table's row lines; the bar is
// one pixel of foreground ink sitting on it, so the bar reads as the inked part
// of the line and the line stays as light as every other hairline on the page.
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full", className)}
      {...props}
    >
      <div
        data-slot="progress-baseline"
        className="absolute inset-x-0 bottom-0 border-b border-border"
      />
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="absolute bottom-0 left-0 border-b border-foreground transition-all"
        style={{ width: `${value || 0}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
