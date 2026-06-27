"use client"

import { useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import { CategoryForm } from "@/app/(dashboard)/inventory/categories/createUpdate"
import { catalog } from "@/lib/api/catalog"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "name", title: "Name" },
  {
    key: "parent_name",
    title: "Parent",
    render: (value: any) => value || "No Parent",
  },
  { key: "total_items", title: "Total Products", render: (val: any) => val ?? 0 },
  {
    key: "displays_on_pos",
    title: "Displays On POS",
    render: (value: any) => (value ? "Yes" : "No"),
  },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function CategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [deleteCategory] = (catalog as any).useDeleteCategoryMutation()
  const [updateCategoryStatus] = (
    catalog as any
  ).useUpdateCategoryStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.products.create)
  const canUpdate = hasPermission(PERMISSIONS.products.update)
  const canDelete = hasPermission(PERMISSIONS.products.delete)

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
    getMaster: (catalog as any).useGetCategoriesDataMutation,
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

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Categories"
        title={canCreate ? "Add Category" : undefined}
        showSearch
        searchTerm={searchTerm}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onFilterChange={handleFilterChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        showDateRange
        sortableFields={sortableFields}
        isLoading={isLoading}
        setAddEntityOpen={canCreate ? handleAdd : undefined}
        showEdit={canUpdate}
        onEdit={handleEdit}
        showDelete={canDelete}
        deleteMutation={deleteCategory}
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateCategoryStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Category"
        deleteModalDescription="Are you sure you want to delete this category?"
      />

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={triggerRefresh}
        editId={editId}
      />
    </div>
  )
}
