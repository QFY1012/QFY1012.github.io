import { cn } from "@/lib/utils"
import { SPAN, type Placed } from "./grid"

// A paragraph of body text.
function Text({ children, className, span }: Placed & { children: string }) {
  return (
    <p data-slot="text" className={cn("text-sm leading-6", span ? SPAN[span] : undefined, className)}>
      {children}
    </p>
  )
}

export { Text }
