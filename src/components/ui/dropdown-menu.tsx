import * as React from "react"
import { DropdownMenu as M } from "radix-ui"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export const DropdownMenu = M.Root
export const DropdownMenuTrigger = M.Trigger
export const DropdownMenuGroup = M.Group
export const DropdownMenuRadioGroup = M.RadioGroup
export const DropdownMenuSub = M.Sub

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={12}
        className={cn(
          "glass-strong anim-pop z-50 min-w-56 max-w-[calc(100vw-24px)] rounded-[20px] p-1.5 text-ink outline-none",
          className,
        )}
        {...props}
      />
    </M.Portal>
  )
}

const itemBase =
  "relative flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-[14px] px-3 text-sm font-medium text-ink outline-none transition-colors data-[disabled]:cursor-default data-[disabled]:opacity-45 data-[highlighted]:bg-fill-hover sm:min-h-10 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-mute"

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof M.Item>) {
  return <M.Item className={cn(itemBase, className)} {...props} />
}

export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof M.RadioItem>) {
  return (
    <M.RadioItem className={cn(itemBase, "pr-9", className)} {...props}>
      {children}
      <M.ItemIndicator className="absolute right-3 flex items-center">
        <Check className="!text-accent" strokeWidth={2.4} />
      </M.ItemIndicator>
    </M.RadioItem>
  )
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof M.Label>) {
  return <M.Label className={cn("px-3 pb-1 pt-2 text-xs font-semibold text-mute", className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn("mx-2 my-1.5 h-px bg-hairline", className)} {...props} />
}

export function DropdownMenuSubTrigger({ className, ...props }: React.ComponentProps<typeof M.SubTrigger>) {
  return <M.SubTrigger className={cn(itemBase, "data-[state=open]:bg-fill-hover", className)} {...props} />
}

export function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof M.SubContent>) {
  return (
    <M.Portal>
      <M.SubContent
        sideOffset={6}
        collisionPadding={12}
        className={cn("glass-strong anim-pop z-50 min-w-52 rounded-[20px] p-1.5 text-ink outline-none", className)}
        {...props}
      />
    </M.Portal>
  )
}
