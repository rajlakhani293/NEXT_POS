"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { ProcurementProductForm } from "@/app/(dashboard)/purchases/products/createUpdate"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string
) => [
  { key: "name", title: t("Name") },
  { key: "unit_name", title: t("Unit") },
  { key: "procurement_name", title: t("Procurement") },
  { key: "quantity", title: t("Quantity") },
  { key: "total_purchase_price", title: t("Total Price"), render: (value: any) => formatMoney(value) },
  { key: "barcode", title: t("Barcode") },
  { key: "expiration_date", title: t("Expiration Date"), render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
  { key: "user_username", title: t("Author") },
  { key: "created_at", title: t("On"), render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function ProcurementProductsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const canUpdate = hasPermission(PERMISSIONS.purchases.update)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<any | null>(null)
  const posOptions = usePosOptions()
  const formatMoney = (value: any) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const table = useTableData({
    getMaster: (purchases as any).useGetProcurementProductsDataMutation,
    itemsPerPage: 10,
  })

  const handleEdit = (record: any) => {
    setEditRecord(record)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setEditRecord(null)
    setIsFormOpen(false)
  }

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={table.orders}
        columns={buildColumns(t, formatMoney)}
        tableTitle={t("Procurement Products List")}
        showSearch
        showDateRange
        searchTerm={table.searchTerm}
        currentPage={table.currentPage}
        itemsPerPage={table.itemsPerPage}
        totalItems={table.totalItems}
        onPageChange={table.setCurrentPage}
        onFilterChange={table.handleFilterChange}
        sortConfig={table.sortConfig}
        onSort={table.handleSort}
        sortableFields={table.sortableFields}
        isLoading={table.isLoading}
        showEdit={canUpdate}
        onEdit={handleEdit}
        hideActions={!canUpdate}
        onRowClick={(row) => router.push(`/purchases/orders/${row.purchase_order_id}`)}
      />

      <ProcurementProductForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={table.triggerRefresh}
        record={editRecord}
      />
    </div>
  )
}
