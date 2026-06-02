"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { TaxGroupForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "description", title: "Description" },
]

export default function TaxGroupsPage() {
  return (
    <CatalogPageShell
      tableTitle="Tax Groups"
      addTitle="Add Tax Group"
      columns={columns}
      getDataHook={(catalog as any).useGetTaxGroupsDataMutation}
      deleteHook={(catalog as any).useDeleteTaxGroupMutation}
      statusHook={(catalog as any).useUpdateTaxGroupStatusMutation}
      FormComponent={TaxGroupForm}
      deleteTitle="Delete Tax Group"
      deleteDescription="Are you sure you want to delete this tax group?"
    />
  )
}
