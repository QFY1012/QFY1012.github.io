// Screenshots: one screen per Figure, laid out in a FigureStrip (a row that scrolls
// sideways), a FigureGrid (two to a row) or a FigureCompare (four to a row).
import * as React from "react"

import { cn } from "@/lib/utils"
import { COLS, Width, place, type Placed } from "./grid"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Screenshots: one screen per Figure, laid out in a FigureStrip that scrolls
// sideways on a shadcn ScrollArea. The strip is what pins the row height: every
// image is drawn at that one height and keeps its own width, so phone
// screenshots and wider analysis screenshots line up in one row without being
// cropped; anything past the right edge is clipped and reached with the
// scrollbar. The scrollbar only appears while the strip is hovered: an
// always-visible bar reads as a rule under the row of screens, which is not a
// line the design gives.
//
// With `span`, the strip does not scroll: it is a grid on the page's columns,
// each screen takes `span` columns, and the screens wrap onto as many rows as
// they need. Every screen is on the page (a reader, a print and a screenshot see
// all of them) and every one sits on the column lines.
const STRIP_SPAN: Record<number, string> = {
  1: "[&>[data-slot=figure]]:col-span-1",
  2: "[&>[data-slot=figure]]:col-span-2",
  3: "[&>[data-slot=figure]]:col-span-3",
  4: "[&>[data-slot=figure]]:col-span-4",
  6: "[&>[data-slot=figure]]:col-span-6",
}

function FigureStrip({ className, children, span, ...props }: React.ComponentProps<typeof ScrollArea> & { span?: number }) {
  const around = React.useContext(Width)
  if (span)
    return (
      <div
        data-slot="figure-strip"
        className={cn("grid gap-x-6 gap-y-12", COLS[around], STRIP_SPAN[span], "[&>[data-slot=figure]]:w-full [&>[data-slot=figure]]:min-w-0", className)}
      >
        {children}
      </div>
    )
  return (
    <ScrollArea data-slot="figure-strip" type="hover" className={cn("w-full min-w-0", className)} {...props}>
      <div
        data-slot="figure-strip-row"
        className={cn(
          "flex w-max gap-12 pb-4",
          "[&_[data-slot=figure-image]]:h-96 [&_[data-slot=figure-image]]:w-auto",
        )}
      >
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

// The screenshots in a comparison set (one interface plus its colour-vision
// simulations) are read side by side, so they take the content width two to a
// row instead of being shrunk to one strip height. Each image fills its cell and
// keeps its ratio, which keeps the text inside the screenshots legible.
function FigureGrid({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="figure-grid"
      className={cn(
        "grid w-full grid-cols-2 gap-x-6 gap-y-6",
        "[&>[data-slot=figure]]:w-full [&>[data-slot=figure]]:min-w-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// The comparison set for colour vision (the interface plus its simulations) has
// to be read as one group: all four views together, at a size where what is
// inside them still reads, and the whole group inside one screen. Four to a row
// is what does that: the content column is wide enough for four views, and one
// band of four is shorter than two bands of two. The earlier two-by-two put two
// views per screen — the second band fell past the fold, so the reader never had
// the four side by side — and the fixed cell height it needed turned a long
// screenshot into a narrow sliver with the band half empty. Here each view takes
// a quarter of the row and keeps its own ratio; the height is capped only so a
// very long screenshot cannot push the group past the screen, and the caption
// runs the width of its cell, so a narrow view does not wrap its label into a
// column of lines.
function FigureCompare({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="figure-compare"
      className={cn(
        "grid w-full grid-cols-4 gap-x-6 gap-y-6",
        "[&>[data-slot=figure]]:w-full [&>[data-slot=figure]]:min-w-0",
        "[&_[data-slot=figure-image]]:h-auto [&_[data-slot=figure-image]]:w-auto [&_[data-slot=figure-image]]:self-start [&_[data-slot=figure-image]]:max-w-full [&_[data-slot=figure-image]]:max-h-96",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// As wide as its image: the label and text wrap under it instead of widening (and stretching) the image.
// Placed in a Grid (`span`, `start`, `rowSpan`, `rowStart`), it takes its cells instead and the image fills their width,
// so a row of screens can be laid on the page's columns (one product per column group, one stage per row).
function Figure({ className, span, start, rowSpan, rowStart, ...props }: React.ComponentProps<"figure"> & Placed) {
  if (span) return <figure data-slot="figure" className={cn("flex min-w-0 flex-col gap-2", place({ span, start, rowSpan, rowStart }), className)} {...props} />
  return <figure data-slot="figure" className={cn("flex w-min shrink-0 flex-col gap-2", className)} {...props} />
}

// The image takes the width its cell gives it and keeps its own ratio: nothing
// is cropped and no height is fixed here. A strip pins the row height (all its
// images share one height, widths differ); a comparison grid lets the column
// width decide, so a view read for its detail is never squeezed down to a strip
// thumbnail.
function FigureImage({ className, ...props }: React.ComponentProps<"img">) {
  return <img data-slot="figure-image" className={cn("block w-full max-w-none", className)} {...props} />
}

// The screen or view name, on the line the design gives 12px notes.
function FigureLabel({ className, ...props }: React.ComponentProps<"figcaption">) {
  return <figcaption data-slot="figure-label" className={cn("text-xs leading-6 text-muted-foreground", className)} {...props} />
}

// What happens on the screen (content, action, fields), in body type.
function FigureText({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="figure-text" className={cn("text-sm leading-6", className)} {...props} />
}

export { Figure, FigureImage, FigureLabel, FigureText, FigureStrip, FigureGrid, FigureCompare }
