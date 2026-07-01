"use client"

import { useEffect } from "react"

import DynamicForm from "@/components/DynamicForm"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type CouponFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
}

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
  product_ids: string
  category_ids: string
  customer_ids: string
  customer_group_ids: string
  description?: string
}

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
  product_ids: "",
  category_ids: "",
  customer_ids: "",
  customer_group_ids: "",
}

const csvToIds = (value: string) =>
  value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0)

const idsToCsv = (value: any) => (Array.isArray(value) ? value.join(", ") : "")

const buildCouponFields = (t: (key: string) => string) => [
  { name: "name", label: t("Name"), type: "text", placeholder: t("Enter coupon name"), required: true },
  { name: "code", label: t("Code"), type: "text", placeholder: t("Example: WELCOME10"), required: true },
  {
    name: "type",
    label: t("Discount Type"),
    type: "radio",
    required: true,
    options: [
      { label: t("Flat"), value: "flat_discount" },
      { label: t("Percentage"), value: "percentage_discount" },
    ],
  },
  { name: "discount_value", label: t("Discount Value"), type: "number", placeholder: t("Enter discount"), required: true },
  { name: "minimum_cart_value", label: t("Minimum Cart"), type: "number", placeholder: t("Minimum cart value"), prefix: "₹" },
  { name: "maximum_cart_value", label: t("Maximum Cart"), type: "number", placeholder: t("0 means no maximum"), prefix: "₹" },
  { name: "valid_until", label: t("Valid Until"), type: "date", placeholder: t("Select valid until date") },
  { name: "valid_hours_start", label: t("Valid Hours Start"), type: "text", placeholder: t("HH:MM e.g. 09:00") },
  { name: "valid_hours_end", label: t("Valid Hours End"), type: "text", placeholder: t("HH:MM e.g. 21:00") },
  { name: "limit_usage", label: t("Limit Usage"), type: "number", placeholder: t("0 means unlimited") },
  {
    name: "customer_group_ids",
    label: t("Customer Group IDs"),
    type: "text",
    placeholder: t("Example: 1,2"),
    note: t("Coupon applies to these customer groups. Keep empty for all."),
  },
  {
    name: "customer_ids",
    label: t("Particular Customer IDs"),
    type: "text",
    placeholder: t("Example: 4,8"),
    note: t("Coupon applies to these particular customers. Keep empty for all."),
  },
  {
    name: "category_ids",
    label: t("Category IDs"),
    type: "text",
    placeholder: t("Example: 1,3"),
    note: t("Keep empty if coupon applies to all categories."),
  },
  {
    name: "product_ids",
    label: t("Product IDs"),
    type: "text",
    placeholder: t("Example: 10,12"),
    note: t("Keep empty if coupon applies to all products."),
  },
]

export function CouponForm({ isOpen, onClose, onSuccess, editId }: CouponFormProps) {
  const { t } = useTranslation()
  const [createCoupon] = (promotions as any).useCreateCouponMutation()
  const [editCoupon] = (promotions as any).useEditCouponMutation()
  const [getCouponById, { data, isLoading }] = (promotions as any).useGetCouponByIdMutation()

  useEffect(() => {
    if (isOpen && editId) {
      getCouponById({ id: editId })
    }
  }, [editId, getCouponById, isOpen])

  const record = data?.data
  const couponFields = buildCouponFields(t)
  const formValues: CouponFormValues =
    editId && record
      ? {
          name: record.name || "",
          code: record.code || "",
          type: record.type || "flat_discount",
          discount_value: record.discount_value ? String(record.discount_value) : "",
          minimum_cart_value: record.minimum_cart_value ? String(record.minimum_cart_value) : "",
          maximum_cart_value: record.maximum_cart_value ? String(record.maximum_cart_value) : "",
          valid_until: record.valid_until ? String(record.valid_until).slice(0, 10) : "",
          valid_hours_start: record.valid_hours_start || "",
          valid_hours_end: record.valid_hours_end || "",
          limit_usage: record.limit_usage ? String(record.limit_usage) : "",
          product_ids: idsToCsv(record.product_ids),
          category_ids: idsToCsv(record.category_ids),
          customer_ids: idsToCsv(record.customer_ids),
          customer_group_ids: idsToCsv(record.customer_group_ids),
        }
      : initialValues

  const handleSubmit = async (values: CouponFormValues) => {
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
      product_ids: csvToIds(values.product_ids),
      category_ids: csvToIds(values.category_ids),
      customer_ids: csvToIds(values.customer_ids),
      customer_group_ids: csvToIds(values.customer_group_ids),
    }

    if (editId) {
      const response = await editCoupon({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || t("Coupon updated successfully."))
    } else {
      const response = await createCoupon(payLoad).unwrap()
      showToast.success(response?.message || t("Coupon created successfully."))
    }
    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      key={editId || "create-coupon"}
      fields={couponFields as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? t("Edit Coupon") : t("Create Coupon")}
      note={t("Use customer group IDs or particular customer IDs to target coupons.")}
      isOpen={isOpen}
      formWidth="w-[620px]"
      isLoading={Boolean(editId) && isLoading}
    />
  )
}
