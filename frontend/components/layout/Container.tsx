import React from "react"
import { cn } from "@/lib/utils"

export function Container({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode
  className?: string
  size?: "small" | "default" | "large"
}) {
  const maxWidths = {
    small: "max-w-4xl",
    default: "max-w-6xl",
    large: "max-w-7xl",
  }

  return (
    <div className={cn("w-full mx-auto px-6", maxWidths[size], className)}>
      {children}
    </div>
  )
}
