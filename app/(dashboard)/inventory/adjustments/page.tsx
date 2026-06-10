"use client"

import { useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import { StockAdjustmentForm } from "@/app/(dashboard)/inventory/adjustments/createUpdate"
import { inventory } from "@/lib/api/inventory"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "code", title: "Code" },
  {
    key: "adjustment_type_label",
    title: "Action",
    render: (_: any, context: any) =>
      context.row.adjustment_type_label ||
      String(context.row.adjustment_type || "-").replaceAll("_", " "),
  },
  { key: "reason", title: "Reason" },
  { key: "note", title: "Note" },
  { key: "created_at", title: "Created At" },
]

export default function StockAdjustmentsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteStockAdjustment] = (
    inventory as any
  ).useDeleteStockAdjustmentMutation()
  const [updateStockAdjustmentStatus] = (
    inventory as any
  ).useUpdateStockAdjustmentStatusMutation()
  const { hasPermission } = usePermissions()
  const canAdjust = hasPermission(PERMISSIONS.inventory.adjust)

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
    getMaster: (inventory as any).useGetStockAdjustmentsDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Stock Adjustments"
        title={canAdjust ? "Add Adjustment" : undefined}
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
        setAddEntityOpen={canAdjust ? setIsFormOpen : undefined}
        showDelete={canAdjust}
        deleteMutation={deleteStockAdjustment}
        showStatus={canAdjust}
        statusChangeMutation={({ ids, status }: any) =>
          updateStockAdjustmentStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Stock Adjustment"
        deleteModalDescription="Are you sure you want to delete this stock adjustment?"
      />

      <StockAdjustmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={triggerRefresh}
      />
    </div>
  )
}
