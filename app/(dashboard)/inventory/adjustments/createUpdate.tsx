"use client"

import { useEffect, useRef } from "react"

import DynamicForm from "@/components/DynamicForm"
import { catalog } from "@/lib/api/catalog"
import { inventory } from "@/lib/api/inventory"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"

type StockAdjustmentFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product?: any
}

const initialValues = {
  product_id: "",
  adjustment_type: "",
  quantity: "",
  unit_cost: "",
  reason: "",
  note: "",
}

export function StockAdjustmentForm({
  isOpen,
  onClose,
  onSuccess,
  product,
}: StockAdjustmentFormProps) {
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const loadedRef = useRef(false)
  const [createStockAdjustment] = (
    inventory as any
  ).useCreateStockAdjustmentMutation()
  const [getProductsDropdown, products] = (
    catalog as any
  ).useGetProductsDropdownMutation()

  useEffect(() => {
    if (!isOpen || loadedRef.current) return
    loadedRef.current = true
    getProductsDropdown()
  }, [getProductsDropdown, isOpen])

  const productOptions = (products.data?.data || []).map((product: any) => ({
    label: `${product.name}${product.sku ? ` (${product.sku})` : ""} - ${t("Stock")}: ${product.current_stock || 0}`,
    value: product.id,
  }))
  const productFieldOptions = product
    ? [
        {
          label: `${product.name}${product.sku ? ` (${product.sku})` : ""} - ${t("Stock")}: ${product.current_stock || 0}`,
          value: product.id,
        },
      ]
    : productOptions

  const handleSubmit = async (values: typeof initialValues) => {
    const response = await createStockAdjustment({
      ...values,
      product_id: Number(values.product_id),
      quantity: values.quantity || "0",
      unit_cost: values.unit_cost || "0",
    }).unwrap()
    showToast.success(response?.message || t("Stock adjustment created successfully."))
    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      fields={[
        {
          name: "product_id",
          label: "Product",
          placeholder: "Select product",
          type: "select",
          required: true,
          options: productFieldOptions,
          disabled: Boolean(product),
        },
        {
          name: "adjustment_type",
          label: "Select Action",
          placeholder: "Select action",
          type: "select",
          required: true,
          options: [
            { label: "Add", value: "added" },
            { label: "Delete", value: "deleted" },
            { label: "Defective", value: "defective" },
            { label: "Lost", value: "lost" },
            { label: "Set", value: "set" },
          ],
        },
        {
          name: "quantity",
          label: "Quantity",
          placeholder: "Enter quantity. For Set, enter final stock.",
          type: "number",
          required: true,
        },
        {
          name: "unit_cost",
          label: "Unit Cost",
          placeholder: "Optional cost",
          type: "number",
          prefix: posOptions.currency_symbol,
        },
        {
          name: "reason",
          label: "Reason",
          placeholder: "Useful to describe why this adjustment is needed",
          type: "text",
          required: true,
        },
        {
          name: "note",
          label: "Note",
          placeholder: "Optional note",
          type: "textarea",
          rows: 3,
        },
      ]}
      initialValues={{
        ...initialValues,
        product_id: product?.id ? String(product.id) : "",
      }}
      onSubmit={handleSubmit}
      onClose={onClose}
      title="Stock Adjustment"
      isOpen={isOpen}
      formWidth="w-[560px]"
    />
  )
}
