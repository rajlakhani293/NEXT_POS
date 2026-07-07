"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Calculator } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { CategoryForm } from "@/app/(dashboard)/inventory/categories/createUpdate"
import { catalog } from "@/lib/api/catalog"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

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
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [deleteCategory] = (catalog as any).useDeleteCategoryMutation()
  const [updateCategoryStatus] = (
    catalog as any
  ).useUpdateCategoryStatusMutation()
  const [computeCategoryProducts] = (
    catalog as any
  ).useComputeCategoryProductsMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.categories.create)
  const canUpdate = hasPermission(PERMISSIONS.categories.update)
  const canDelete = hasPermission(PERMISSIONS.categories.delete)

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

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setEditId(null)
      setIsFormOpen(true)
    }
  }, [canCreate, searchParams])

  const translatedColumns = columns.map((column) => ({
    ...column,
    title: t(column.title),
    render:
      column.key === "parent_name"
        ? (value: any) => value || t("No Parent")
        : column.key === "displays_on_pos"
          ? (value: any) => (value ? t("Yes") : t("No"))
          : column.render,
  }))

  return (
    <PermissionGuard permission={PERMISSIONS.categories.view}>
      <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={translatedColumns}
        tableTitle={t("Categories")}
        title={canCreate ? t("Create Category") : undefined}
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
        deleteModalTitle={t("Delete Category")}
        deleteModalDescription={t("Would you like to delete this ?")}
        rowActions={(_, record) =>
          canUpdate
            ? [
                {
                  key: "compute",
                  label: t("Compute Products"),
                  labelText: t("Compute Products"),
                  icon: <Calculator className="size-4" />,
                  onClick: async () => {
                    const response = await computeCategoryProducts({
                      id: record.id,
                    }).unwrap()
                    showToast.success(
                      response?.message ||
                        t("The category products has been refreshed")
                    )
                    triggerRefresh()
                  },
                },
              ]
            : []
        }
      />

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={triggerRefresh}
        editId={editId}
      />
      </div>
    </PermissionGuard>
  )
}
