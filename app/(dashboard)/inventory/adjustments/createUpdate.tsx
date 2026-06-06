"use client"

import { useEffect, useRef } from "react"

import DynamicForm from "@/components/DynamicForm"
import { catalog } from "@/lib/api/catalog"
import { inventory } from "@/lib/api/inventory"
import { showToast } from "@/lib/toast"

type StockAdjustmentFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const initialValues = {
  product_id: "",
  adjustment_type: "increase",
  quantity: "",
  unit_cost: "",
  reason: "",
  note: "",
}

export function StockAdjustmentForm({
  isOpen,
  onClose,
  onSuccess,
}: StockAdjustmentFormProps) {
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
    label: `${product.name}${product.sku ? ` (${product.sku})` : ""}`,
    value: product.id,
  }))

  const handleSubmit = async (values: typeof initialValues) => {
    const response = await createStockAdjustment({
      ...values,
      product_id: Number(values.product_id),
      quantity: values.quantity || "0",
      unit_cost: values.unit_cost || "0",
    }).unwrap()
    showToast.success(response?.message || "Stock adjustment created successfully.")
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
          options: productOptions,
        },
        {
          name: "adjustment_type",
          label: "Adjustment Type",
          placeholder: "Select type",
          type: "select",
          required: true,
          options: [
            { label: "Increase Stock", value: "increase" },
            { label: "Decrease Stock", value: "decrease" },
          ],
        },
        {
          name: "quantity",
          label: "Quantity",
          placeholder: "Enter quantity",
          type: "number",
          required: true,
        },
        {
          name: "unit_cost",
          label: "Unit Cost",
          placeholder: "Optional cost",
          type: "number",
          prefix: "₹",
        },
        {
          name: "reason",
          label: "Reason",
          placeholder: "Damage, opening correction, manual adjustment",
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
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      title="Create Stock Adjustment"
      isOpen={isOpen}
      formWidth="w-[560px]"
    />
  )
}
