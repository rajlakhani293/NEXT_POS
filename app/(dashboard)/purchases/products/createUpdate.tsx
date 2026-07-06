"use client"

import DynamicForm from "@/components/DynamicForm"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type ProcurementProductFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  record?: any | null
}

type ProcurementProductFormValues = {
  expiration_date: string
}

const buildFields = (t: (key: string) => string) => [
  {
    name: "expiration_date",
    label: t("Expiration Date"),
    type: "date",
    placeholder: t("Define what is the expiration date of the product."),
  },
]

export function ProcurementProductForm({
  isOpen,
  onClose,
  onSuccess,
  record,
}: ProcurementProductFormProps) {
  const { t } = useTranslation()
  const [editPurchaseOrderProduct] = (
    purchases as any
  ).useEditPurchaseOrderProductMutation()

  const formValues: ProcurementProductFormValues = {
    expiration_date: record?.expiration_date
      ? String(record.expiration_date).slice(0, 10)
      : "",
  }

  const handleSubmit = async (values: ProcurementProductFormValues) => {
    if (!record) return
    const response = await editPurchaseOrderProduct({
      id: record.procurement_id,
      productId: record.id,
      payLoad: {
        expiration_date: values.expiration_date || null,
      },
    }).unwrap()
    showToast.success(response?.message || t("Procurement product updated successfully."))
    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      key={record?.id || "edit-procurement-product"}
      fields={buildFields(t) as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={t("Edit procurement product")}
      isOpen={isOpen}
      formWidth="w-[520px]"
    />
  )
}
