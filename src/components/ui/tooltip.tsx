import * as React from "react"
import { Tooltip as T } from "radix-ui"
import { cn } from "@/lib/utils"

export const TooltipProvider = T.Provider
export const Tooltip = T.Root
export const TooltipTrigger = T.Trigger

export function TooltipContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof T.Content>) {
  return (
    <T.Portal>
      <T.Content
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "anim-pop z-50 max-w-64 rounded-xl bg-primary px-3 py-2 text-[12.5px] font-medium leading-snug text-on-primary shadow-lg",
          className,
        )}
        {...props}
      />
    </T.Portal>
  )
}
