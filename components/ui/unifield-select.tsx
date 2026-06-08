"use client"

import React from "react"
import { cn } from "@/lib/utils"

import { Field, FieldError, FieldLabel } from "./field"
import { LuCirclePlus } from "react-icons/lu"
import { FaArrowRight } from "react-icons/fa"
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
}: UniFieldSelectProps) => {
  const handleValueChange = (val: string) => {
    if (val === "add_new" && onAddNew) {
      onAddNew()
    } else if (onValueChange) {
      onValueChange(val)
    }
  }

  return (
    <Field
      data-invalid={error ? true : undefined}
      className={cn("w-full gap-1 bg-white", containerClassName)}
    >
      {label && (
        <FieldLabel className="font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}
      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <div className="group/select relative">
          <SelectTrigger
            aria-invalid={error ? true : undefined}
            size={size}
            className={cn(
              "bg-white text-sm font-semibold text-gray-900 placeholder:font-medium placeholder:text-muted-foreground",
              disabled && "cursor-not-allowed opacity-60",
              allowClear &&
                value &&
                "[&_svg]:transition-opacity group-focus-within/select:[&_svg]:opacity-0 group-hover/select:[&_svg]:opacity-0"
            )}
          >
            <SelectValue placeholder={placeholder || "Select an option"} />
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
            {children}
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
