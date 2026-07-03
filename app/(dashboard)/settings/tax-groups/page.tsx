"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { PERMISSIONS } from "@/lib/permissions"
import { TaxGroupForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function TaxGroupsPage() {
  return (
    <CatalogPageShell
      tableTitle="Taxes Groups List"
      addTitle="Add a new tax group"
      columns={columns}
      getDataHook={(catalog as any).useGetTaxGroupsDataMutation}
      deleteHook={(catalog as any).useDeleteTaxGroupMutation}
      statusHook={(catalog as any).useUpdateTaxGroupStatusMutation}
      FormComponent={TaxGroupForm}
      deleteTitle="Delete Tax Group"
      deleteDescription="Would you like to delete this tax group?"
      permissions={PERMISSIONS.taxes}
    />
  )
}
