"use client"

import DynamicTable from "@/components/DynamicTable"
import { inventory } from "@/lib/api/inventory"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "product_name", title: "Product" },
  { key: "entry_type", title: "Entry Type" },
  { key: "quantity", title: "Quantity" },
  { key: "unit_cost", title: "Unit Cost" },
  { key: "balance_after", title: "Balance After" },
  { key: "reference_type", title: "Reference" },
  { key: "reference_id", title: "Ref ID" },
  { key: "created_at", title: "Created At" },
]

export default function StockLedgerPage() {
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
  } = useTableData({
    getMaster: (inventory as any).useGetStockLedgerDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Stock Ledger"
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
      />
    </div>
  )
}
