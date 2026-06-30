"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Boxes, PackageSearch } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { purchases } from "@/lib/api/purchases"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { SupplierForm } from "../purchases/suppliers/createUpdate"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const columns = [
  { key: "first_name", title: "First Name" },
  { key: "email", title: "Email" },
  { key: "phone", title: "Phone" },
  { key: "amount_due", title: "Amount Due", render: (value: any) => formatMoney(value) },
  { key: "amount_paid", title: "Amount Paid", render: (value: any) => formatMoney(value) },
  { key: "user_username", title: "Author" },
  { key: "created_at", title: "Created At", render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function ProvidersPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<{
    isOpen: boolean
    editId?: number | string | null
  }>({ isOpen: false, editId: null })
  const [deleteSupplier] = (purchases as any).useDeleteSupplierMutation()
  const [updateSupplierStatus] = (purchases as any).useUpdateSupplierStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.purchases.create)
  const canUpdate = hasPermission(PERMISSIONS.purchases.update)
  const canDelete = hasPermission(PERMISSIONS.purchases.delete)

  const {
    orders,
    totalItems,
    isLoading,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    sortableFields,
    handleFilterChange,
    searchTerm,
    itemsPerPage,
    triggerRefresh,
    selectedDateRange,
    dateFilters,
  } = useTableData({
    getMaster: (purchases as any).useGetProvidersDataMutation,
    itemsPerPage: 10,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.purchases.view}>
      <div className="h-full space-y-4">
        <DynamicTable
          data={orders}
          columns={columns}
          tableTitle="Providers"
          title={canCreate ? "Add Provider" : undefined}
          showSearch
          searchTerm={searchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onFilterChange={handleFilterChange}
          sortConfig={sortConfig}
          onSort={handleSort}
          sortableFields={sortableFields}
          isLoading={isLoading}
          setAddEntityOpen={
            canCreate
              ? (open: boolean) => open && setFormState({ isOpen: true, editId: null })
              : undefined
          }
          showEdit={canUpdate}
          onEdit={(record: any) => setFormState({ isOpen: true, editId: record.id })}
          showDelete={canDelete}
          deleteMutation={deleteSupplier}
          showStatus={canUpdate}
          statusChangeMutation={({ ids, status }: any) => updateSupplierStatus({ payLoad: { ids, status } })}
          triggerRefresh={triggerRefresh}
          deleteModalTitle="Delete Provider"
          deleteModalDescription="Are you sure you want to delete this provider?"
          selectedDateRange={selectedDateRange}
          dateFilters={dateFilters}
          rowActions={(_, record) => [
            {
              key: "procurements",
              label: "See Procurements",
              labelText: "See Procurements",
              icon: <Boxes className="size-4" />,
              onClick: () => router.push(`/providers/${record.id}/procurements`),
            },
            {
              key: "products",
              label: "See Products",
              labelText: "See Products",
              icon: <PackageSearch className="size-4" />,
              onClick: () => router.push(`/providers/${record.id}/products`),
            },
          ]}
        />
        <SupplierForm
          isOpen={formState.isOpen}
          editId={formState.editId}
          onClose={() => setFormState({ isOpen: false, editId: null })}
          onSuccess={triggerRefresh}
        />
      </div>
    </PermissionGuard>
  )
}
