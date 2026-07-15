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
  if (!match) return { hour: "09", minute: "00" }
  const hour = Math.min(23, Math.max(0, Number(match[1])))
  const minute = Math.min(59, Math.max(0, Number(match[2])))
  return {
    hour: String(hour).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
  }
}

const formatTimeValue = (hour: string, minute: string) => `${hour}:${minute}`

function TimeOptionList({
  values,
  selected,
  onSelect,
}: {
  values: string[]
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="h-48 overflow-y-auto rounded-md border border-gray-200 bg-white p-1">
      {values.map((value) => (
        <Button
          key={value}
          type="button"
          variant={selected === value ? "blue" : "ghost"}
          size="sm"
          className="mb-1 h-8 w-full justify-center text-sm font-semibold"
          onClick={() => onSelect(value)}
        >
          {value}
        </Button>
      ))}
    </div>
  )
}

function TimeSelector({
  value,
  onChange,
  minuteStep = 1,
}: {
  value?: string
  onChange?: (time: string) => void
  minuteStep?: number
}) {
  const { hour, minute } = parseTimeParts(value)
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"))
  const safeMinuteStep = Math.max(1, Math.min(30, minuteStep))
  const minutes = Array.from(
    { length: Math.ceil(60 / safeMinuteStep) },
    (_, index) => String(Math.min(59, index * safeMinuteStep)).padStart(2, "0")
  )
  const selectedMinute = minutes.includes(minute) ? minute : "00"

  return (
    <div className="grid grid-cols-2 gap-2">
      <TimeOptionList
        values={hours}
        selected={hour}
        onSelect={(nextHour) => onChange?.(formatTimeValue(nextHour, selectedMinute))}
      />
      <TimeOptionList
        values={minutes}
        selected={selectedMinute}
        onSelect={(nextMinute) => onChange?.(formatTimeValue(hour, nextMinute))}
      />
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
  minuteStep = 1,
}: TimePickerProps) {
  const inputId = label?.toLowerCase().replace(/\s+/g, "-")
  const displayValue = value ? formatTimeValue(parseTimeParts(value).hour, parseTimeParts(value).minute) : ""

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
              "h-10 w-full justify-start border-2 bg-white text-left text-sm font-semibold text-gray-500",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
          >
            <Clock className="mr-2 h-4 w-4 text-gray-900" />
            <span className="text-gray-900">{displayValue || placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <TimeSelector value={value} onChange={onChange} minuteStep={minuteStep} />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-center"
              onClick={() => onChange?.("")}
            >
              <X className="mr-2 h-4 w-4" />
              {clearLabel}
            </Button>
          )}
        </PopoverContent>
      </Popover>
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
            className="text-gray-900 font-semibold"
          />
          <div className="border-t border-gray-100 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Clock className="h-4 w-4" />
              {timeLabel}
            </div>
            <TimeSelector value={timeValue} onChange={handleTimeChange} minuteStep={1} />
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
