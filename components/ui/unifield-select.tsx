"use client"

import React from "react"
import { cn } from "@/lib/utils"

import { Field, FieldError, FieldLabel } from "./field"
import { LuCirclePlus } from "react-icons/lu"
import { FaArrowRight } from "react-icons/fa"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./select"
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
  allowClear = false
}: UniFieldSelectProps) => {
  const handleValueChange = (val: string) => {
    if (val === "add_new" && onAddNew) {
      onAddNew()
    } else if (onValueChange) {
      onValueChange(val)
    }
  }

  return (
    <Field data-invalid={error ? true : undefined} className={cn("w-full gap-1 bg-white", containerClassName)}>
      {label && <FieldLabel className="font-semibold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</FieldLabel>}
      <Select value={value} onValueChange={handleValueChange}>
        <div className="group/select relative">
          <SelectTrigger
            aria-invalid={error ? true : undefined}
            size={size}
            className={cn(
              "bg-white text-sm font-semibold text-gray-900 placeholder:text-muted-foreground placeholder:font-medium",
              allowClear &&
              value &&
              "[&_svg]:transition-opacity group-hover/select:[&_svg]:opacity-0 group-focus-within/select:[&_svg]:opacity-0",
            )}
          >
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          {allowClear && value ? (
            <button
              type="button"
              aria-label={`Clear ${label || "selection"}`}
              className="absolute right-3 top-1/2 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-xs font-semibold text-muted-foreground opacity-0 transition-opacity  hover:text-foreground group-hover/select:opacity-100 group-focus-within/select:opacity-100"
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
            {children}
            {onAddNew && (
              <div className="border-t">
                <SelectItem value="add_new" className="font-medium flex items-center justify-center cursor-pointer rounded-b-md rounded-t-none">
                  <div className="flex items-center w-full justify-center gap-2">
                    <LuCirclePlus className="w-4 h-4" />
                    {addNewLabel || `Add New ${label || ''}`}
                    <FaArrowRight className="size-3" />
                  </div>
                </SelectItem></div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
      {validationError && <FieldError>{validationError}</FieldError>}
    </Field>
  )
}
