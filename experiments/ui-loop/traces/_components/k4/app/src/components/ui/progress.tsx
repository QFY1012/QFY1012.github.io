"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

// A bar that carries a count, not an alarm: it is drawn as a hairline on a
// slightly lighter rule, the same weight as the table's row lines, so it never
// outweighs the text it annotates. The rule and the bar are both drawn as
// borders, never as a filled background: the design has no panels or fills,
// only lines.
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-px w-full overflow-hidden", className)}
      {...props}
    >
      <div
        data-slot="progress-track"
        className="absolute inset-0 border-t border-border"
      />
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="absolute inset-y-0 left-0 border-t border-muted-foreground transition-all"
        style={{ width: `${value || 0}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
