"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Legend, Tooltip, type LegendProps, type TooltipProps } from "recharts"

export type ChartConfig = Record<
  string,
  {
    label?: string
    color?: string
  }
>

function getColorVar(key: string) {
  return `--color-${key}`
}

export function ChartContainer({
  config,
  className,
  children,
}: React.PropsWithChildren<{
  config: ChartConfig
  className?: string
}>) {
  const style = React.useMemo(() => {
    const vars: Record<string, string> = {}
    Object.entries(config || {}).forEach(([key, value]) => {
      if (value?.color) {
        vars[getColorVar(key)] = value.color
      }
    })
    return vars
  }, [config])

  return (
    <div className={cn("w-full", className)} style={style}>
      {children}
    </div>
  )
}

export function ChartTooltip(props: TooltipProps<number, string>) {
  return <Tooltip {...props} cursor={{ stroke: "#e5e7eb", strokeDasharray: "3 3" }} wrapperStyle={{ outline: "none" }} />
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  indicator = "dot",
}: TooltipProps<number, string> & {
  indicator?: "dot" | "line"
}) {
  if (!active || !payload?.length) return null
  const labelText = labelFormatter
    ? labelFormatter(label, payload)
    : label

  return (
    <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-sm">
      {labelText ? <div className="mb-1 font-medium text-gray-900">{labelText as string}</div> : null}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const name = entry.name || entry.dataKey || ""
          const nameText = String(name)
          const value = formatter
            ? formatter(
                entry.value as number,
                nameText,
                entry,
                index,
                payload,
              )
            : entry.value
          const color = (entry.color || entry.fill) as string | undefined
          return (
            <div key={index} className="flex items-center gap-2 text-gray-700">
              <span
                className={cn(
                  "inline-block size-2 rounded-full",
                  indicator === "line" && "w-3 rounded-sm"
                )}
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{nameText}</span>
              <span className="ml-auto font-medium text-gray-900">{value as any}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChartLegend(props: LegendProps) {
  return <Legend {...(props as any)} />
}

export function ChartLegendContent({
  payload,
}: LegendProps) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
