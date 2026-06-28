"use client"

import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { inventory } from "@/lib/api/inventory"
import { useTableData } from "@/hooks/useTableData"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const columns = [
  { key: "product_name", title: "Product" },
  {
    key: "entry_type",
    title: "Entry Type",
    render: (value: string) => String(value || "-").replaceAll("_", " "),
  },
  { key: "quantity", title: "Quantity" },
  { key: "unit_cost", title: "Unit Cost", render: formatMoney },
  { key: "balance_after", title: "Balance After" },
  {
    key: "reference_type",
    title: "Reference",
    render: (value: string, record: any) =>
      value === "sale_order"
        ? `Sale #${record.reference_id}`
        : value === "purchase_order"
          ? `Procurement #${record.reference_id}`
          : `History #${record.reference_id}`,
  },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) =>
      value ? new Date(value).toLocaleDateString() : "-",
  },
]

export default function StockLedgerPage() {
  const searchParams = useSearchParams()
  const productId = searchParams.get("product_id")
  const productName = searchParams.get("product_name")
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
    selectedFilters: productId ? { product_id: Number(productId) } : {},
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle={productName ? `Stock Ledger - ${productName}` : "Stock Ledger"}
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
