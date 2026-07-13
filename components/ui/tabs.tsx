"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      suppressHydrationWarning
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:h-auto data-[variant=line]:rounded-none data-[variant=line]:border-b data-[variant=line]:border-gray-200 data-[variant=line]:p-0",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      suppressHydrationWarning
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      suppressHydrationWarning
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
        "cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "group-data-[variant=line]/tabs-list:-mb-px group-data-[variant=line]/tabs-list:h-auto group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0 group-data-[variant=line]/tabs-list:border-b-[3px] group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:py-2.5 group-data-[variant=line]/tabs-list:text-sm group-data-[variant=line]/tabs-list:shadow-none group-data-[variant=line]/tabs-list:hover:border-b-gray-300 group-data-[variant=line]/tabs-list:hover:text-gray-700 group-data-[variant=line]/tabs-list:focus-visible:border-transparent group-data-[variant=line]/tabs-list:focus-visible:border-b-gray-900 group-data-[variant=line]/tabs-list:focus-visible:ring-0 group-data-[variant=line]/tabs-list:focus-visible:outline-none group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent group-data-[variant=line]/tabs-list:data-[state=active]:border-b-gray-900 group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:text-gray-900 group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none group-data-[variant=line]/tabs-list:data-[invalid=true]:border-transparent group-data-[variant=line]/tabs-list:data-[invalid=true]:border-b-red-500 group-data-[variant=line]/tabs-list:data-[invalid=true]:text-red-600 group-data-[variant=line]/tabs-list:data-[invalid=true]:data-[state=active]:border-b-red-600 group-data-[variant=line]/tabs-list:data-[invalid=true]:data-[state=active]:text-red-700",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      suppressHydrationWarning
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
