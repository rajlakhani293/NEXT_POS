"use client"

import React, { useMemo } from "react"
import { cn } from "@/lib/utils"

import { Field, FieldError, FieldLabel } from "./field"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { ChevronDown } from "lucide-react"
import { LuCirclePlus } from "react-icons/lu"
import { FaArrowRight } from "react-icons/fa"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { IoIosCloseCircleOutline } from "react-icons/io"

interface UniFieldSelectProps {
  label?: string
  error?: string
  containerClassName?: string
  value?: string
  onValueChange?: (value: string) => void
  required?: boolean
  placeholder?: string
  children?: React.ReactNode
  validationError?: string
  onAddNew?: () => void
  addNewLabel?: string
  size?: "sm" | "default" | "lg"
  allowClear?: boolean
  disabled?: boolean
  hasOptions?: boolean
  emptyLabel?: string
}

export const UniFieldSelect = ({
  label,
  error,
  containerClassName,
  value,
  onValueChange,
  required = false,
  placeholder,
  children,
  validationError,
  onAddNew,
  addNewLabel,
  size = "default",
  allowClear = false,
  disabled = false,
  hasOptions = true,
  emptyLabel,
}: UniFieldSelectProps) => {
  const { t } = useTranslation()
  const hasError = Boolean(error || validationError)

  const handleValueChange = (val: string) => {
    if (val === "add_new" && onAddNew) {
      onAddNew()
    } else if (onValueChange) {
      onValueChange(val)
    }
  }

  return (
    <Field
      data-invalid={hasError ? true : undefined}
      className={cn("w-full gap-1 bg-white", containerClassName)}
    >
      {label && (
        <FieldLabel
          className={cn(
            "font-semibold text-gray-700",
            hasError && "text-destructive"
          )}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}
      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <div className="group/select relative">
          <SelectTrigger
            aria-invalid={hasError ? true : undefined}
            size={size}
            className={cn(
              "bg-white text-sm font-semibold text-gray-900 placeholder:font-medium placeholder:text-muted-foreground",
              disabled && "cursor-not-allowed opacity-60",
              allowClear &&
                value &&
                "[&_svg]:transition-opacity group-focus-within/select:[&_svg]:opacity-0 group-hover/select:[&_svg]:opacity-0"
            )}
          >
            <SelectValue placeholder={placeholder ? t(placeholder) : t("Select an option")} />
          </SelectTrigger>
          {allowClear && value && !disabled ? (
            <button
              type="button"
              aria-label={`Clear ${label || "selection"}`}
              className="absolute top-1/2 right-3 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-xs font-semibold text-muted-foreground opacity-0 transition-opacity group-focus-within/select:opacity-100 group-hover/select:opacity-100 hover:text-foreground"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onValueChange?.("")
              }}
            >
              <IoIosCloseCircleOutline className="size-4" />
            </button>
          ) : null}
        </div>
        <SelectContent>
          <SelectGroup className="font-semibold text-gray-900">
            {hasOptions ? (
              children
            ) : (
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                {emptyLabel ? t(emptyLabel) : t("No records found")}
              </div>
            )}
            {onAddNew && (
              <div className="border-t">
                <SelectItem
                  value="add_new"
                  className="flex cursor-pointer items-center justify-center rounded-t-none rounded-b-md font-medium"
                >
                  <div className="flex w-full items-center justify-center gap-2">
                    <LuCirclePlus className="h-4 w-4" />
                    {addNewLabel || `Add New ${label || ""}`}
                    <FaArrowRight className="size-3" />
                  </div>
                </SelectItem>
              </div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
      {validationError && <FieldError>{validationError}</FieldError>}
    </Field>
  )
}

interface UniFieldMultiSelectProps {
  label?: string
  error?: string
  containerClassName?: string
  value?: any[]
  onValueChange?: (value: any[]) => void
  required?: boolean
  placeholder?: string
  options: { label: string; value: any }[]
  validationError?: string
  disabled?: boolean
  allowClear?: boolean
}

export const UniFieldMultiSelect = ({
  label,
  error,
  containerClassName,
  value = [],
  onValueChange,
  required = false,
  placeholder,
  options = [],
  validationError,
  disabled = false,
  allowClear = false,
}: UniFieldMultiSelectProps) => {
  const { t } = useTranslation()
  const hasError = Boolean(error || validationError)

  const selectedValues = useMemo(() => {
    return Array.isArray(value) ? value : []
  }, [value])

  const displayLabel = useMemo(() => {
    if (selectedValues.length === 0) return placeholder ? t(placeholder) : t("Select options")
    const selectedLabels = options
      .filter((opt) => selectedValues.map(String).includes(String(opt.value)))
      .map((opt) => opt.label)
    if (selectedLabels.length <= 2) return selectedLabels.join(", ")
    return `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`
  }, [selectedValues, options, placeholder, t])

  const handleToggle = (optValue: any, checked: boolean) => {
    if (!onValueChange) return
    const next = checked
      ? [...selectedValues, optValue]
      : selectedValues.filter((val) => String(val) !== String(optValue))
    onValueChange(next)
  }

  const handleClear = (event: React.SyntheticEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onValueChange?.([])
  }

  return (
    <Field
      data-invalid={hasError ? true : undefined}
      className={cn("w-full gap-1 bg-white", containerClassName)}
    >
      {label && (
        <FieldLabel
          className={cn(
            "font-semibold text-gray-700",
            hasError && "text-destructive"
          )}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}

      <div className="group/select relative w-full">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-lg border-2 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs focus:outline-none hover:bg-white",
                disabled && "cursor-not-allowed opacity-60",
                hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",
                allowClear && selectedValues.length > 0 && "[&_svg]:transition-opacity group-hover/select:[&_svg]:opacity-0"
              )}
            >
              <span className="truncate pr-4">{displayLabel}</span>
              <ChevronDown className="size-4 text-gray-500 opacity-60 transition-opacity" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2.5" align="start">
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto thin-scrollbar">
              {options.length ? (
                options.map((option) => {
                  const isChecked = selectedValues.map(String).includes(String(option.value))
                  return (
                    <label
                      key={String(option.value)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => handleToggle(option.value, checked === true)}
                      />
                      <span className="select-none">{option.label}</span>
                    </label>
                  )
                })
              ) : (
                <p className="p-2 text-center text-sm font-medium text-slate-500">{t("No records found")}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {allowClear && selectedValues.length > 0 && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label={t("Clear selection")}
            className="absolute top-1/2 right-3 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover/select:opacity-100 hover:text-foreground focus:outline-none"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleClear(e)
              }
            }}
          >
            <IoIosCloseCircleOutline className="size-4" />
          </span>
        )}
      </div>

      {error && <FieldError>{error}</FieldError>}
      {validationError && <FieldError>{validationError}</FieldError>}
    </Field>
  )
}
