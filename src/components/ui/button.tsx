import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Revolut grammar: every button is a pill. The loudest action is an ink pill
// (white on dark theme); glass capsules carry secondary actions.

const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[0.01em] outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-[var(--ease-out-quart)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        glass: "glass-control sheen text-ink",
        soft: "bg-fill text-ink hover:bg-fill-hover",
        ghost: "text-ink-2 hover:bg-fill hover:text-ink",
        accent: "bg-accent-tint text-accent hover:bg-accent-tint/80",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px] [&_svg]:size-4",
        md: "h-11 px-4.5 text-sm [&_svg]:size-[18px]",
        lg: "h-13 px-6 text-[15px] [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
        "icon-sm": "size-9 [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "glass", size: "md" },
  },
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { buttonVariants }
