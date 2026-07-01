"use client"

import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { useTableData } from "@/hooks/useTableData"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const buildColumns = (t: (key: string) => string) => [
  { key: "purchase_order__code", title: t("Procurement") },
  { key: "product__name", title: t("Product") },
  { key: "ordered_quantity", title: t("Quantity") },
  { key: "received_quantity", title: t("Received") },
  { key: "cost_price", title: t("Purchase Price") },
  { key: "tax_amount", title: t("Tax") },
  { key: "total", title: t("Total") },
  { key: "created_at", title: t("Created At") },
]

export default function ProcurementProductsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const table = useTableData({
    getMaster: (purchases as any).useGetProcurementProductsDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={table.orders}
        columns={buildColumns(t)}
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
        hideActions
        onRowClick={(row) => router.push(`/purchases/orders/${row.purchase_order_id}`)}
      />
    </div>
  )
}
