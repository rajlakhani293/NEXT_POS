"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ChevronDownIcon, X } from "lucide-react"

import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { catalog } from "@/lib/api/catalog"
import { customers } from "@/lib/api/customers"
import { promotions } from "@/lib/api/promotions"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type CouponFormValues = {
  name: string
  code: string
  type: "flat_discount" | "percentage_discount"
  discount_value: string
  valid_until: string
  minimum_cart_value: string
  maximum_cart_value: string
  valid_hours_start: string
  valid_hours_end: string
  limit_usage: string
  product_ids: number[]
  category_ids: number[]
  customer_group_ids: number[]
  customer_ids: number[]
}

const initialValues: CouponFormValues = {
  name: "",
  code: "",
  type: "flat_discount",
  discount_value: "",
  valid_until: "",
  minimum_cart_value: "",
  maximum_cart_value: "",
  valid_hours_start: "",
  valid_hours_end: "",
  limit_usage: "",
  product_ids: [],
  category_ids: [],
  customer_group_ids: [],
  customer_ids: [],
}

const targetFields: Array<keyof Pick<
  CouponFormValues,
  "product_ids" | "category_ids" | "customer_group_ids" | "customer_ids"
>> = ["product_ids", "category_ids", "customer_group_ids", "customer_ids"]

const idsToArray = (value: any) =>
  Array.isArray(value)
    ? value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0)
    : []

const toDateValue = (value: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

const toDateString = (date: Date | undefined) => {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toOptions = (items: any[] = []) =>
  items.map((item) => ({
    label: item.name || item.title || item.code || `#${item.id}`,
    value: Number(item.id),
  }))

type MultiSelectOption = {
  label: string
  value: number
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0")
  const minutes = index % 2 === 0 ? "00" : "30"
  const value = `${hours}:${minutes}`
  return {
    label: value,
    value,
  }
})

function CouponTimeSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="group/time-select relative">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            className={cn(
              "bg-white text-sm font-semibold text-gray-900",
              value &&
              "[&_svg]:transition-opacity group-hover/time-select:[&_svg]:opacity-0 group-focus-within/time-select:[&_svg]:opacity-0"
            )}
          >
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {timeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            className="absolute top-1/2 right-3 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground opacity-0 transition-opacity group-hover/time-select:opacity-100 group-focus-within/time-select:opacity-100 hover:text-foreground"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onChange("")
            }}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function CouponMultiSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string
  placeholder: string
  value: number[]
  options: MultiSelectOption[]
  onChange: (value: number[]) => void
}) {
  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  )

  const toggleValue = (optionValue: number) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue))
      return
    }
    onChange([...value, optionValue])
  }

  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-10 w-full justify-between border-2 bg-white px-3 py-2 text-left text-sm font-semibold text-gray-900 shadow-none"
          >
            <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {selectedOptions.length ? (
                selectedOptions.slice(0, 3).map((option) => (
                  <span
                    key={option.value}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700"
                  >
                    {option.label}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              {selectedOptions.length > 3 ? (
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                  +{selectedOptions.length - 3}
                </span>
              ) : null}
            </span>
            <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-80 overflow-y-auto">
          {options.length ? (
            options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={value.includes(option.value)}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleValue(option.value)}
                className="cursor-pointer font-medium"
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <div className="px-2 py-6 text-center text-sm font-medium text-muted-foreground">
              No options found.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function CouponFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"

  const [values, setValues] = useState<CouponFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const paginationSentinelRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")

  const [createCoupon] = (promotions as any).useCreateCouponMutation()
  const [editCoupon] = (promotions as any).useEditCouponMutation()
  const [getCouponById, coupon] = (promotions as any).useGetCouponByIdMutation()
  const [getProductsDropdown, products] = (
    catalog as any
  ).useGetProductsDropdownMutation()
  const [getCategoriesDropdown, categories] = (
    catalog as any
  ).useGetCategoriesDropdownMutation()
  const [getCustomersDropdown, customersDropdown] = (
    customers as any
  ).useGetCustomersDropdownMutation()
  const [getCustomerGroupsDropdown, customerGroups] = (
    customers as any
  ).useGetCustomerGroupsDropdownMutation()

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await Promise.all([
        getProductsDropdown(),
        getCategoriesDropdown(),
        getCustomersDropdown(),
        getCustomerGroupsDropdown(),
      ])

      if (!isEdit) {
        setValues(initialValues)
        setErrors({})
        return
      }

      const response = await getCouponById({ id }).unwrap()
      const record = response?.data
      if (!record) return

      setValues({
        name: record.name || "",
        code: record.code || "",
        type: record.type || "flat_discount",
        discount_value: record.discount_value
          ? String(record.discount_value)
          : "",
        valid_until: record.valid_until
          ? String(record.valid_until).slice(0, 10)
          : "",
        minimum_cart_value: record.minimum_cart_value
          ? String(record.minimum_cart_value)
          : "",
        maximum_cart_value: record.maximum_cart_value
          ? String(record.maximum_cart_value)
          : "",
        valid_hours_start: record.valid_hours_start || "",
        valid_hours_end: record.valid_hours_end || "",
        limit_usage: record.limit_usage ? String(record.limit_usage) : "",
        product_ids: idsToArray(record.product_ids),
        category_ids: idsToArray(record.category_ids),
        customer_group_ids: idsToArray(record.customer_group_ids),
        customer_ids: idsToArray(record.customer_ids),
      })
      setErrors({})
    }

    load()
  }, [
    getCategoriesDropdown,
    getCouponById,
    getCustomerGroupsDropdown,
    getCustomersDropdown,
    getProductsDropdown,
    id,
    isEdit,
  ])

  useEffect(() => {
    const sentinel = paginationSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterStuck(!entry.isIntersecting),
      {
        threshold: 0.01,
        rootMargin: "0px 0px -80px 0px",
        root: contentRef.current,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [coupon.isLoading])

  const updateField = (name: keyof CouponFormValues, value: any) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }))
    }
    if (targetFields.includes(name as any) && errors.target_scope) {
      setErrors((current) => ({ ...current, target_scope: "" }))
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = "Coupon name is required"
    if (!values.code.trim()) nextErrors.code = "Coupon code is required"
    if (!values.discount_value)
      nextErrors.discount_value = "Discount value is required"
    const hasTarget = targetFields.some((field) => values[field].length > 0)
    if (!hasTarget) {
      nextErrors.target_scope =
        "Select at least one target: product, category, customer group, or customer."
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/settings/coupons")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const payLoad = {
      name: values.name,
      code: values.code,
      type: values.type,
      discount_value: values.discount_value || "0",
      valid_until: values.valid_until || undefined,
      minimum_cart_value: values.minimum_cart_value || "0",
      maximum_cart_value: values.maximum_cart_value || "0",
      valid_hours_start: values.valid_hours_start || undefined,
      valid_hours_end: values.valid_hours_end || undefined,
      limit_usage: Number(values.limit_usage || 0),
      product_ids: values.product_ids,
      category_ids: values.category_ids,
      customer_group_ids: values.customer_group_ids,
      customer_ids: values.customer_ids,
    }

    setIsSubmitting(true)
    try {
      if (isEdit) {
        const response = await editCoupon({ id, payLoad }).unwrap()
        showToast.success(response?.message || "Coupon updated successfully.")
      } else {
        const response = await createCoupon(payLoad).unwrap()
        showToast.success(response?.message || "Coupon created successfully.")
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (coupon.isLoading && isEdit) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          Loading coupon data...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={goBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isEdit ? "Edit Coupon" : "Create Coupon"}
              </h1>
              <p className="text-xs font-medium text-gray-500">
                Create coupon rules, cart limits, validity and target scope.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <UniFieldInput
                label="Coupon Name"
                required
                placeholder="Enter coupon name"
                value={values.name}
                error={errors.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-5 px-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <UniFieldInput
                  label="Coupon Code"
                  required
                  placeholder="Example: WELCOME10"
                  value={values.code}
                  error={errors.code}
                  onChange={(event) => updateField("code", event.target.value)}
                />

                <div className="">
                  <span className="text-sm font-semibold text-gray-700">
                    Type <span className="text-red-500">*</span>
                  </span>
                  <ButtonGroup className="overflow-hidden rounded-md border bg-white mt-1">
                    {[
                      { label: "Flat Discount", value: "flat_discount" },
                      {
                        label: "Percentage Discount",
                        value: "percentage_discount",
                      },
                    ].map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          updateField("type", item.value as CouponFormValues["type"])
                        }
                        className={cn(
                          "min-w-40 border-0 text-sm font-semibold shadow-none hover:bg-gray-50",
                          values.type === item.value &&
                          "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
                        )}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </div>

                <UniFieldInput
                  label="Discount Value"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  prefix={values.type === "flat_discount" ? "₹" : undefined}
                  suffix={values.type === "percentage_discount" ? "%" : undefined}
                  placeholder="Enter discount value"
                  value={values.discount_value}
                  error={errors.discount_value}
                  onChange={(event) =>
                    updateField("discount_value", event.target.value)
                  }
                />

                <div className="group/date-picker relative">
                  <DatePicker
                    label="Valid Until"
                    placeholder="Select valid until date"
                    className={cn(values.valid_until && "pr-10")}
                    value={toDateValue(values.valid_until)}
                    onChange={(date) =>
                      updateField("valid_until", toDateString(date))
                    }
                  />
                  {values.valid_until ? (
                    <button
                      type="button"
                      aria-label="Clear Valid Until"
                      className="absolute right-3 bottom-3 z-10 flex size-4 items-center justify-center text-muted-foreground opacity-0 transition-opacity group-hover/date-picker:opacity-100 group-focus-within/date-picker:opacity-100 hover:text-foreground"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        updateField("valid_until", "")
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </div>
                <p className="-mt-3 text-xs font-medium text-gray-500">
                  Determine until when the coupon is valid.
                </p>

                <UniFieldInput
                  label="Minimum Cart Value"
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="₹"
                  placeholder="Enter minimum cart value"
                  value={values.minimum_cart_value}
                  onChange={(event) =>
                    updateField("minimum_cart_value", event.target.value)
                  }
                />

                <UniFieldInput
                  label="Maximum Cart Value"
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="₹"
                  placeholder="Enter maximum cart value"
                  value={values.maximum_cart_value}
                  onChange={(event) =>
                    updateField("maximum_cart_value", event.target.value)
                  }
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <CouponTimeSelect
                    label="Valid Hours Start"
                    value={values.valid_hours_start}
                    onChange={(value) =>
                      updateField("valid_hours_start", value)
                    }
                  />
                  <CouponTimeSelect
                    label="Valid Hours End"
                    value={values.valid_hours_end}
                    onChange={(value) =>
                      updateField("valid_hours_end", value)
                    }
                  />
                </div>
                <p className="-mt-3 text-xs font-medium text-gray-500">
                  Define from which hour to which hour coupon can be used.
                </p>

                <UniFieldInput
                  label="Limit Usage"
                  type="number"
                  min="0"
                  placeholder="0 means unlimited"
                  value={values.limit_usage}
                  onChange={(event) =>
                    updateField("limit_usage", event.target.value)
                  }
                />
                <p className="-mt-3 text-xs font-medium text-gray-500">
                  Define how many times this coupon can be redeemed.
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4">
              {errors.target_scope && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                  {errors.target_scope}
                </div>
              )}
              <Tabs defaultValue="products" className="h-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="customer-groups">
                    Customer Groups
                  </TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-3">
                  <CouponMultiSelect
                    label="Select Products"
                    placeholder="Choose products"
                    value={values.product_ids}
                    options={toOptions(products.data?.data)}
                    onChange={(nextValue) => updateField("product_ids", nextValue)}
                  />
                  <p className="text-xs font-medium text-gray-500">
                    The following products will be required to be present in the
                    cart for this coupon to be valid.
                  </p>
                </TabsContent>

                <TabsContent value="categories" className="space-y-3">
                  <CouponMultiSelect
                    label="Select Categories"
                    placeholder="Choose categories"
                    value={values.category_ids}
                    options={toOptions(categories.data?.data)}
                    onChange={(nextValue) => updateField("category_ids", nextValue)}
                  />
                  <p className="text-xs font-medium text-gray-500">
                    Products assigned to one of these categories should be in
                    the cart for this coupon to be valid.
                  </p>
                </TabsContent>

                <TabsContent value="customer-groups" className="space-y-3">
                  <CouponMultiSelect
                    label="Customer Groups"
                    placeholder="Choose customer groups"
                    value={values.customer_group_ids}
                    options={toOptions(customerGroups.data?.data)}
                    onChange={(nextValue) =>
                      updateField("customer_group_ids", nextValue)
                    }
                  />
                  <p className="text-xs font-medium text-gray-500">
                    Only customers belonging to the selected groups can use this
                    coupon.
                  </p>
                </TabsContent>

                <TabsContent value="customers" className="space-y-3">
                  <CouponMultiSelect
                    label="Particular Customers"
                    placeholder="Choose customers"
                    value={values.customer_ids}
                    options={toOptions(customersDropdown.data?.data)}
                    onChange={(nextValue) => updateField("customer_ids", nextValue)}
                  />
                  <p className="text-xs font-medium text-gray-500">
                    Optional: allow only these particular customers to use this
                    coupon.
                  </p>
                </TabsContent>
              </Tabs>
            </section>
          </div>

          <div ref={paginationSentinelRef} className="h-px w-full" />

          <footer
            className={cn(
              "sticky z-50 transition-all duration-300 ease-in-out",
              isFooterStuck ? "bottom-2 mx-3" : "bottom-0 mx-0"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-end gap-x-2 rounded-b-xl bg-white/90 p-3 backdrop-blur-md transition-shadow duration-200",
                isFooterStuck
                  ? "rounded-t-xl border border-gray-200"
                  : "rounded-t-none border-t-2 border-gray-100"
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-28 bg-black text-white hover:bg-black/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Saving...
                  </span>
                ) : isEdit ? (
                  "Update Coupon"
                ) : (
                  "Save Coupon"
                )}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
