import { cn } from "@/lib/utils"
import { place, type Placed } from "./grid"

// A paragraph of body text.
function Text({ children, className, span, start, rowSpan }: Placed & { children: string }) {
  return (
    <p data-slot="text" className={cn("text-sm leading-6", place({ span, start, rowSpan }), className)}>
      {children}
    </p>
  )
}

export { Text }
