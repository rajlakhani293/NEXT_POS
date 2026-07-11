import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import quarterOfYear from "dayjs/plugin/quarterOfYear"

dayjs.extend(quarterOfYear)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate dynamic financial years
const generateFinancialYears = (count = 5) => {
  const currentYear = new Date().getFullYear()
  const currentFY = currentYear % 100
  const years = []

  for (let i = 0; i < count; i++) {
    const fyStart = (currentFY - i) % 100
    const fyEnd = (fyStart + 1) % 100
    years.push(`FY ${fyStart}-${fyEnd.toString().padStart(2, "0")}`)
  }

  return years
}

export const dateRanges = [
  "Today",
  "Yesterday",
  "This Week",
  "Last Week",
  "This Month",
  "Last Month",
  "This Year",
  "Last Year",
  "Last 30 Days",
  "Last Quarter",
  ...generateFinancialYears(5), // Generate last 5 financial years
]

export const getDateRange = (range: string) => {
  const today = dayjs()
  let startDate = null
  let endDate = null

  // If no range provided, use current financial year as default
  if (!range) {
    const currentYear = today.year()
    const currentFY = currentYear % 100
    const nextFY = (currentFY + 1) % 100
    const fullStartYear = currentFY < 100 ? 2000 + currentFY : currentFY
    const fullEndYear = fullStartYear + 1
    startDate = dayjs(`${fullStartYear}-04-01`).startOf("day").toDate()
    endDate = dayjs(`${fullEndYear}-03-31`).endOf("day").toDate()
    return { startDate, endDate }
  }

  switch (range) {
    case "Today":
      startDate = today.startOf("day").toDate()
      endDate = today.endOf("day").toDate()
      break
    case "Yesterday":
      startDate = today.subtract(1, "day").startOf("day").toDate()
      endDate = today.subtract(1, "day").endOf("day").toDate()
      break
    case "This Week":
      startDate = today.startOf("week").toDate()
      endDate = today.endOf("week").toDate()
      break
    case "Last Week":
      startDate = today.subtract(1, "week").startOf("week").toDate()
      endDate = today.subtract(1, "week").endOf("week").toDate()
      break
    case "This Month":
      startDate = today.startOf("month").toDate()
      endDate = today.endOf("month").toDate()
      break
    case "Last Month":
      startDate = today.subtract(1, "month").startOf("month").toDate()
      endDate = today.subtract(1, "month").endOf("month").toDate()
      break
    case "This Year":
      startDate = today.startOf("year").toDate()
      endDate = today.endOf("year").toDate()
      break
    case "Last Year":
      startDate = today.subtract(1, "year").startOf("year").toDate()
      endDate = today.subtract(1, "year").endOf("year").toDate()
      break
    case "Last 30 Days":
      startDate = today.subtract(30, "day").startOf("day").toDate()
      endDate = today.endOf("day").toDate()
      break
    case "Last Quarter":
      startDate = today.subtract(1, "quarter").startOf("quarter").toDate()
      endDate = today.subtract(1, "quarter").endOf("quarter").toDate()
      break
    default:
      if (range.startsWith("FY")) {
        const years = range.replace("FY ", "").split("-")
        if (years.length === 2) {
          const startYear = parseInt(years[0])
          const fullStartYear = startYear < 100 ? 2000 + startYear : startYear
          const fullEndYear = fullStartYear + 1
          startDate = dayjs(`${fullStartYear}-04-01`).startOf("day").toDate()
          endDate = dayjs(`${fullEndYear}-03-31`).endOf("day").toDate()
        }
      }
      break
  }
  return { startDate, endDate }
}

export type FormField = {
  name: string
  label: string
  type?:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "switch"
    | "date"
    | "hidden"
    | "readonly"
    | "radio"
    | "email"
  placeholder?: string
  required?: boolean
  defaultValue?: any
  options?: { label: string; value: string | number }[]
  multiple?: boolean
  rows?: number
  note?: string
  maxLength?: number
  validation?: any
  custom_msg?: string
  showCheckbox?: boolean
  allowClear?: boolean
  onAddNew?: () => void
  addNewLabel?: string
  [key: string]: any
}

export interface FormValuesWithLoading {
  isLoaded?: string
  [key: string]: any
}

export const getInitialFormValues = <T extends FormValuesWithLoading>(
  schema: FormField[],
  data?: Record<string, any> | null,
  mode: "create" | "edit" = "create"
): T => {
  // Create empty initial values with proper typing
  const initialValues: Record<string, any> = {}

  schema.forEach((field) => {
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      initialValues[field.name] = field.defaultValue
    } else {
      initialValues[field.name] = ""
    }
  })

  const typedValues = initialValues as T

  if (mode === "create") {
    typedValues.isLoaded = "true"
  } else if (mode === "edit") {
    typedValues.isLoaded = data ? "true" : "false"
  }

  if (data && data !== null) {
    for (const field of schema) {
      if (data[field.name] !== undefined) {
        ;(typedValues as any)[field.name] = data[field.name]?.toString() || ""
      }
    }
    typedValues.isLoaded = "true"
  }

  return typedValues
}

export const buildPayload = (
  schema: FormField[],
  values: Record<string, any>,
  meta: { moduleId?: string; entityId?: string; id?: string | null } = {}
) => {
  const payload: Record<string, any> = {}

  schema.forEach((field) => {
    if (values[field.name] !== undefined) {
      payload[field.name] = values[field.name]
    }
  })
  return payload
}

export const blankToNull = (
  values: Record<string, any>,
  fields: string[]
): Record<string, any> => {
  const payload = { ...values }

  fields.forEach((field) => {
    if (typeof payload[field] === "string" && payload[field].trim() === "") {
      payload[field] = null
    }
  })

  return payload
}
