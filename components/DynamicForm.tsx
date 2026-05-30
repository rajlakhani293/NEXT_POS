"use client"

import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { IoMdClose } from "react-icons/io";
import { Spinner } from "./ui/spinner";
import { UniFieldSelect } from "./ui/unifield-select";
import { SelectItem } from "./ui/select";
import { UniFieldInput } from "./ui/unifield-input";
import { Switch } from "./ui/switch";
import { ButtonGroup } from "./ui/button-group";


interface FormField {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "switch" | "file" | "date" | "hidden" | "readonly" | "radio" | "email";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  multiple?: boolean;
  rows?: number;
  note?: string;
  maxLength?: number;
  icon?: React.ReactNode;
  validation?: any;
  custom_msg?: string;
  dataType?: string;
  showCheckbox?: boolean;
  custom?: React.ReactNode | ((formikProps: any) => React.ReactNode);
  checkedText?: string;
  unCheckedText?: string;
  allowClear?: boolean;
  defaultValue?: any;
  onAddNew?: () => void;
  addNewLabel?: string;
  checkedValue?: any;
  unCheckedValue?: any;
}

interface DynamicFormProps<T> {
  fields: FormField[];
  initialValues: T;
  onSubmit: (values: T, formikHelpers: any) => void | Promise<any>;
  onClose?: () => void;
  onSuccess?: () => void;
  title?: string;
  note?: string;
  isOpen?: boolean;
  custom?: string;
  children?: (formikProps: any) => React.ReactNode;
  validationSchema?: any;
  formWidth?: string | number;
  extra?: (formikProps: any) => React.ReactNode;
  onFieldChange?: (name: string, value: any, allValues: T) => T | void;
  isLoading?: boolean;
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
  // Convert formWidth to CSS class
  const getWidthClass = (width: string | number | undefined): string => {
    if (!width) return 'w-[600px]';
    if (typeof width === 'string') return width;
    return `w-[${width}px]`;
  };

  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement>(null);

  // Reset isSubmitting when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Manage focus to prevent aria-hidden issues
  useEffect(() => {
    if (isOpen && drawerContentRef.current) {
      // Small delay to ensure drawer is fully open
      const timeoutId = setTimeout(() => {
        // Move focus to the drawer content to prevent aria-hidden conflicts
        drawerContentRef.current?.focus();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Update form data when initialValues changes
  useEffect(() => {
    setFormData(initialValues);
    setErrors({});
  }, [initialValues]);

  const validateField = (name: string, value: any) => {
    // If external validation schema is provided, don't use built-in validation
    if (validationSchema) {
      return '';
    }

    const field = fields.find(f => f.name === name);
    if (!field) return '';

    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return field.custom_msg || `${field.label} is required`;
    }

    if (field.type === 'number' && value && isNaN(Number(value))) {
      return `${field.label} must be a valid number`;
    }

    return '';
  };

  const handleChange = (name: string, value: any) => {
    const newFormData = { ...formData, [name]: value } as T;
    setFormData(newFormData);

    const error = validateField(name, value);
    setErrors((prev: Record<string, string>) => ({ ...prev, [name]: error }));

    if (onFieldChange) {
      const updatedValues = onFieldChange(name, value, newFormData);
      if (updatedValues) {
        setFormData(updatedValues);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};

    if (validationSchema) {
      // Use external validation schema if provided
      try {
        await validationSchema.validate(formData, { abortEarly: false });
      } catch (validationError: any) {
        if (validationError.inner) {
          validationError.inner.forEach((error: any) => {
            newErrors[error.path] = error.message;
          });
        }
      }
    } else {
      // Use built-in validation
      fields.forEach(field => {
        const error = validateField(field.name, formData[field.name]);
        if (error) newErrors[field.name] = error;
      });
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await onSubmit(formData, {
          setSubmitting: setIsSubmitting,
          resetForm: () => setFormData(initialValues),
        });
        setIsSubmitting(false);
        onSuccess?.();
      } catch (error) {
        console.error("Submit failed:", error);
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialValues);
      setErrors({});
      onClose?.();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()} direction="right">
      <DrawerContent
        ref={drawerContentRef}
        className={`h-full ${getWidthClass(formWidth)} flex flex-col`}
        tabIndex={-1}
      >
        <DrawerHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>{title}</DrawerTitle>
              {note ? (
                <span className="text-sm text-muted-foreground">
                  {note}
                </span>
              ) : (
                <span className="sr-only">
                  Form dialog for {title || 'form'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {extra && extra({ formData, handleChange, errors })}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                  <IoMdClose className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="flex flex-row items-center gap-2">
                <Spinner />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                {field.type === "hidden" ? (
                  <input type="hidden" name={field.name} value={formData[field.name] || ''} />
                ) : field.type === "select" && field.options ? (
                  <UniFieldSelect
                    label={field.label}
                    value={formData[field.name] || ''}
                    onValueChange={(value) => handleChange(field.name, value)}
                    required={field.required}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    error={errors[field.name]}
                    onAddNew={field.onAddNew}
                    addNewLabel={field.addNewLabel}
                  >
                    {field.options?.filter(option => option != null && option.value != null).map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </UniFieldSelect>
                ) : field.type === "textarea" ? (
                  <UniFieldInput
                    as="textarea"
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    maxLength={field.maxLength}
                    error={errors[field.name]}
                  />
                ) : field.type === "number" ? (
                  <UniFieldInput
                    type="number"
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Enforce maxLength for number inputs
                      if (field.maxLength && value.length > field.maxLength) {
                        return; // Prevent input if exceeds maxLength
                      }
                      handleChange(field.name, value);
                    }}
                    required={field.required}
                    placeholder={field.placeholder}
                    min="0"
                    step="0.01"
                    maxLength={field.maxLength}
                    error={errors[field.name]}
                  />
                ) : field.type === "readonly" ? (
                  <UniFieldInput
                    type="text"
                    label={field.label}
                    value={formData[field.name] || ''}
                    readOnly
                    placeholder={field.placeholder}
                    error={errors[field.name]}
                  />
                ) : field.type === "file" ? (
                  <UniFieldInput
                    type="file"
                    label={field.label}
                    onChange={(e) => handleChange(field.name, e.target.files?.[0] || null)}
                    required={field.required}
                    placeholder={field.placeholder}
                    error={errors[field.name]}
                  />
                ) : field.type === "switch" ? (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </div>
                      {field.note && (
                        <p className="text-sm text-muted-foreground">{field.note}</p>
                      )}
                    </div>
                    <Switch
                      checked={Boolean(formData[field.name])}
                      onCheckedChange={(checked) => handleChange(field.name, checked)}
                    />
                  </div>
                ) : field.type === "radio" && field.options ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </div>
                    <ButtonGroup>
                      {field.options.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={formData[field.name] === option.value.toString() ? "secondary" : "outline"}
                          onClick={() => handleChange(field.name, option.value.toString())}
                          className={`flex-1 ${formData[field.name] === option.value.toString() ? "bg-blue-500 text-white hover:bg-blue-600" : ""} ${errors[field.name] ? 'border-red-500' : ''}`}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                    {errors[field.name] && (
                      <p className="text-sm text-red-500">{errors[field.name]}</p>
                    )}
                  </div>
                ) : (
                  <UniFieldInput
                    type={field.type || "text"}
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    error={errors[field.name]}
                  />
                )}

                {field.note && (
                  <p className="text-sm text-gray-500">Note: {field.note}</p>
                )}
              </div>
            ))}

            {typeof children === "function" && children({ formData, handleChange, errors })}
          </form>
        </div>

        <div className="border-t p-4 shrink-0 flex justify-end">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]" onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  Save
                </span>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DynamicForm;
