"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { UnitForm } from "./createUpdate"

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
  return (
    <CatalogPageShell
      tableTitle="Units"
      addTitle="Add Unit"
      columns={columns}
      getDataHook={(catalog as any).useGetUnitsDataMutation}
      deleteHook={(catalog as any).useDeleteUnitMutation}
      statusHook={(catalog as any).useUpdateUnitStatusMutation}
      FormComponent={UnitForm}
      deleteTitle="Delete Unit"
      deleteDescription="Are you sure you want to delete this unit?"
    />
  )
}
