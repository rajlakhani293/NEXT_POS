"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { payments } from "@/lib/api/payments"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { PaymentTypeForm } from "./createUpdate"

export default function PaymentTypesPage() {
  const { t } = useTranslation()
  const columns = [
    { key: "identifier", title: t("Identifier") },
    { key: "label", title: t("Label") },
    {
      key: "active",
      title: t("Active"),
      render: (value: any) => (value ? t("Yes") : t("No")),
    },
    { key: "priority", title: t("Priority") },
    { key: "created_at", title: t("Created On") },
    {
      key: "readonly",
      title: t("Readonly"),
      render: (value: any) => (value ? t("Yes") : t("No")),
    },
    { key: "user_username", title: t("User") },
  ]

  return (
    <CatalogPageShell
      tableTitle={t("Payment Types List")}
      addTitle={t("Add a new payment type")}
      columns={columns}
      getDataHook={(payments as any).useGetPaymentTypesDataMutation}
      deleteHook={(payments as any).useDeletePaymentTypeMutation}
      statusHook={(payments as any).useUpdatePaymentTypeStatusMutation}
      FormComponent={PaymentTypeForm}
      deleteTitle={t("Delete Payment Type")}
      deleteDescription={t("Would you like to delete this ?")}
      permissions={PERMISSIONS.payments}
    />
  )
}
