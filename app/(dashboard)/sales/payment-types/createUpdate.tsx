"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { payments } from "@/lib/api/payments"

const initialValues = {
  label: "",
  active: true,
  priority: 0,
  identifier: "",
  description: "",
}

export function PaymentTypeForm(props: any) {
  const fields = [
    {
      name: "label",
      label: "Label",
      type: "text",
      placeholder: "Provide a label to the resource.",
      required: true,
    },
    {
      name: "active",
      label: "Active",
      type: "switch",
      note: "Determine whether this payment type can be used.",
    },
    {
      name: "priority",
      label: "Priority",
      type: "number",
      placeholder:
        'Define the order for the payment. The lower the number is, the first it will display on the payment popup. Must start from "0".',
    },
    {
      name: "identifier",
      label: "Identifier",
      type: "text",
      placeholder: "Leave empty to generate it from the label.",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
    },
  ]

  return (
    <CatalogMasterForm
      {...props}
      entityName="Payment Type"
      fields={fields}
      initialValues={initialValues}
      createHook={(payments as any).useCreatePaymentTypeMutation}
      editHook={(payments as any).useEditPaymentTypeMutation}
      getByIdHook={(payments as any).useGetPaymentTypeByIdMutation}
      buildPayload={(values) => ({
        label: values.label,
        active: Boolean(values.active),
        priority: Math.max(Number(values.priority || 0), 0),
        identifier: values.identifier || "",
        description: values.description || "",
      })}
    />
  )
}
