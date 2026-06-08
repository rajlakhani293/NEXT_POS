"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { purchases } from "@/lib/api/purchases"
import { PERMISSIONS } from "@/lib/permissions"
import { SupplierForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "phone", title: "Phone" },
  { key: "email", title: "Email" },
  { key: "contact_person", title: "Contact Person" },
  { key: "payable_amount", title: "Payable" },
]

export default function SuppliersPage() {
  return (
    <CatalogPageShell
      tableTitle="Suppliers"
      addTitle="Add Supplier"
      columns={columns}
      getDataHook={(purchases as any).useGetSuppliersDataMutation}
      deleteHook={(purchases as any).useDeleteSupplierMutation}
      statusHook={(purchases as any).useUpdateSupplierStatusMutation}
      FormComponent={SupplierForm}
      deleteTitle="Delete Supplier"
      deleteDescription="Are you sure you want to delete this supplier?"
      permissions={PERMISSIONS.purchases}
    />
  )
}
