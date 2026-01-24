"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Per Figma node 28846-13575 (ON), 28416-360809 (OFF), 28846-13580 (Focus)
      // Exact sizes: w-9 (36px) h-5 (20px), thumb: 16x16px
      // Focus state: no focus ring per Figma
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent px-0.5 transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      // ON state: bg-primary (#EBBC00 dark, #BB8C00 light)
      "data-[state=checked]:bg-primary",
      // OFF state: light #EEEADD, dark rgba(255,255,255,0.12) per Figma
      "data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-[rgba(255,255,255,0.12)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Per Figma: thumb 16x16px with proper spacing
        "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform",
        // Use card bg for better contrast: light #FBF9F2, dark #232326
        "bg-card",
        // ON: translate with small gap from right edge (w-9=36px - px-0.5=2px - h-4=16px - gap=2px = 16px)
        "data-[state=checked]:translate-x-[14px]",
        // OFF: no translation (original working state)
        "data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }