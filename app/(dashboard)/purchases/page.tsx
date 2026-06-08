"use client"

import { useRouter } from "next/navigation"
import { BanknoteIcon, PackageCheckIcon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { purchases } from "@/lib/api/purchases"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const workflowLabels: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partial: "Partial",
  received: "Received",
}

const columns = [
  { key: "code", title: "Code" },
  { key: "supplier__name", title: "Supplier" },
  { key: "order_date", title: "Order Date" },
  { key: "expected_date", title: "Expected Date" },
  {
    key: "workflow_status",
    title: "Status",
    render: (value: string) => (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold",
          value === "received" && "bg-green-50 text-green-700",
          value === "partial" && "bg-amber-50 text-amber-700",
          value === "ordered" && "bg-blue-50 text-blue-700",
          value === "draft" && "bg-gray-100 text-gray-700"
        )}
      >
        {workflowLabels[value] || value}
      </span>
    ),
  },
  { key: "total", title: "Total" },
  { key: "paid_amount", title: "Paid" },
]

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [deletePurchaseOrder] = (
    purchases as any
  ).useDeletePurchaseOrderMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.purchases.create)
  const canUpdate = hasPermission(PERMISSIONS.purchases.update)
  const canDelete = hasPermission(PERMISSIONS.purchases.update)
  const canReceive = hasPermission(PERMISSIONS.purchases.receive)
  const canPay = hasPermission(PERMISSIONS.purchases.pay)

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
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Purchase Orders"
        title={canCreate ? "Add Purchase" : undefined}
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
        setAddEntityOpen={
          canCreate ? () => router.push("/purchases/orders/create") : undefined
        }
        showEdit={canUpdate}
        onEdit={(record: any) => router.push(`/purchases/orders/${record.id}`)}
        showDelete={canDelete}
        deleteMutation={deletePurchaseOrder}
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Purchase Order"
        deleteModalDescription="Are you sure you want to delete this purchase order?"
        rowActions={(_, record) => [
          ...(canReceive
            ? [
              {
                key: "receive",
                label: "Stock In",
                labelText: "Stock In",
                icon: <PackageCheckIcon className="size-4" />,
                onClick: () =>
                  router.push(`/purchases/orders/${record.id}?action=receive`),
              },
            ]
            : []),
          ...(canPay
            ? [
              {
                key: "pay",
                label: "Pay Supplier",
                labelText: "Pay Supplier",
                icon: <BanknoteIcon className="size-4" />,
                onClick: () =>
                  router.push(`/purchases/orders/${record.id}?action=pay`),
              },
            ]
            : []),
        ]}
      />
    </div>
  )
}
