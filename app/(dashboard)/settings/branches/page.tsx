"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { settings } from "@/lib/api/settings"
import { PERMISSIONS } from "@/lib/permissions"
import { BranchForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "phone", title: "Phone" },
  { key: "city", title: "City" },
  { key: "state__name", title: "State" },
]

export default function BranchesPage() {
  return (
    <CatalogPageShell
      tableTitle="Branches"
      addTitle="Add Branch"
      columns={columns}
      getDataHook={(settings as any).useGetBranchesDataMutation}
      deleteHook={(settings as any).useDeleteBranchMutation}
      statusHook={(settings as any).useUpdateBranchStatusMutation}
      FormComponent={BranchForm}
      deleteTitle="Delete Branch"
      deleteDescription="Are you sure you want to delete this branch?"
      permissions={PERMISSIONS.branches}
    />
  )
}
