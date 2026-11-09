import * as React from "react"
import { Dialog as D } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close
export const DialogTitle = D.Title
export const DialogDescription = D.Description

function Overlay({ className }: { className?: string }) {
  return <D.Overlay className={cn("anim-fade fixed inset-0 z-50 bg-scrim backdrop-blur-[2px]", className)} />
}

/** Bottom sheet: the phone-native home for details, filters and search. */
export function SheetContent({
  className,
  children,
  title,
  description,
  hideTitle,
  ...props
}: React.ComponentProps<typeof D.Content> & { title: string; description?: string; hideTitle?: boolean }) {
  return (
    <D.Portal>
      <Overlay />
      <D.Content
        onOpenAutoFocus={(e) => {
          // Land focus on the sheet itself, not on its close button: screen
          // readers start at the title and no ring flashes on open.
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)?.focus()
        }}
        className={cn(
          "glass-strong anim-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[min(88dvh,760px)] flex-col rounded-t-[28px] pb-[max(env(safe-area-inset-bottom),12px)] text-ink outline-none sm:inset-x-auto sm:left-1/2 sm:w-[560px] sm:-translate-x-1/2",
          className,
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-hairline-strong" />
        <div className={cn("flex shrink-0 items-start justify-between gap-4 px-5 pt-3", hideTitle && "sr-only")}>
          <div className="min-w-0">
            <D.Title className="font-display text-xl font-medium leading-tight tracking-[-0.01em]">{title}</D.Title>
            {description && <D.Description className="mt-1 text-[13px] text-mute">{description}</D.Description>}
          </div>
          <D.Close className="glass-control -mr-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-2" aria-label="Zamknij">
            <X className="size-[18px]" />
          </D.Close>
        </div>
        {!description && <D.Description className="sr-only">{title}</D.Description>}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 pt-4">{children}</div>
      </D.Content>
    </D.Portal>
  )
}

/** Full-height panel for phone search: keyboard-safe, no layout under it. */
export function FullscreenContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof D.Content> & { title: string }) {
  return (
    <D.Portal>
      <Overlay className="bg-transparent backdrop-blur-0" />
      <D.Content
        className={cn(
          "glass-strong anim-fade fixed inset-0 z-50 flex flex-col pt-[env(safe-area-inset-top)] text-ink outline-none",
          className,
        )}
        {...props}
      >
        <D.Title className="sr-only">{title}</D.Title>
        <D.Description className="sr-only">{title}</D.Description>
        {children}
      </D.Content>
    </D.Portal>
  )
}
