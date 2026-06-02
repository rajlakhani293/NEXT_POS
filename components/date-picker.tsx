"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { type DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { FieldLabel } from "./ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  label,
  required,
}: DatePickerProps) {
  const inputId = label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="space-y-1">
      {label && (
        <FieldLabel htmlFor={inputId}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-empty={!value}
            id={inputId}
            className={cn(
              "h-10 w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface MonthYearPickerProps {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
}

export function MonthYearPicker({
  value = new Date(),
  onChange,
  className,
}: MonthYearPickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerView, setPickerView] = useState<"month" | "year">("month")
  const [displayYear, setDisplayYear] = useState(value.getFullYear())

  const decadeStart = Math.floor(displayYear / 10) * 10
  const yearGrid = Array.from(
    { length: 12 },
    (_, index) => decadeStart - 1 + index
  )
  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  return (
    <Popover
      open={isPickerOpen}
      onOpenChange={(open) => {
        setIsPickerOpen(open)
        if (open) {
          setDisplayYear(value.getFullYear())
          setPickerView("month")
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 bg-white px-3 text-left font-normal text-gray-950",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {format(value, "MMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-3xl p-0" align="end">
        {pickerView === "month" ? (
          <div className="rounded-3xl bg-background">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDisplayYear((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="text-sm font-semibold"
                onClick={() => setPickerView("year")}
              >
                {displayYear}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDisplayYear((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {monthLabels.map((label, index) => {
                const isSelected =
                  value.getFullYear() === displayYear &&
                  value.getMonth() === index

                return (
                  <Button
                    key={label}
                    variant={isSelected ? "default" : "ghost"}
                    className="h-10 text-sm"
                    onClick={() => {
                      onChange?.(new Date(displayYear, index, 1))
                      setIsPickerOpen(false)
                    }}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-background">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDisplayYear((prev) => prev - 10)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-semibold">
                {decadeStart}-{decadeStart + 9}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDisplayYear((prev) => prev + 10)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {yearGrid.map((year) => {
                const isOutside = year < decadeStart || year > decadeStart + 9
                const isSelected = year === value.getFullYear()

                return (
                  <Button
                    key={year}
                    variant={isSelected ? "default" : "ghost"}
                    className="h-10 text-sm"
                    disabled={isOutside}
                    onClick={() => {
                      setDisplayYear(year)
                      setPickerView("month")
                    }}
                  >
                    {year}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "LLL dd, y")} -{" "}
                {format(value.to, "LLL dd, y")}
              </>
            ) : (
              format(value.from, "LLL dd, y")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
