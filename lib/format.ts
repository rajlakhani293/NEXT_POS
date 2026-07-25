type BusinessDateOptions = {
  date_format?: string
  datetime_format?: string
  datetime_timezone?: string
}

type BusinessMoneyOptions = {
  currency_symbol?: string
  currency_iso?: string
  currency_position?: string
  currency_preferred?: string
  currency_prefered?: string
  currency_thousand_separator?: string
  currency_decimal_separator?: string
  currency_precision?: number | string
}

type ZonedParts = {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

const defaultBusinessDateOptions: Required<BusinessDateOptions> = {
  date_format: "Y-m-d",
  datetime_format: "Y-m-d H:i",
  datetime_timezone: "UTC",
}

const defaultBusinessMoneyOptions: Required<BusinessMoneyOptions> = {
  currency_symbol: "₹",
  currency_iso: "INR",
  currency_position: "before",
  currency_preferred: "symbol",
  currency_prefered: "symbol",
  currency_thousand_separator: ",",
  currency_decimal_separator: ".",
  currency_precision: 2,
}

const parseDate = (value?: string | Date | null) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const normalizeOptions = (options?: BusinessDateOptions | null) => ({
  ...defaultBusinessDateOptions,
  ...(options || {}),
})

const zonedParts = (date: Date, timeZone: string): ZonedParts => {
  const safeTimeZone = timeZone || defaultBusinessDateOptions.datetime_timezone
  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
  } catch {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: defaultBusinessDateOptions.datetime_timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
  }

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((current, part) => {
    if (part.type !== "literal") current[part.type] = part.value
    return current
  }, {})

  return {
    year: parts.year || "0000",
    month: parts.month || "01",
    day: parts.day || "01",
    hour: parts.hour === "24" ? "00" : parts.hour || "00",
    minute: parts.minute || "00",
    second: parts.second || "00",
  }
}

const monthLabel = (date: Date, timeZone: string, month: "short" | "long") => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || defaultBusinessDateOptions.datetime_timezone,
      month,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: defaultBusinessDateOptions.datetime_timezone,
      month,
    }).format(date)
  }
}

const weekdayLabel = (date: Date, timeZone: string, weekday: "short" | "long") => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || defaultBusinessDateOptions.datetime_timezone,
      weekday,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: defaultBusinessDateOptions.datetime_timezone,
      weekday,
    }).format(date)
  }
}

const formatWithBusinessPattern = (
  value: string | Date | null | undefined,
  pattern: string,
  options?: BusinessDateOptions | null
) => {
  const date = parseDate(value)
  if (!date) return "-"

  const normalized = normalizeOptions(options)
  const parts = zonedParts(date, normalized.datetime_timezone)
  const hour = Number(parts.hour)
  const twelveHour = hour % 12 || 12
  const meridiem = hour >= 12 ? "PM" : "AM"

  const tokens: Record<string, string> = {
    Y: parts.year,
    y: parts.year.slice(-2),
    m: parts.month,
    n: String(Number(parts.month)),
    d: parts.day,
    j: String(Number(parts.day)),
    M: monthLabel(date, normalized.datetime_timezone, "short"),
    F: monthLabel(date, normalized.datetime_timezone, "long"),
    D: weekdayLabel(date, normalized.datetime_timezone, "short"),
    l: weekdayLabel(date, normalized.datetime_timezone, "long"),
    H: parts.hour,
    h: String(twelveHour).padStart(2, "0"),
    i: parts.minute,
    s: parts.second,
    A: meridiem,
    a: meridiem.toLowerCase(),
  }

  return pattern.replace(/Y|y|m|n|d|j|M|F|D|l|H|h|i|s|A|a/g, (token) => tokens[token] || token)
}

export const formatBusinessDate = (
  value?: string | Date | null,
  options?: BusinessDateOptions | null
) => {
  const normalized = normalizeOptions(options)
  return formatWithBusinessPattern(value, normalized.date_format, normalized)
}

export const formatDateTime = (
  value?: string | Date | null,
  options?: BusinessDateOptions | null
) => {
  const normalized = normalizeOptions(options)
  return formatWithBusinessPattern(value, normalized.datetime_format, normalized)
}

export const formatBusinessDateTime = formatDateTime

const normalizeMoneyOptions = (options?: BusinessMoneyOptions | null) => ({
  ...defaultBusinessMoneyOptions,
  ...(options || {}),
})

const groupThousands = (integerPart: string, separator: string) =>
  integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)

export const formatBusinessMoney = (
  value?: string | number | null,
  options?: BusinessMoneyOptions | null
) => {
  const normalized = normalizeMoneyOptions(options)
  const precision = Math.max(0, Math.min(6, Number(normalized.currency_precision ?? 2) || 0))
  const amount = Number(value || 0)
  const sign = amount < 0 ? "-" : ""
  const fixedAmount = Math.abs(amount).toFixed(precision)
  const [integerPart, decimalPart] = fixedAmount.split(".")
  const formattedAmount = [
    `${sign}${groupThousands(integerPart, normalized.currency_thousand_separator || ",")}`,
    precision > 0 ? decimalPart : "",
  ].filter(Boolean).join(normalized.currency_decimal_separator || ".")
  const indicator =
    String(normalized.currency_preferred || normalized.currency_prefered) === "iso"
      ? normalized.currency_iso
      : normalized.currency_symbol

  return normalized.currency_position === "after"
    ? `${formattedAmount}${indicator}`
    : `${indicator}${formattedAmount}`
}

import { store } from "@/lib/redux/store"

export const money = (value: string | number | null | undefined): number => {
  const num = Number(value || 0) || 0
  try {
    const precision = store.getState().session.businessSettings?.settings?.currency_precision
    if (precision !== undefined && precision !== null) {
      return Number(num.toFixed(Number(precision)))
    }
  } catch (e) {
    // Fallback
  }
  return Number(num.toFixed(2))
}
