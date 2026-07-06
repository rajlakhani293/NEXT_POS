"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { PERMISSIONS } from "@/lib/permissions"
import { TaxForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "parent_name", title: "Parent" },
  { key: "rate", title: "Rate", render: (value: any) => `${value}%` },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function TaxesPage() {
  return (
    <CatalogPageShell
      tableTitle="Taxes List"
      addTitle="Add a new tax"
      columns={columns}
      getDataHook={(catalog as any).useGetTaxesDataMutation}
      deleteHook={(catalog as any).useDeleteTaxMutation}
      statusHook={(catalog as any).useUpdateTaxStatusMutation}
      FormComponent={TaxForm}
      deleteTitle="Delete Tax"
      deleteDescription="Would you like to delete this ?"
      permissions={PERMISSIONS.taxes}
    />
  )
}
