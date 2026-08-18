import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* ── Reference Image 2 Button System ────────────────────────────────────────
   Dark metallic interior + silver/white edge + soft inner top highlight +
   grayscale depth. NO purple, NO color gradients.
   ────────────────────────────────────────────────────────────────────────── */

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black border border-white hover:bg-zinc-200 active:scale-[0.98]",
        primary:
          "bg-white text-black border border-white hover:bg-zinc-200 active:scale-[0.98]",
        solid:
          "bg-white text-black border border-white hover:bg-zinc-200 active:scale-[0.98]",
        secondary:
          "bg-zinc-950 text-zinc-200 border border-white/20 hover:bg-zinc-900 hover:text-white hover:border-white/40 active:scale-[0.98]",
        outline:
          "bg-transparent text-zinc-300 border border-white/15 hover:bg-zinc-900 hover:text-white hover:border-white/30 active:scale-[0.98]",
        ghost:
          "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60 active:bg-zinc-900 rounded-lg",
        destructive:
          "bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/40 active:scale-[0.98]",
        nav: "text-zinc-400 hover:text-white font-medium p-0 h-auto bg-transparent rounded-none",
      },
      size: {
        default: "h-9 px-5 text-[11px]",
        sm: "h-8 px-4 text-[10px]",
        lg: "h-11 px-7 text-xs tracking-wider",
        pill: "h-9 px-5 text-[11px] rounded-full",
        icon: "size-9 p-0 rounded-full",
        "icon-sm": "size-8 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
