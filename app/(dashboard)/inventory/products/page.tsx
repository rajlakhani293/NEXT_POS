"use client"

import { useRouter } from "next/navigation"
import { ClipboardListIcon, SlidersHorizontalIcon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { StockAdjustmentForm } from "@/app/(dashboard)/inventory/adjustments/createUpdate"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { catalog } from "@/lib/api/catalog"
import { PERMISSIONS } from "@/lib/permissions"
import { useState } from "react"

const money = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const columns = [
  { key: "name", title: "Name" },
  { key: "type", title: "Type", render: (val: any) => val || "standard" },
  { key: "sku", title: "SKU" },
  { key: "category_name", title: "Category", render: (val: any) => val || "Unassigned" },
  { key: "status", title: "Status", render: (val: any) => val === "available" ? "Available" : "Hidden" },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Date",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function ProductsPage() {
  const router = useRouter()
  const [adjustmentProduct, setAdjustmentProduct] = useState<any>(null)
  const [deleteProduct] = (catalog as any).useDeleteProductMutation()
  const [updateProductStatus] = (catalog as any).useUpdateProductStatusMutation()
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
    getMaster: (catalog as any).useGetProductsDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Products"
        title={canCreate ? "Add Product" : undefined}
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
        showDateRange
        setAddEntityOpen={
          canCreate ? () => router.push("/inventory/products/create") : undefined
        }
        showEdit={canUpdate}
        onEdit={(record: any) => router.push(`/inventory/products/${record.id}`)}
        rowActions={(_, record) => [
          {
            key: "stock_adjustment",
            label: "Stock Adjustment",
            labelText: "Stock Adjustment",
            icon: <SlidersHorizontalIcon className="size-4" />,
            onClick: () => setAdjustmentProduct(record),
          },
          {
            key: "stock_ledger",
            label: "Stock Ledger",
            labelText: "Stock Ledger",
            icon: <ClipboardListIcon className="size-4" />,
            onClick: () =>
              router.push(
                `/inventory/ledger?product_id=${record.id}&product_name=${encodeURIComponent(record.name || "Product")}`
              ),
          },
        ]}
        showDelete={canDelete}
        deleteMutation={deleteProduct}
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateProductStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Product"
        deleteModalDescription="Are you sure you want to delete this product?"
      />

      <StockAdjustmentForm
        isOpen={Boolean(adjustmentProduct)}
        onClose={() => setAdjustmentProduct(null)}
        onSuccess={triggerRefresh}
        product={adjustmentProduct}
      />
    </div>
  )
}
