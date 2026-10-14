import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { place, type Placed } from "./grid"

type ProgressItem = { label: string; value: number; max?: number; display?: string }

type ProgressListProps = Placed & {
  items: ProgressItem[]
  // one line per item: label, bar, value
  compact?: boolean
}

// Bars read against one scale. The scale runs from zero to the largest count in
// the list unless an item names its own max, so the lengths are comparable inside
// the list. (Falling back to a fixed 0..100 left every count a sliver of the same
// length, which reads as a dashed rule rather than as a value.)
function ProgressList({ items, compact, span, start, rowSpan, className }: ProgressListProps) {
  const scale = Math.max(1, ...items.map((it) => Number(it.value) || 0))
  const bar = (it: { value: number; max?: number }) => ((Number(it.value) || 0) / (it.max ?? scale)) * 100
  // compact: the label column is one grid column (74px) plus the gutter (24px), so
  // the bar starts on the same column line as the table next to it instead of on a
  // line of its own. The value is tabular so the counts line up.
  if (compact)
    return (
      <div data-slot="custom-progress-list" className={cn("flex flex-col gap-2", place({ span, start, rowSpan }), className)}>
        {items.map((it, i) => (
          <div key={i} className="grid h-6 grid-cols-[74px_1fr_2rem] items-center gap-6 text-sm">
            <span>{it.label}</span>
            <Progress value={bar(it)} />
            <span className="text-right tabular-nums">{it.display ?? it.value}</span>
          </div>
        ))}
      </div>
    )
  return (
    <div data-slot="custom-progress-list" className={cn("flex flex-col gap-4", place({ span, start, rowSpan }), className)}>
      {items.map((it, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span>{it.label}</span>
            {/* the count is the row's data, so it is set like every other number on
                the page (same colour, tabular figures) instead of the note grey */}
            <span className="tabular-nums">{it.display ?? it.value}</span>
          </div>
          <Progress value={bar(it)} />
        </div>
      ))}
    </div>
  )
}

export { ProgressList }
