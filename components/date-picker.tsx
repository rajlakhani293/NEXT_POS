"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react"
import { type DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { FieldLabel, FieldError } from "./ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"

const parseTimeParts = (value?: string) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{1,2})/)
  if (!match) return { hour: 9, minute: 0 }
  return {
    hour: Math.min(23, Math.max(0, Number(match[1]))),
    minute: Math.min(59, Math.max(0, Number(match[2]))),
  }
}

const formatTimeValue = (hour: number, minute: number) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

function TimeGridPanel({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  hour: number
  minute: number
  onHourChange: (h: number) => void
  onMinuteChange: (m: number) => void
}) {
  const [segment, setSegment] = useState<"hour" | "minute">("hour")

  return (
    <div className="w-[220px]">
      {/* Time display header */}
      <div className="mb-3 flex items-center justify-center gap-1 rounded-xl bg-gray-50 px-4 py-2.5 ring-1 ring-gray-200">
        <button
          type="button"
          onClick={() => setSegment("hour")}
          className={cn(
            "rounded-md px-2 py-0.5 text-2xl font-bold tabular-nums transition-colors",
            segment === "hour"
              ? "bg-[#3155f6] text-white"
              : "text-gray-800 hover:bg-gray-200"
          )}
        >
          {String(hour).padStart(2, "0")}
        </button>
        <span className="text-2xl font-bold text-gray-400">:</span>
        <button
          type="button"
          onClick={() => setSegment("minute")}
          className={cn(
            "rounded-md px-2 py-0.5 text-2xl font-bold tabular-nums transition-colors",
            segment === "minute"
              ? "bg-[#3155f6] text-white"
              : "text-gray-800 hover:bg-gray-200"
          )}
        >
          {String(minute).padStart(2, "0")}
        </button>
      </div>

      {/* Labels */}
      <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        {segment === "hour" ? "Select Hour" : "Select Minute"}
      </p>

      {/* Grid */}
      {segment === "hour" ? (
        <div className="grid grid-cols-6 gap-1">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => { onHourChange(h); setSegment("minute") }}
              className={cn(
                "flex h-7 w-full items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors",
                hour === h
                  ? "bg-[#3155f6] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {String(h).padStart(2, "0")}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1">
          {MINUTES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMinuteChange(m)}
              className={cn(
                "flex h-7 w-full items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors",
                minute === m
                  ? "bg-[#3155f6] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {String(m).padStart(2, "0")}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
  error?: string
  clearLabel?: string
  minuteStep?: number
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  label,
  required,
  error,
  clearLabel = "Clear",
}: TimePickerProps) {
  const inputId = label?.toLowerCase().replace(/\s+/g, "-")
  const { hour, minute } = parseTimeParts(value)
  const displayValue = value ? formatTimeValue(hour, minute) : ""

  return (
    <div className="space-y-1">
      {label && (
        <FieldLabel
          htmlFor={inputId}
          className={cn("font-semibold text-gray-700", error && "text-destructive")}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}
      <div className="group relative">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              data-empty={!value}
              id={inputId}
              className={cn(
                "h-10 w-full justify-start border-2 bg-white text-left text-sm font-semibold text-gray-500",
                error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                value && "pr-8",
                className
              )}
            >
              <Clock className="mr-2 h-4 w-4 text-gray-900" />
              <span className="text-gray-900">{displayValue || placeholder}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start" collisionPadding={16}>
            <TimeGridPanel
              hour={hour}
              minute={minute}
              onHourChange={(h) => onChange?.(formatTimeValue(h, minute))}
              onMinuteChange={(m) => onChange?.(formatTimeValue(hour, m))}
            />
          </PopoverContent>
        </Popover>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange?.("") }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 opacity-0 transition-opacity hover:bg-gray-300 hover:text-gray-700 group-hover:opacity-100"
            tabIndex={-1}
            aria-label="Clear time"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
  error?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  label,
  required,
  error,
}: DatePickerProps) {
  const inputId = label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="space-y-1">
      {label && (
        <FieldLabel
          htmlFor={inputId}
          className={cn(
            "font-semibold text-gray-700",
            error && "text-destructive"
          )}
        >
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
              "h-10 w-full justify-start text-left border-2 bg-white text-sm font-semibold text-gray-500",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-900" />
            <div className="text-gray-900">{value ? format(value, "PPP") : <span>{placeholder}</span>}</div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className="text-gray-900 font-semibold"
          />
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
  error?: string
  timeLabel?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date and time",
  className,
  label,
  required,
  error,
  timeLabel = "Time",
}: DateTimePickerProps) {
  const inputId = label?.toLowerCase().replace(/\s+/g, "-")

  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined)
      return
    }
    const nextDate = new Date(date)
    if (value) {
      nextDate.setHours(value.getHours())
      nextDate.setMinutes(value.getMinutes())
      nextDate.setSeconds(value.getSeconds())
    } else {
      nextDate.setHours(12) // Default to 12:00
      nextDate.setMinutes(0)
      nextDate.setSeconds(0)
    }
    onChange?.(nextDate)
  }

  const handleTimeChange = (timeString: string) => {
    if (!timeString) return
    const [hours, minutes] = timeString.split(":").map(Number)
    const nextDate = value ? new Date(value) : new Date()
    nextDate.setHours(hours)
    nextDate.setMinutes(minutes)
    nextDate.setSeconds(0)
    onChange?.(nextDate)
  }

  const timeValue = value
    ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
    : "12:00"

  return (
    <div className="space-y-1">
      {label && (
        <FieldLabel
          htmlFor={inputId}
          className={cn(
            "font-semibold text-gray-700",
            error && "text-destructive"
          )}
        >
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
              "h-10 w-full justify-start text-left border-2 bg-white text-sm font-semibold text-gray-500",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-900" />
            <div className="text-gray-900">{value ? format(value, "PPP p") : <span>{placeholder}</span>}</div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateChange}
            initialFocus
            className="mx-auto text-gray-900 font-semibold"
          />
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-1.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Clock className="h-3.5 w-3.5" />
              {timeLabel}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 min-w-[72px] items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-bold tabular-nums text-gray-800 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Clock className="h-3.5 w-3.5 opacity-60" />
                  {value
                    ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
                    : "—:—"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start" side="right" collisionPadding={16}>
                <TimeGridPanel
                  hour={value ? value.getHours() : 12}
                  minute={value ? value.getMinutes() : 0}
                  onHourChange={(h) => {
                    const next = value ? new Date(value) : new Date()
                    next.setHours(h)
                    next.setSeconds(0)
                    onChange?.(next)
                  }}
                  onMinuteChange={(m) => {
                    const next = value ? new Date(value) : new Date()
                    next.setMinutes(m)
                    next.setSeconds(0)
                    onChange?.(next)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
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
