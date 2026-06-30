"use client"

import { useRouter } from "next/navigation"
import { FileText, ReceiptText, Settings } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-amber-50 text-amber-700",
  unpaid: "bg-rose-50 text-rose-700",
  refunded: "bg-sky-50 text-sky-700",
  partially_refunded: "bg-indigo-50 text-indigo-700",
  hold: "bg-gray-100 text-gray-700",
  void: "bg-zinc-200 text-zinc-700",
  order_void: "bg-zinc-200 text-zinc-700",
}

const deliveryStatusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  shipped: "bg-sky-50 text-sky-700",
  delivered: "bg-green-50 text-green-700",
}

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const columns = [
  { key: "code", title: "Code" },
  { key: "order_type", title: "Type", render: (value: string) => String(value || "-").replaceAll("_", " ") },
  { key: "customer__full_name", title: "Customer", render: (value: any) => value || "Walk-in Customer" },
  {
    key: "delivery_status",
    title: "Delivery",
    render: (value: string) => (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold uppercase",
          deliveryStatusColors[value] || "bg-gray-100 text-gray-700"
        )}
      >
        {value || "pending"}
      </span>
    ),
  },
  {
    key: "payment_status",
    title: "Payment",
    render: (value: string) => (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold uppercase",
          paymentStatusColors[value] || "bg-gray-100 text-gray-700"
        )}
      >
        {String(value || "-").replaceAll("_", " ")}
      </span>
    ),
  },
  { key: "tax_amount", title: "Tax", render: formatMoney },
  { key: "total", title: "Total", render: formatMoney },
  { key: "author_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function SalesHistoryPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canCreateSale = hasPermission(PERMISSIONS.sales.create)
  const canDeleteSale = hasPermission(PERMISSIONS.sales.delete)
  const [deleteSales] = (sales as any).useDeleteSalesMutation()

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
    getMaster: (sales as any).useGetSalesDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Orders List"
        title={canCreateSale ? "Add a new order" : undefined}
        showSearch
        showDateRange
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
        setAddEntityOpen={
          canCreateSale ? () => router.push("/sales/create") : undefined
        }
        showEdit
        showDelete={canDeleteSale}
        deleteMutation={deleteSales}
        triggerRefresh={triggerRefresh}
        canDeleteRow={(record: any) =>
          !["refunded", "partially_refunded"].includes(record?.payment_status)
        }
        onEdit={(record: any) => router.push(`/sales/${record.id}`)}
        rowActions={(_, record) => [
          {
            key: "options",
            label: "Options",
            labelText: "Options",
            icon: <Settings className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}`),
          },
          ...(Number(record.latest_refund_id || 0) > 0
            ? [
                {
                  key: "refund_receipt",
                  label: "Refund Receipt",
                  labelText: "Refund Receipt",
                  icon: <ReceiptText className="size-4" />,
                  onClick: () => router.push(`/sales/${record.id}/receipt?doc=refund&refund_id=${record.latest_refund_id}`),
                },
              ]
            : []),
          {
            key: "invoice",
            label: "Invoice",
            labelText: "Invoice",
            icon: <FileText className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}/receipt?doc=invoice`),
          },
          {
            key: "receipt",
            label: "Receipt",
            labelText: "Receipt",
            icon: <ReceiptText className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}/receipt`),
          },
        ]}
      />
    </div>
  )
}
