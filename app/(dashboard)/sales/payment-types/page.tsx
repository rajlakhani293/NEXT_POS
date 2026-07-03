"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { payments } from "@/lib/api/payments"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { PaymentTypeForm } from "./createUpdate"

export default function PaymentTypesPage() {
  const { t } = useTranslation()
  const columns = [
    { key: "identifier", title: "Identifier" },
    { key: "label", title: "Label" },
    {
      key: "active",
      title: "Active",
      render: (value: any) => (value ? t("Yes") : t("No")),
    },
    { key: "priority", title: "Priority" },
    {
      key: "created_at",
      title: "Created On",
      render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      key: "readonly",
      title: "Readonly",
      render: (value: any) => (value ? t("Yes") : t("No")),
    },
    { key: "user_username", title: "Author" },
  ]

  return (
    <CatalogPageShell
      tableTitle="Payment Types List"
      addTitle="Add a new payment type"
      columns={columns}
      getDataHook={(payments as any).useGetPaymentTypesDataMutation}
      deleteHook={(payments as any).useDeletePaymentTypeMutation}
      statusHook={(payments as any).useUpdatePaymentTypeStatusMutation}
      FormComponent={PaymentTypeForm}
      deleteTitle="Delete Payment Type"
      deleteDescription="Would you like to delete this ?"
      permissions={PERMISSIONS.payments}
    />
  )
}
