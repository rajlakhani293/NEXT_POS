"use client"

import { useEffect, useMemo } from "react"

import DynamicForm from "@/components/DynamicForm"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"

type StockAdjustmentFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product?: any
}

const initialValues = {
  adjust_unit_id: "",
  adjust_action: "",
  quantity: "",
  reason: "",
}

export function StockAdjustmentForm({
  isOpen,
  onClose,
  onSuccess,
  product,
}: StockAdjustmentFormProps) {
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const currencyIndicator =
    posOptions.currency_preferred === "iso"
      ? posOptions.currency_iso
      : posOptions.currency_symbol
  const [adjustProductStock] = (catalog as any).useAdjustProductStockMutation()
  const [getProductUnitQuantities, productUnitQuantities] = (
    catalog as any
  ).useGetProductUnitQuantitiesMutation()

  useEffect(() => {
    if (!isOpen || !product?.id) return
    getProductUnitQuantities({ productId: product.id })
  }, [getProductUnitQuantities, isOpen, product?.id])

  const unitQuantities = useMemo(
    () => productUnitQuantities.data?.data || [],
    [productUnitQuantities.data?.data]
  )
  const defaultUnit = useMemo(
    () =>
      unitQuantities.find((quantity: any) => quantity.unit?.base_unit || quantity.base_unit) ||
      unitQuantities[0],
    [unitQuantities]
  )
  const formatQuantity = (value: any) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: Number(posOptions.currency_precision ?? 2),
    })
  const unitOptions = unitQuantities.map((quantity: any) => {
    const unitName =
      quantity.unit_name ||
      quantity.unit_short_name ||
      quantity.unit_identifier ||
      quantity.unit?.name ||
      quantity.unit?.identifier ||
      t("N/A")
    return {
      label: `${unitName} (${formatQuantity(quantity.quantity)})`,
      value: quantity.unit_id || quantity.unit?.id,
    }
  })
  const findSelectedUnit = (unitId: any) =>
    unitQuantities.find(
      (quantity: any) => String(quantity.unit_id || quantity.unit?.id) === String(unitId)
    )
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)

  const handleSubmit = async (values: typeof initialValues) => {
    const selectedUnit = findSelectedUnit(values.adjust_unit_id)
    if (!selectedUnit) {
      showToast.error(t("The unit is not set for the product."))
      return
    }

    const quantity = Number(values.quantity || 0)
    if (quantity < 0) {
      showToast.error(t("The adjustment quantity can't be negative."))
      return
    }

    if (!["added", "set"].includes(values.adjust_action) && quantity > Number(selectedUnit.quantity || 0)) {
      showToast.error(t("The specified quantity exceed the available quantity."))
      return
    }

    const response = await adjustProductStock({
      payLoad: {
        products: [
          {
            id: Number(product.id),
            name: product.name,
            adjust_action: values.adjust_action,
            adjust_quantity: quantity,
            adjust_reason: values.reason || "",
            adjust_unit: {
              unit_id: Number(selectedUnit.unit_id || selectedUnit.unit?.id),
              sale_price: Number(selectedUnit.sale_price || 0),
            },
            procurement_product_id: 0,
          },
        ],
      },
    }).unwrap()
    showToast.success(response?.message || t("Stock adjustment completed successfully."))
    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      fields={[
        {
          name: "product_name",
          label: t("Product"),
          type: "readonly",
          defaultValue: product?.name || "",
        },
        {
          name: "adjust_unit_id",
          label: t("Select Unit"),
          placeholder: t("Select unit"),
          type: "select",
          required: true,
          options: unitOptions,
          note: t("Select the unit that you want to adjust the stock with."),
        },
        {
          name: "adjust_action",
          label: t("Select Action"),
          placeholder: t("Select action"),
          type: "select",
          required: true,
          options: [
            { label: t("Add"), value: "added" },
            { label: t("Delete"), value: "deleted" },
            { label: t("Defective"), value: "defective" },
            { label: t("Lost"), value: "lost" },
            { label: t("Set"), value: "set" },
          ],
        },
        {
          name: "quantity",
          label: t("Quantity"),
          placeholder: t("Enter quantity"),
          type: "number",
          required: true,
          validate: (value, values) => {
            const quantity = Number(value || 0)
            const selectedUnit = findSelectedUnit(values.adjust_unit_id)
            if (!selectedUnit || ["added", "set"].includes(values.adjust_action)) return ""
            return quantity > Number(selectedUnit.quantity || 0)
              ? t("The specified quantity exceed the available quantity.")
              : ""
          },
        },
        {
          name: "reason",
          label: t("More Details"),
          placeholder: t("Useful to describe better what are the reasons that leaded to this adjustment."),
          type: "text",
        },
      ]}
      initialValues={{
        ...initialValues,
        product_name: product?.name || "",
        adjust_unit_id: defaultUnit ? String(defaultUnit.unit_id || defaultUnit.unit?.id) : "",
        quantity: "1",
      }}
      onSubmit={handleSubmit}
      onClose={onClose}
      title={t("Stock Adjustment")}
      note={
        defaultUnit
          ? `${t("Quantity")}: ${formatQuantity(defaultUnit.quantity)} | ${t("Value")}: ${formatMoney(defaultUnit.sale_price || 0)}`
          : t("This product doesn't have any stock to adjust.")
      }
      isOpen={isOpen}
      formWidth="w-[560px]"
      isLoading={productUnitQuantities.isLoading}
    />
  )
}
