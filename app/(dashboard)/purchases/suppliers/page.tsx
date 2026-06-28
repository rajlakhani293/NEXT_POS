"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { purchases } from "@/lib/api/purchases"
import { PERMISSIONS } from "@/lib/permissions"
import { SupplierForm } from "./createUpdate"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const columns = [
  { key: "first_name", title: "First Name" },
  { key: "email", title: "Email" },
  { key: "phone", title: "Phone" },
  {
    key: "amount_due",
    title: "Amount Due",
    render: (value: any) => formatMoney(value),
  },
  {
    key: "amount_paid",
    title: "Amount Paid",
    render: (value: any) => formatMoney(value),
  },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
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
