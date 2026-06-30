"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { CustomerGroupForm } from "@/app/(dashboard)/customers/groups/createUpdate"
import { customers } from "@/lib/api/customers"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "name", title: "Name" },
  { key: "reward_name", title: "Reward System" },
  { key: "user_username", title: "Author" },
  { key: "created_at", title: "Created On", render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function CustomerGroupsPage() {
  const searchParams = useSearchParams()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [deleteCustomerGroup] = (customers as any).useDeleteCustomerGroupMutation()
  const [updateCustomerGroupStatus] = (
    customers as any
  ).useUpdateCustomerGroupStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.customers.create)
  const canUpdate = hasPermission(PERMISSIONS.customers.update)
  const canDelete = hasPermission(PERMISSIONS.customers.delete)

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
  } = useTableData({
    getMaster: (customers as any).useGetCustomerGroupsDataMutation,
    itemsPerPage: 10,
  })

  const handleAdd = (open: boolean) => {
    setEditId(null)
    setIsFormOpen(open)
  }

  const handleEdit = (record: any) => {
    setEditId(record.id)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditId(null)
  }

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setEditId(null)
      setIsFormOpen(true)
    }
  }, [canCreate, searchParams])

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Customer Groups List"
        title={canCreate ? "Add a new Customers Group" : undefined}
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
        setAddEntityOpen={canCreate ? handleAdd : undefined}
        showEdit={canUpdate}
        showDateRange
        onEdit={handleEdit}
        showDelete={canDelete}
        deleteMutation={deleteCustomerGroup}
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateCustomerGroupStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Customer Group"
        deleteModalDescription="Would you like to delete this ?"
      />

      <CustomerGroupForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={triggerRefresh}
        editId={editId}
      />
    </div>
  )
}
