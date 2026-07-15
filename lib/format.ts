type BusinessDateOptions = {
  date_format?: string
  datetime_format?: string
  datetime_timezone?: string
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
    H: parts.hour,
    h: String(twelveHour).padStart(2, "0"),
    i: parts.minute,
    s: parts.second,
    A: meridiem,
    a: meridiem.toLowerCase(),
  }

  return pattern.replace(/Y|y|m|n|d|j|M|F|H|h|i|s|A|a/g, (token) => tokens[token] || token)
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
