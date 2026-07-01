"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { BranchForm } from "./createUpdate"

export default function BranchesPage() {
  const { t } = useTranslation()
  const columns = [
    { key: "name", title: "Name" },
    { key: "code", title: "Code" },
    { key: "phone", title: "Phone" },
    { key: "city", title: "City" },
    { key: "state", title: "State" },
    {
      key: "is_head_office",
      title: "Head Office",
      render: (value: any) => (value ? t("Yes") : t("No")),
    },
  ]

  return (
    <CatalogPageShell
      tableTitle="Branches List"
      addTitle="Add a new branch"
      columns={columns}
      getDataHook={(settings as any).useGetBranchesDataMutation}
      deleteHook={(settings as any).useDeleteBranchMutation}
      statusHook={(settings as any).useUpdateBranchStatusMutation}
      FormComponent={BranchForm}
      deleteTitle="Delete Branch"
      deleteDescription="Would you like to delete this branch?"
      permissions={PERMISSIONS.branches}
    />
  )
}
