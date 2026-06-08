"use client"

import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { cn } from "@/lib/utils"

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-amber-50 text-amber-700",
  unpaid: "bg-rose-50 text-rose-700",
  refunded: "bg-sky-50 text-sky-700",
  partially_refunded: "bg-indigo-50 text-indigo-700",
  hold: "bg-gray-100 text-gray-700",
  void: "bg-zinc-200 text-zinc-700",
}

const columns = [
  { key: "code", title: "Sale No" },
  { key: "customer__name", title: "Customer" },
  { key: "cashier__full_name", title: "Cashier" },
  { key: "order_type", title: "Order Type" },
  {
    key: "payment_status",
    title: "Payment Status",
    render: (value: string) => (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold",
          paymentStatusColors[value] || "bg-gray-100 text-gray-700"
        )}
      >
        {String(value || "-").replaceAll("_", " ")}
      </span>
    ),
  },
  { key: "total_items", title: "Items" },
  { key: "total", title: "Total" },
  { key: "due_amount", title: "Due" },
  { key: "created_at", title: "Created" },
]

export default function SalesHistoryPage() {
  const router = useRouter()
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
    getMaster: (sales as any).useGetSalesDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Sales History"
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
        showEdit
        onEdit={(record: any) => router.push(`/sales/${record.id}`)}
      />
    </div>
  )
}
