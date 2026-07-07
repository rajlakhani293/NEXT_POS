"use client"

import { useRouter } from "next/navigation"
import { Settings } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
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

const statusLabelKeys: Record<string, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  void: "Voided",
  order_void: "Voided",
  due: "Due",
  partially_due: "Due With Payment",
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  delivery: "Delivery",
}

const getStatusLabel = (value: any, t: (key: string) => string) => {
  const key = String(value || "").trim()
  return key ? t(statusLabelKeys[key] || key.replaceAll("_", " ")) : "-"
}

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string
) => [
  { key: "code", title: t("Code") },
  {
    key: "customer__full_name",
    title: t("Customer"),
    render: (value: any) => value || t("Walk-in Customer"),
  },
  {
    key: "delivery_status",
    title: t("Delivery"),
    render: (value: string) => (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold uppercase",
          deliveryStatusColors[value] || "bg-gray-100 text-gray-700"
        )}
      >
        {getStatusLabel(value || "pending", t)}
      </span>
    ),
  },
  {
    key: "payment_status",
    title: t("Payment"),
    render: (value: string) => (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold uppercase",
          paymentStatusColors[value] || "bg-gray-100 text-gray-700"
        )}
      >
        {getStatusLabel(value, t)}
      </span>
    ),
  },
  { key: "tax_amount", title: t("Tax"), render: formatMoney },
  { key: "total", title: t("Total"), render: formatMoney },
  { key: "author_username", title: t("Author") },
  {
    key: "created_at",
    title: t("Created At"),
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function AssignedOrdersPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => {
    const amount = Number(value || 0).toFixed(posOptions.currency_precision)
    const indicator =
      posOptions.currency_preferred === "iso"
        ? posOptions.currency_iso
        : posOptions.currency_symbol
    return posOptions.currency_position === "after"
      ? `${amount}${indicator}`
      : `${indicator}${amount}`
  }

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
    getMaster: (sales as any).useGetAssignedOrdersDataMutation,
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={buildColumns(t, formatMoney)}
        tableTitle={t("Assigned Orders")}
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
        showEdit={false}
        showDelete={false}
        rowActions={(_, record) => [
          {
            key: "options",
            label: t("Options"),
            labelText: t("Options"),
            icon: <Settings className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}`),
          },
        ]}
      />
    </div>
  )
}
