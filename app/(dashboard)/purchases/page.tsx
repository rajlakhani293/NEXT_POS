"use client"

import { useRouter } from "next/navigation"
import { CheckCircle2Icon, EditIcon, FileTextIcon, RefreshCwIcon } from "lucide-react"

import { useConfirmDialog } from "@/components/confirm-dialog"
import DynamicTable from "@/components/DynamicTable"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { MdDelete } from "react-icons/md"

const workflowLabels: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  delivered: "Delivered",
  stocked: "Stocked",
}

const paymentLabels: Record<string, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  partial: "Partially Paid",
  paid: "Paid",
}

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDate: (value: any) => string
) => [
    { key: "code", title: t("Name") },
    { key: "supplier_name", title: t("Provider") },
    {
      key: "workflow_status",
      title: t("Delivery Status"),
      render: (value: string) => (
        <span
          className={cn(
            "rounded-full px-2 py-1 text-xs font-semibold",
            value === "stocked" && "bg-green-50 text-green-700",
            value === "delivered" && "bg-amber-50 text-amber-700",
            value === "pending" && "bg-blue-50 text-blue-700",
            value === "draft" && "bg-gray-100 text-gray-700"
          )}
        >
          {t(workflowLabels[value] || value)}
        </span>
      ),
    },
    {
      key: "payment_status",
      title: t("Payment Status"),
      render: (value: string) => (
        <span
          className={cn(
            "rounded-full px-2 py-1 text-xs font-semibold",
            value === "paid" && "bg-green-50 text-green-700",
            value === "partially_paid" && "bg-amber-50 text-amber-700",
            value === "unpaid" && "bg-red-50 text-red-700"
          )}
        >
          {t(paymentLabels[value] || value)}
        </span>
      ),
    },
    {
      key: "invoice_date",
      title: t("Invoice Date"),
      render: formatDate,
    },
    {
      key: "total",
      title: t("Sale Value"),
      render: (value: any) => formatMoney(value),
    },
    {
      key: "cost",
      title: t("Purchase Value"),
      render: (value: any) => formatMoney(value),
    },
    {
      key: "tax_value",
      title: t("Taxes"),
      render: (value: any) => formatMoney(value),
    },
    { key: "user_username", title: t("User") },
  ]

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { confirm, confirmDialog } = useConfirmDialog()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)
  const columns = buildColumns(t, formatMoney, formatDate)
  const [deletePurchaseOrder] = (
    purchases as any
  ).useDeletePurchaseOrderMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.purchases.create)
  const canUpdate = hasPermission(PERMISSIONS.purchases.update)
  const canDelete = hasPermission(PERMISSIONS.purchases.delete)
  const canMarkPaid = hasPermission(PERMISSIONS.purchases.update)
  const canRefresh = hasPermission(PERMISSIONS.purchases.view)
  const [refreshPurchaseOrder] = (purchases as any).useRefreshPurchaseOrderMutation()
  const [setPurchaseOrderAsPaid] = (purchases as any).useSetPurchaseOrderAsPaidMutation()
  const isStocked = (record: any) =>
    record?.delivery_status === "stocked" || record?.workflow_status === "stocked"

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
    getMaster: (purchases as any).useGetPurchaseOrdersDataMutation,

  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle={t("Procurements List")}
        title={canCreate ? t("Add a new procurement") : undefined}
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
          canCreate ? () => router.push("/purchases/orders/create") : undefined
        }
        showEdit={false}
        showDelete={false}
        deleteMutation={deletePurchaseOrder}
        triggerRefresh={triggerRefresh}
        deleteModalTitle={t("Delete Procurement")}
        deleteModalDescription={t("Would you like to delete this ?")}
        rowActions={(_, record) => [
          ...(canUpdate && !isStocked(record)
            ? [
              {
                key: "edit",
                label: t("Edit"),
                labelText: t("Edit"),
                icon: <EditIcon className="size-4" />,
                priority: 1,
                onClick: () => router.push(`/purchases/orders/${record.id}`),
              },
            ]
            : []),
          {
            key: "invoice",
            label: t("Invoice"),
            labelText: t("Invoice"),
            icon: <FileTextIcon className="size-4" />,
            priority: 2,
            onClick: () => router.push(`/purchases/orders/${record.id}/invoice`),
          },
          ...(canMarkPaid && record.payment_status !== "paid"
            ? [
              {
                key: "set_paid",
                label: t("Set Paid"),
                labelText: t("Set Paid"),
                icon: <CheckCircle2Icon className="size-4" />,
                priority: 3,
                onClick: async () => {
                  const ok = await confirm({
                    description: t("Would you like to mark this procurement as paid?"),
                  })
                  if (!ok) return
                  const response = await setPurchaseOrderAsPaid({ id: record.id }).unwrap()
                  showToast.success(response?.message || t("The procurement has been marked as paid."))
                  triggerRefresh()
                },
              },
            ]
            : []),
          ...(canRefresh
            ? [
              {
                key: "refresh",
                label: t("Refresh"),
                labelText: t("Refresh"),
                icon: <RefreshCwIcon className="size-4" />,
                priority: 4,
                onClick: async () => {
                  const ok = await confirm({
                    description: t("Would you like to refresh this ?"),
                  })
                  if (!ok) return
                  const response = await refreshPurchaseOrder({ id: record.id }).unwrap()
                  showToast.success(response?.message || t("The refresh process has started. You'll get informed once it's complete."))
                  triggerRefresh()
                },
              },
            ]
            : []),
          ...(canDelete
            ? [
              {
                key: "delete",
                label: t("Delete"),
                labelText: t("Delete"),
                icon: <MdDelete className="size-4 text-red-500" />,
                priority: 5,
                onClick: async () => {
                  const ok = await confirm({
                    description: t("Would you like to delete this ?"),
                    variant: "destructive",
                  })
                  if (!ok) return
                  const response = await deletePurchaseOrder({ ids: [record.id] }).unwrap()
                  showToast.success(response?.message || t("The procurement has been deleted."))
                  triggerRefresh()
                },
              },
            ]
            : []),
        ]}
      />
      {confirmDialog}
    </div>
  )
}
