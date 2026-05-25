"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "./textarea"
import { Field, FieldError, FieldLabel } from "./field"
import { Input } from "./input"

interface UniFieldInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string
  error?: string
  containerClassName?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  as?: 'input' | 'textarea'
  rows?: number
  min?: number | string
  max?: number | string
  maxLength?: number
}

export const UniFieldInput = React.forwardRef<HTMLInputElement, UniFieldInputProps>(
  ({
    label,
    error,
    containerClassName,
    className,
    id,
    prefix,
    suffix,
    as = 'input',
    rows = 3,
    min,
    max,
    maxLength,
    onChange,
    ...props
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (props.type === 'number') {
        e.currentTarget.blur()
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (props.type === 'number' && (min !== undefined || max !== undefined || maxLength !== undefined)) {
        const valueStr = e.target.value;
        let validatedValueStr = valueStr;

        // Apply maxLength validation
        if (maxLength !== undefined && valueStr.length > maxLength) {
          validatedValueStr = valueStr.slice(0, maxLength);
        }

        const value = parseFloat(validatedValueStr);
        let validatedValue = value;

        // Apply min validation (only if value is a valid number)
        if (!isNaN(value) && min !== undefined && value < parseFloat(min.toString())) {
          validatedValue = parseFloat(min.toString());
        }

        // Apply max validation (only if value is a valid number)
        if (!isNaN(value) && max !== undefined && value > parseFloat(max.toString())) {
          validatedValue = parseFloat(max.toString());
        }

        // Update input value to show validated value
        if (!isNaN(validatedValue)) {
          e.target.value = validatedValue.toString();
        } else {
          e.target.value = validatedValueStr;
        }

        // Call original onChange with validated value
        if (onChange) {
          onChange(e);
        }
      } else {
        // For non-number inputs, just call original onChange
        if (onChange) {
          onChange(e);
        }
      }
    }

    return (
      <Field data-invalid={error ? true : undefined} className={cn("gap-1", containerClassName)}>
        {label && (
          <FieldLabel htmlFor={inputId}>
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </FieldLabel>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black text-[15px] font-medium z-10">
              {prefix}
            </div>
          )}
          {as === 'textarea' ? (
            <Textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              rows={rows}
              className={cn(
                error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                className
              )}
              aria-invalid={error ? true : undefined}
              value={props.value}
              placeholder={props.placeholder}
              disabled={props.disabled}
              required={props.required}
              onChange={onChange as any}
            />
          ) : (
            <Input
              ref={ref}
              id={inputId}
              className={cn(
                "h-10 border-2 bg-white",
                error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                prefix && "pl-12",
                suffix && "pr-16",
                props.type === 'number' && "[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
                className
              )}
              aria-invalid={error ? true : undefined}
              {...props}
              min={min}
              max={max}
              maxLength={maxLength}
              onChange={handleChange as any}
              onWheel={handleWheel}
            />
          )}
          {suffix && (
            <div className="absolute right-[2px] top-[2px] bottom-[2px] flex items-center justify-center px-3 text-sm text-muted-foreground z-10 border-l bg-muted/30 rounded-r-[calc(var(--radius)-2px)]">
              {suffix}
            </div>
          )}
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    )
  }
)

UniFieldInput.displayName = "UniFieldInput"
