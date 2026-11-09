import * as React from "react"
import { Popover as P } from "radix-ui"
import { cn } from "@/lib/utils"

export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverAnchor = P.Anchor
export const PopoverClose = P.Close

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  collisionPadding = 12,
  ...props
}: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "glass-strong anim-pop z-50 max-w-[calc(100vw-24px)] rounded-[22px] p-4 text-ink outline-none",
          className,
        )}
        {...props}
      />
    </P.Portal>
  )
}
