"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { UnitForm } from "./createUpdate"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"

const columns = [
  { key: "name", title: "Name" },
  { key: "value", title: "Value" },
  {
    key: "base_unit",
    title: "Base Unit",
    render: (value: boolean) => (value ? "Yes" : "No"),
  },
  { key: "group_name", title: "Group" },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function UnitsPage() {
  const { t } = useTranslation()
  const translatedColumns = columns.map((column) => ({
    ...column,
    render:
      column.key === "base_unit"
        ? (value: boolean) => (value ? t("Yes") : t("No"))
        : column.render,
  }))

  return (
    <CatalogPageShell
      tableTitle="Units List"
      addTitle="Add a new unit"
      columns={translatedColumns}
      getDataHook={(catalog as any).useGetUnitsDataMutation}
      deleteHook={(catalog as any).useDeleteUnitMutation}
      statusHook={(catalog as any).useUpdateUnitStatusMutation}
      FormComponent={UnitForm}
      deleteTitle="Delete Unit"
      deleteDescription="Would you like to delete this ?"
      permissions={PERMISSIONS.productUnits}
    />
  )
}
