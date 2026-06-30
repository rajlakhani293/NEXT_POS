"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { UnitGroupForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "description", title: "Description" },
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
    />
  )
}
