"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: Record<string, unknown>
  }
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`w-full ${className}`} {...props} />
))
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = TooltipPrimitive.Root

const ChartTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    hideLabel?: boolean
  }
>(({ className, hideLabel, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    className={`rounded-lg border border-border bg-background p-2 text-sm shadow-md ${className}`}
    {...props}
  />
))
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
