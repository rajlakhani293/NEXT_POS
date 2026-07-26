"use client"

import { useRouter } from "next/navigation"
import { FileText, ReceiptText, Settings } from "lucide-react"

import { useConfirmDialog } from "@/components/confirm-dialog"
import DynamicTable from "@/components/DynamicTable"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { MdDelete } from "react-icons/md"

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
  hold: "Hold",
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
  takeaway: "Take Away",
  delivery: "Delivery",
}

const getStatusLabel = (value: any, t: (key: string) => string) => {
  const key = String(value || "").trim()
  return key ? t(statusLabelKeys[key] || key.replaceAll("_", " ")) : "-"
}

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDate: (value: any) => string
) => [
    { key: "code", title: t("Code") },
    {
      key: "order_type",
      title: t("Type"),
      render: (value: string) => getStatusLabel(value, t),
    },
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
    { key: "author_username", title: t("Cashier") },
    {
      key: "created_at",
      title: t("Created At"),
      render: formatDate,
    },
  ]

export default function SalesHistoryPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const { confirm, confirmDialog } = useConfirmDialog()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)
  const columns = buildColumns(t, formatMoney, formatDate)
  const { hasPermission } = usePermissions()
  const canCreateSale = hasPermission(PERMISSIONS.sales.create)
  const canUpdateSale = hasPermission(PERMISSIONS.sales.update)
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
    dateFilters,
    selectedDateRange,
  } = useTableData({
    getMaster: (sales as any).useGetSalesDataMutation
  })

  const handleDeleteOrder = async (record: any) => {
    const ok = await confirm({
      title: t("Confirm Your Action"),
      description: t("Would you like to delete this ?"),
      confirmLabel: t("Delete"),
      cancelLabel: t("Cancel"),
    })
    if (!ok) return
    const result = await deleteSales({ ids: [record.id] })
    if ("data" in result && result.data?.success) {
      showToast.success(result.data.message || t("The order has been deleted."))
      triggerRefresh?.()
    }
  }

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle={t("Orders List")}
        title={canCreateSale ? t("Add a new order") : undefined}
        showSearch
        showDateRange
        selectedDateRange={selectedDateRange}
        dateFilters={dateFilters}
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
        showEdit={false}
        showDelete={false}
        deleteMutation={deleteSales}
        // dateFilters={dateFilters}
        triggerRefresh={triggerRefresh}
        rowActions={(_, record) => [
          {
            key: "options",
            label: t("Options"),
            labelText: t("Options"),
            icon: <Settings className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}`),
          },
          ...(Number(record.latest_refund_id || 0) > 0
            ? [
              {
                key: "refund_receipt",
                label: t("Refund Receipt"),
                labelText: t("Refund Receipt"),
                icon: <ReceiptText className="size-4" />,
                onClick: () => router.push(`/sales/${record.id}/receipt?doc=refund&refund_id=${record.latest_refund_id}`),
              },
            ]
            : []),
          {
            key: "invoice",
            label: t("Invoice"),
            labelText: t("Invoice"),
            icon: <FileText className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}/receipt?doc=invoice`),
          },
          {
            key: "receipt",
            label: t("Receipt"),
            labelText: t("Receipt"),
            icon: <ReceiptText className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}/receipt`),
          },
          ...(canDeleteSale
            ? [
              {
                key: "delete",
                label: t("Delete"),
                labelText: t("Delete"),
                icon: <MdDelete className="size-4 text-red-500" />,
                onClick: () => handleDeleteOrder(record),
                priority: 20,
              },
            ]
            : []),
        ]}
      />
      {confirmDialog}
    </div>
  )
}
