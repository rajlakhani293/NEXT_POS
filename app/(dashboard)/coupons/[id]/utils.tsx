import React from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/TranslationContext"

export const toIdArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0)
    : []

export const idsToSelectValues = (value: any): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : []

export const toSelectOptions = (items: any[] = []) =>
  items
    .map((item) => ({
      value: String(item.value ?? item.id ?? ""),
      label: String(item.label ?? item.name ?? item.full_name ?? item.username ?? item.value ?? ""),
    }))
    .filter((item) => item.value && item.label)

export const generateRandomCode = (length = 8): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

interface MultiTargetSelectProps {
  label: string
  description: string
  options: { label: string; value: string }[]
  value: string[]
  onChange: (value: string[]) => void
}

export function MultiTargetSelect({
  label,
  description,
  options,
  value,
  onChange,
}: MultiTargetSelectProps) {
  const { t } = useTranslation()
  const selected = new Set(value.map(String))

  const toggle = (nextValue: string) => {
    if (selected.has(nextValue)) {
      onChange(value.filter((item) => String(item) !== nextValue))
    } else {
      onChange([...value, nextValue])
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
        <p className="mt-1 text-xs font-medium text-gray-500">{description}</p>
      </div>
      {options.length ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected.has(option.value)
            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? "blue" : "outline"}
                size="sm"
                onClick={() => toggle(option.value)}
              >
                {t(option.label)}
              </Button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-gray-200 px-4 py-8 text-center text-sm font-medium text-gray-500">
          {t("No records found")}
        </div>
      )}
    </div>
  )
}
