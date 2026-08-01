import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* ── Reference Image 2 Button System ────────────────────────────────────────
   Dark metallic interior + silver/white edge + soft inner top highlight +
   grayscale depth. NO purple, NO color gradients.
   ────────────────────────────────────────────────────────────────────────── */

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 cursor-pointer",
  {
    variants: {
      variant: {
        // Primary (Reference Image 2): Dark metallic gradient + silver edge + top highlight
        default:
          "bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-white border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_12px_rgba(0,0,0,0.8)] hover:border-white/60 hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-950 active:scale-[0.98]",
        primary:
          "bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-white border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_12px_rgba(0,0,0,0.8)] hover:border-white/60 hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-950 active:scale-[0.98]",
        
        // High Contrast White Solid (Alternative for navbar or secondary CTA)
        solid:
          "bg-white text-black hover:bg-zinc-200 active:bg-zinc-300 shadow-md border border-transparent font-semibold",

        // Secondary: Dark background + subtle border
        secondary:
          "bg-zinc-900/90 text-zinc-200 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-zinc-800 hover:text-white hover:border-white/25 active:scale-[0.98]",

        // Outline
        outline:
          "bg-transparent text-zinc-300 border border-white/15 hover:bg-zinc-900 hover:text-white hover:border-white/30 active:scale-[0.98]",

        // Ghost
        ghost:
          "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60 active:bg-zinc-900 rounded-lg",

        // Destructive
        destructive:
          "bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-900/30 hover:border-red-800/60 active:scale-[0.98]",

        // Nav
        nav: "text-zinc-400 hover:text-white font-medium p-0 h-auto bg-transparent rounded-none",
      },
      size: {
        default: "h-9 px-5 text-xs",
        sm: "h-8 px-4 text-[11px]",
        lg: "h-11 px-7 text-xs sm:text-sm tracking-wide",
        pill: "h-9 px-5 text-xs rounded-full",
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
