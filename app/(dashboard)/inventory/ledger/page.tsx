"use client"

import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { inventory } from "@/lib/api/inventory"
import { useTableData } from "@/hooks/useTableData"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"

const columns = [
  { key: "product_name", title: "Product" },
  { key: "procurement_name", title: "Procurement" },
  { key: "order_code", title: "Order" },
  { key: "operation_type", title: "Operation Type", render: (value: string) => String(value || "-").replaceAll("-", " ") },
  { key: "unit_name", title: "Unit" },
  { key: "before_quantity", title: "Initial Quantity" },
  { key: "quantity", title: "Quantity" },
  { key: "after_quantity", title: "New Quantity" },
  { key: "total_price", title: "Total Price" },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) =>
      value ? new Date(value).toLocaleDateString() : "-",
  },
]

export default function StockLedgerPage() {
  const { t } = useTranslation()
  const posOptions = usePosOptions()
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
  const formatMoney = (value: any) => `${posOptions.currency_symbol}${Number(value || 0).toFixed(2)}`
  const translatedColumns = columns.map((column) => ({
    ...column,
    title: t(column.title),
    render:
      column.key === "operation_type"
        ? (value: string) => t(String(value || "-").replaceAll("-", " "))
        : column.key === "total_price"
          ? formatMoney
          : column.render,
  }))

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={translatedColumns}
        tableTitle={productName ? `${t("Stock Ledger")} - ${productName}` : t("Stock Ledger")}
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
