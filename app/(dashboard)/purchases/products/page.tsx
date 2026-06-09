"use client"

import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { useTableData } from "@/hooks/useTableData"
import { purchases } from "@/lib/api/purchases"

const columns = [
  { key: "purchase_order__code", title: "Purchase No" },
  { key: "product__name", title: "Product" },
  { key: "ordered_quantity", title: "Ordered Qty" },
  { key: "received_quantity", title: "Received Qty" },
  { key: "cost_price", title: "Cost Price" },
  { key: "tax_amount", title: "Tax" },
  { key: "total", title: "Total" },
  { key: "created_at", title: "Created" },
]

export default function ProcurementProductsPage() {
  const router = useRouter()
  const table = useTableData({
    getMaster: (purchases as any).useGetProcurementProductsDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={table.orders}
        columns={columns}
        tableTitle="Procurement Products"
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
