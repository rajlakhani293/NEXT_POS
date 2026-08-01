"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { DateTimePicker, TimePicker } from "@/components/date-picker"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { catalog } from "@/lib/api/catalog"
import { customers } from "@/lib/api/customers"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"
import {
  toIdArray,
  idsToSelectValues,
  toSelectOptions,
  generateRandomCode,
  MultiTargetSelect,
} from "./utils"

type CouponFormValues = {
  name: string
  code: string
  type: string
  discount_value: string
  minimum_cart_value: string
  maximum_cart_value: string
  valid_until: string
  valid_hours_start: string
  valid_hours_end: string
  limit_usage: string
  product_ids: string[]
  category_ids: string[]
  customer_group_ids: string[]
}

type CouponTargetTab = "products" | "categories" | "groups"

const initialValues: CouponFormValues = {
  name: "",
  code: "",
  type: "flat_discount",
  discount_value: "",
  minimum_cart_value: "",
  maximum_cart_value: "",
  valid_until: "",
  valid_hours_start: "",
  valid_hours_end: "",
  limit_usage: "",
  product_ids: [],
  category_ids: [],
  customer_group_ids: [],
}


export default function CouponFormPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const routeId = String(params.id || "create")
  const couponId = routeId === "create" ? null : routeId
  const isEdit = Boolean(couponId)
  const loadKeyRef = useRef("")
  const dropdownsLoadedRef = useRef(false)

  const [values, setValues] = useState<CouponFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTargetTab, setActiveTargetTab] = useState<CouponTargetTab>("products")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createCoupon] = (promotions as any).useCreateCouponMutation()
  const [editCoupon] = (promotions as any).useEditCouponMutation()
  const [getCouponById, couponState] = (promotions as any).useGetCouponByIdMutation()
  const [getProductsDropdown, productsState] = (catalog as any).useGetProductsDropdownMutation()
  const [getCategoriesDropdown, categoriesState] = (catalog as any).useGetCategoriesDropdownMutation()
  const [getCustomerGroupsDropdown, customerGroupsState] = (customers as any).useGetCustomerGroupsDropdownMutation()

  useEffect(() => {
    if (dropdownsLoadedRef.current) return
    dropdownsLoadedRef.current = true
    getProductsDropdown({})
    getCategoriesDropdown({})
    getCustomerGroupsDropdown({})
  }, [])

  useEffect(() => {
    const loadKey = `${couponId || "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      if (!couponId) {
        setValues(initialValues)
        setErrors({})
        return
      }

      const response = await getCouponById({ id: couponId }).unwrap()
      const record = response?.data
      if (!record) return
      setValues({
        name: record.name || "",
        code: record.code || "",
        type: record.type || "flat_discount",
        discount_value: record.discount_value ? String(record.discount_value) : "",
        minimum_cart_value: record.minimum_cart_value ? String(record.minimum_cart_value) : "",
        maximum_cart_value: record.maximum_cart_value ? String(record.maximum_cart_value) : "",
        valid_until: record.valid_until ? String(record.valid_until) : "",
        valid_hours_start: record.valid_hours_start || "",
        valid_hours_end: record.valid_hours_end || "",
        limit_usage: record.limit_usage ? String(record.limit_usage) : "",
        product_ids: idsToSelectValues(record.product_ids),
        category_ids: idsToSelectValues(record.category_ids),
        customer_group_ids: idsToSelectValues(record.customer_group_ids),
      })
      setErrors({})
    }

    load()
  }, [couponId, getCouponById])

  const isLoading =
    couponState.isLoading ||
    productsState.isLoading ||
    categoriesState.isLoading ||
    customerGroupsState.isLoading

  const updateField = <K extends keyof CouponFormValues>(name: K, value: CouponFormValues[K]) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = t("Name is required")
    if (!values.code.trim()) nextErrors.code = t("Code is required")
    if (!values.discount_value) nextErrors.discount_value = t("Discount Value is required")
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/promotions/coupons")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payLoad = {
        name: values.name,
        code: values.code,
        type: values.type,
        discount_value: values.discount_value || "0",
        minimum_cart_value: values.minimum_cart_value || "0",
        maximum_cart_value: values.maximum_cart_value || "0",
        valid_until: values.valid_until || undefined,
        valid_hours_start: values.valid_hours_start || undefined,
        valid_hours_end: values.valid_hours_end || undefined,
        limit_usage: Number(values.limit_usage || 0),
        product_ids: toIdArray(values.product_ids),
        category_ids: toIdArray(values.category_ids),
        customer_group_ids: toIdArray(values.customer_group_ids),
      }

      if (couponId) {
        const response = await editCoupon({ id: couponId, payLoad }).unwrap()
        showToast.success(response?.message || t("Coupon updated successfully."))
      } else {
        const response = await createCoupon(payLoad).unwrap()
        showToast.success(response?.message || t("Coupon created successfully."))
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  const targetSections: Record<CouponTargetTab, React.ReactNode> = {
    products: (
      <MultiTargetSelect
        key="products-select"
        label={t("Select Products")}
        description={t("The following products will be required to be present on the cart, in order for this coupon to be valid.")}
        options={toSelectOptions(productsState.data?.data)}
        value={values.product_ids}
        onChange={(nextValue) => updateField("product_ids", nextValue)}
      />
    ),
    categories: (
      <MultiTargetSelect
        key="categories-select"
        label={t("Select Categories")}
        description={t("The products assigned to one of these categories should be on the cart, in order for this coupon to be valid.")}
        options={toSelectOptions(categoriesState.data?.data)}
        value={values.category_ids}
        onChange={(nextValue) => updateField("category_ids", nextValue)}
      />
    ),
    groups: (
      <MultiTargetSelect
        key="groups-select"
        label={t("Assigned To Customer Group")}
        description={t("Only the customers who belongs to the selected groups will be able to use the coupon.")}
        options={toSelectOptions(customerGroupsState.data?.data)}
        value={values.customer_group_ids}
        onChange={(nextValue) => updateField("customer_group_ids", nextValue)}
      />
    ),
  }

  if (isLoading) {
    return (
      <DashboardPage padding="none">
        <div className="flex h-full items-center justify-center bg-gray-50">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <Spinner className="h-5 w-5" />
            {t("Loading coupon...")}
          </div>
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage padding="none">
      <form noValidate onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
        <div className="flex-none border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={goBack}>
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900">
                  {isEdit ? t("Edit Coupon") : t("Create Coupon")}
                </h1>
                <p className="text-sm text-gray-500">{t("helps you creating a coupon.")}</p>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("Saving...") : t("Save")}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">{t("General")}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UniFieldInput
                  label={t("Name")}
                  required
                  value={values.name}
                  error={errors.name}
                  placeholder={t("Enter coupon name")}
                  onChange={(event) => updateField("name", event.target.value)}
                />
                <UniFieldInput
                  label={t("Code")}
                  required
                  value={values.code}
                  error={errors.code}
                  placeholder={t("Example: WELCOME10")}
                  onChange={(event) => updateField("code", event.target.value)}
                  addonAfter={
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => updateField("code", generateRandomCode())}
                      className="border-2 border-l-0 rounded-l-none"
                    >
                      {t("Generate")}
                    </Button>
                  }
                />
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-gray-700">{t("Discount Type")}</label>
                  <ButtonGroup>
                    {[
                      { label: t("Flat"), value: "flat_discount" },
                      { label: t("Percentage"), value: "percentage_discount" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={values.type === option.value ? "blue" : "outline"}
                        onClick={() => updateField("type", option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </div>
                <UniFieldInput
                  label={t("Discount Value")}
                  required
                  type="number"
                  value={values.discount_value}
                  error={errors.discount_value}
                  placeholder={t("Enter discount")}
                  onChange={(event) => updateField("discount_value", event.target.value)}
                  prefix={values.type === "flat_discount" ? posOptions.currency_symbol : undefined}
                  suffix={values.type === "percentage_discount" ? "%" : undefined}
                />
                <UniFieldInput
                  label={t("Minimum Cart")}
                  type="number"
                  value={values.minimum_cart_value}
                  prefix={posOptions.currency_symbol}
                  placeholder={t("Minimum cart value")}
                  onChange={(event) => updateField("minimum_cart_value", event.target.value)}
                />
                <UniFieldInput
                  label={t("Maximum Cart")}
                  type="number"
                  value={values.maximum_cart_value}
                  prefix={posOptions.currency_symbol}
                  placeholder={t("0 means no maximum")}
                  onChange={(event) => updateField("maximum_cart_value", event.target.value)}
                />
                <DateTimePicker
                  label={t("Valid Until")}
                  value={values.valid_until ? new Date(values.valid_until) : undefined}
                  onChange={(date) => updateField("valid_until", date ? date.toISOString() : "")}
                  placeholder={t("Pick date and time")}
                  timeLabel={t("Time")}
                />
                <UniFieldInput
                  label={t("Limit Usage")}
                  type="number"
                  value={values.limit_usage}
                  placeholder={t("0 means unlimited")}
                  onChange={(event) => updateField("limit_usage", event.target.value)}
                />
                <TimePicker
                  label={t("Valid Hours Start")}
                  value={values.valid_hours_start}
                  placeholder={t("HH:MM e.g. 09:00")}
                  clearLabel={t("Clear")}
                  onChange={(time) => updateField("valid_hours_start", time)}
                />
                <TimePicker
                  label={t("Valid Hours End")}
                  value={values.valid_hours_end}
                  placeholder={t("HH:MM e.g. 21:00")}
                  clearLabel={t("Clear")}
                  onChange={(time) => updateField("valid_hours_end", time)}
                />
              </div>
            </section>

            <section className="min-w-0">
              <Tabs value={activeTargetTab} onValueChange={(value) => setActiveTargetTab(value as CouponTargetTab)}>
                <TabsList variant="line" className="w-full justify-start">
                  <TabsTrigger value="products">{t("Products")}</TabsTrigger>
                  <TabsTrigger value="categories">{t("Categories")}</TabsTrigger>
                  <TabsTrigger value="groups">{t("Customer Groups")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="pt-4">{targetSections[activeTargetTab]}</div>
            </section>
          </div>
        </div>
      </form>
    </DashboardPage>
  )
}
