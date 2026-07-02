"use client"

import { useEffect, useRef, useState } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer"
import { Button } from "./ui/button"
import { IoMdClose } from "react-icons/io"
import { Spinner } from "./ui/spinner"
import { UniFieldSelect } from "./ui/unifield-select"
import { SelectItem } from "./ui/select"
import { UniFieldInput } from "./ui/unifield-input"
import { Switch } from "./ui/switch"
import { ButtonGroup } from "./ui/button-group"
import { useTranslation } from "@/lib/contexts/TranslationContext"

interface FormField {
  name: string
  label: string
  type?:
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "switch"
  | "file"
  | "date"
  | "hidden"
  | "readonly"
  | "radio"
  | "email"
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string | number }[]
  multiple?: boolean
  rows?: number
  note?: string
  maxLength?: number
  icon?: React.ReactNode
  validation?: any
  custom_msg?: string
  dataType?: string
  showCheckbox?: boolean
  custom?: React.ReactNode | ((formikProps: any) => React.ReactNode)
  checkedText?: string
  unCheckedText?: string
  allowClear?: boolean
  defaultValue?: any
  onAddNew?: () => void
  addNewLabel?: string
  checkedValue?: any
  unCheckedValue?: any
  prefix?: React.ReactNode
  prefixPadding?: string
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"]
  pattern?: string
  sanitize?: (value: any) => any
  validate?: (value: any, values: Record<string, any>) => string
  disabled?: boolean | ((values: Record<string, any>) => boolean)
}

interface DynamicFormProps<T> {
  fields: FormField[]
  initialValues: T
  onSubmit: (values: T, formikHelpers: any) => void | Promise<any>
  onClose?: () => void
  onSuccess?: () => void
  title?: string
  note?: string
  isOpen?: boolean
  custom?: string
  children?: (formikProps: any) => React.ReactNode
  validationSchema?: any
  formWidth?: string | number
  extra?: (formikProps: any) => React.ReactNode
  onFieldChange?: (name: string, value: any, allValues: T) => T | void
  isLoading?: boolean
}

const DynamicForm = <T extends Record<string, any>>({
  fields,
  initialValues,
  onSubmit,
  onClose,
  formWidth,
  onSuccess,
  title = "Form Title",
  note,
  isOpen = false,
  children,
  validationSchema,
  extra,
  onFieldChange,
  isLoading = false,
}: DynamicFormProps<T>) => {
  const { t } = useTranslation()

  // Convert formWidth to CSS class
  const getWidthClass = (width: string | number | undefined): string => {
    if (!width) return "w-[600px]"
    if (typeof width === "string") return width
    return `w-[${width}px]`
  }

  const [formData, setFormData] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const drawerContentRef = useRef<HTMLDivElement>(null)

  // Reset isSubmitting when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Manage focus to prevent aria-hidden issues
  useEffect(() => {
    if (isOpen && drawerContentRef.current) {
      // Small delay to ensure drawer is fully open
      const timeoutId = setTimeout(() => {
        // Move focus to the drawer content to prevent aria-hidden conflicts
        drawerContentRef.current?.focus()
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [isOpen])

  // Update form data when initialValues changes
  useEffect(() => {
    setFormData(initialValues)
    setErrors({})
  }, [initialValues])

  const validateField = (name: string, value: any) => {
    // If external validation schema is provided, don't use built-in validation
    if (validationSchema) {
      return ""
    }

    const field = fields.find((f) => f.name === name)
    if (!field) return ""

    if (
      field.required &&
      (!value ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return field.custom_msg ? t(field.custom_msg) : t("{field} is required").replace("{field}", t(field.label))
    }

    if (field.validate) {
      return field.validate(value, formData)
    }

    if (field.type === "number" && value && isNaN(Number(value))) {
      return t("{field} must be a valid number").replace("{field}", t(field.label))
    }

    return ""
  }

  const handleChange = (name: string, value: any) => {
    const field = fields.find((f) => f.name === name)
    const nextValue = field?.sanitize ? field.sanitize(value) : value
    const newFormData = { ...formData, [name]: nextValue } as T
    setFormData(newFormData)

    if (errors[name]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [name]: "" }))
    }

    if (onFieldChange) {
      const updatedValues = onFieldChange(name, value, newFormData)
      if (updatedValues) {
        setFormData(updatedValues)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate all fields
    const newErrors: Record<string, string> = {}

    if (validationSchema) {
      // Use external validation schema if provided
      try {
        await validationSchema.validate(formData, { abortEarly: false })
      } catch (validationError: any) {
        if (validationError.inner) {
          validationError.inner.forEach((error: any) => {
            newErrors[error.path] = error.message
          })
        }
      }
    } else {
      // Use built-in validation
      fields.forEach((field) => {
        const error = validateField(field.name, formData[field.name])
        if (error) newErrors[field.name] = error
      })
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        await onSubmit(formData, {
          setSubmitting: setIsSubmitting,
          resetForm: () => setFormData(initialValues),
        })
        setIsSubmitting(false)
        onSuccess?.()
      } catch (error) {
        console.error("Submit failed:", error)
        setIsSubmitting(false)
      }
    } else {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialValues)
      setErrors({})
      onClose?.()
    }
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      direction="right"
    >
      <DrawerContent
        ref={drawerContentRef}
        className={`h-full ${getWidthClass(formWidth)} flex flex-col`}
        tabIndex={-1}
      >
        <DrawerHeader className="shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>{t(title)}</DrawerTitle>
              {note ? (
                <span className="text-sm text-muted-foreground">{note}</span>
              ) : (
                <span className="sr-only">
                  {t("Form dialog for")} {t(title || "form")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {extra && extra({ formData, handleChange, errors })}
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                >
                  <IoMdClose className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="relative flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="flex flex-row items-center gap-2">
                <Spinner />
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                {(() => {
                  const isFieldDisabled =
                    typeof field.disabled === "function"
                      ? field.disabled(formData)
                      : Boolean(field.disabled)

                  return field.type === "hidden" ? (
                  <input
                    type="hidden"
                    name={field.name}
                    value={formData[field.name] || ""}
                  />
                ) : field.type === "select" && field.options && field.multiple ? (
                  <div className="space-y-2 rounded-md border p-3">
                    <div className="text-sm font-medium">
                      {t(field.label)}
                      {field.required && <span className="text-red-500">*</span>}
                    </div>
                    {field.placeholder && (
                      <p className="text-xs text-muted-foreground">
                        {t(field.placeholder)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {field.options
                        ?.filter(
                          (option) => option != null && option.value != null
                        )
                        .map((option) => {
                          const current = Array.isArray(formData[field.name])
                            ? formData[field.name]
                            : []
                          const value = option.value.toString()
                          const selected = current.map(String).includes(value)
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant={selected ? "secondary" : "outline"}
                              size="sm"
                              disabled={isFieldDisabled}
                              onClick={() => {
                                const next = selected
                                  ? current.filter((item: any) => String(item) !== value)
                                  : [...current, value]
                                handleChange(field.name, next)
                              }}
                            >
                        {t(option.label)}
                            </Button>
                          )
                        })}
                    </div>
                    {errors[field.name] && (
                      <p className="text-sm text-red-500">{errors[field.name]}</p>
                    )}
                  </div>
                ) : field.type === "select" && field.options ? (
                  <UniFieldSelect
                    label={t(field.label)}
                    value={formData[field.name] || ""}
                    onValueChange={(value) => handleChange(field.name, value)}
                    required={field.required}
                    placeholder={field.placeholder ? t(field.placeholder) : t(`Select ${field.label}`)}
                    error={errors[field.name]}
                    onAddNew={field.onAddNew}
                    addNewLabel={field.addNewLabel ? t(field.addNewLabel) : field.addNewLabel}
                    allowClear={field.allowClear}
                    disabled={isFieldDisabled}
                  >
                    {field.options
                      ?.filter(
                        (option) => option != null && option.value != null
                      )
                      .map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                            {t(option.label)}
                        </SelectItem>
                      ))}
                  </UniFieldSelect>
                ) : field.type === "textarea" ? (
                  <UniFieldInput
                    as="textarea"
                    label={t(field.label)}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder ? t(field.placeholder) : field.placeholder}
                    prefix={field.prefix}
                    prefixPadding={field.prefixPadding}
                    rows={field.rows || 3}
                    maxLength={field.maxLength}
                    error={errors[field.name]}
                    disabled={isFieldDisabled}
                  />
                ) : field.type === "number" ? (
                  <UniFieldInput
                    type="number"
                    label={t(field.label)}
                    value={formData[field.name] || ""}
                    onChange={(e) => {
                      const value = e.target.value
                      // Enforce maxLength for number inputs
                      if (field.maxLength && value.length > field.maxLength) {
                        return // Prevent input if exceeds maxLength
                      }
                      handleChange(field.name, value)
                    }}
                    required={field.required}
                    placeholder={field.placeholder ? t(field.placeholder) : field.placeholder}
                    prefix={field.prefix}
                    prefixPadding={field.prefixPadding}
                    min="0"
                    step="0.01"
                    maxLength={field.maxLength}
                    error={errors[field.name]}
                    disabled={isFieldDisabled}
                  />
                ) : field.type === "readonly" ? (
                  <UniFieldInput
                    type="text"
                    label={t(field.label)}
                    value={formData[field.name] || ""}
                    readOnly
                    placeholder={field.placeholder ? t(field.placeholder) : field.placeholder}
                    prefix={field.prefix}
                    prefixPadding={field.prefixPadding}
                    error={errors[field.name]}
                    disabled={isFieldDisabled}
                  />
                ) : field.type === "file" ? (
                  <UniFieldInput
                    type="file"
                    label={field.label}
                    onChange={(e) =>
                      handleChange(field.name, e.target.files?.[0] || null)
                    }
                    required={field.required}
                    placeholder={field.placeholder}
                    prefix={field.prefix}
                    prefixPadding={field.prefixPadding}
                    error={errors[field.name]}
                    disabled={isFieldDisabled}
                  />
                ) : field.type === "switch" ? (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {t(field.label)}
                        {field.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </div>
                      {field.note && (
                        <p className="text-sm text-muted-foreground">
                          {t(field.note)}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={Boolean(formData[field.name])}
                      disabled={isFieldDisabled}
                      onCheckedChange={(checked) =>
                        handleChange(field.name, checked)
                      }
                    />
                  </div>
                ) : field.type === "radio" && field.options ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t(field.label)}</span>
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </div>
                    <ButtonGroup>
                      {field.options.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            formData[field.name] === option.value.toString()
                              ? "secondary"
                              : "outline"
                          }
                          onClick={() =>
                            handleChange(field.name, option.value.toString())
                          }
                          disabled={isFieldDisabled}
                          className={`flex-1 ${formData[field.name] === option.value.toString() ? "bg-blue-500 text-white hover:bg-blue-600" : ""} ${errors[field.name] ? "border-red-500" : ""}`}
                        >
                          {t(option.label)}
                        </Button>
                      ))}
                    </ButtonGroup>
                    {errors[field.name] && (
                      <p className="text-sm text-red-500">
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                ) : (
                  <UniFieldInput
                    type={field.type || "text"}
                    label={t(field.label)}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder ? t(field.placeholder) : field.placeholder}
                    prefix={field.prefix}
                    prefixPadding={field.prefixPadding}
                    inputMode={field.inputMode}
                    pattern={field.pattern}
                    maxLength={field.maxLength}
                    error={errors[field.name]}
                    disabled={isFieldDisabled}
                  />
                )
                })()}

                {field.note && (
                  <p className="text-sm text-gray-500">{t("Note")}: {t(field.note)}</p>
                )}
              </div>
            ))}

            {typeof children === "function" &&
              children({ formData, handleChange, errors })}
          </form>
        </div>

        <div className="flex shrink-0 justify-end border-t p-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e)
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  {t("Saving...")}
                </span>
              ) : (
                <span className="flex items-center">{t("Save")}</span>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default DynamicForm
