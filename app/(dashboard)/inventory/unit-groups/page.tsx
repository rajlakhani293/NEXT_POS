"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { UnitGroupForm } from "./createUpdate"
import { PERMISSIONS } from "@/lib/permissions"

const columns = [
  { key: "name", title: "Name" },
  { key: "user_username", title: "User" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function UnitGroupsPage() {
  return (
    <CatalogPageShell
      tableTitle="Unit Groups List"
      addTitle="Add a new unit group"
      columns={columns}
      getDataHook={(catalog as any).useGetUnitGroupsDataMutation}
      deleteHook={(catalog as any).useDeleteUnitGroupMutation}
      statusHook={(catalog as any).useUpdateUnitGroupStatusMutation}
      FormComponent={UnitGroupForm}
      deleteTitle="Delete Unit Group"
      deleteDescription="Would you like to delete this ?"
      permissions={PERMISSIONS.productUnits}
    />
  )
}
