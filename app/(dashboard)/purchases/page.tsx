"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BanknoteIcon, PackageCheckIcon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { purchases } from "@/lib/api/purchases"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { SelectItem } from "@/components/ui/select"
import { UniFieldSelect } from "@/components/ui/unifield-select"

const workflowLabels: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partial: "Partial",
  received: "Received",
}

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

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
  const [getSuppliersDropdown, suppliersState] = (
    purchases as any
  ).useGetSuppliersDropdownMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.purchases.create)
  const canUpdate = hasPermission(PERMISSIONS.purchases.update)
  const canDelete = hasPermission(PERMISSIONS.purchases.update)
  const canReceive = hasPermission(PERMISSIONS.purchases.receive)
  const canPay = hasPermission(PERMISSIONS.purchases.pay)
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [workflowFilter, setWorkflowFilter] = useState("all")

  useEffect(() => {
    getSuppliersDropdown()
  }, [getSuppliersDropdown])

  const selectedFilters = {
    ...(supplierFilter !== "all" ? { supplier_id: Number(supplierFilter) } : {}),
    ...(workflowFilter !== "all"
      ? { workflow_status: workflowFilter }
      : {}),
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
    triggerRefresh,
  } = useTableData({
    getMaster: (purchases as any).useGetPurchaseOrdersDataMutation,
    itemsPerPage: 10,
    selectedFilters,
  })

  const supplierOptions = suppliersState.data?.data || []

  const summaryCards = useMemo(() => {
    const totalAmount = orders.reduce(
      (sum: number, order: any) => sum + Number(order.total || 0),
      0
    )
    const totalPaid = orders.reduce(
      (sum: number, order: any) => sum + Number(order.paid_amount || 0),
      0
    )
    const partialCount = orders.filter(
      (order: any) => order.workflow_status === "partial"
    ).length
    const receivedCount = orders.filter(
      (order: any) => order.workflow_status === "received"
    ).length

    return [
      {
        title: "Visible Purchase Value",
        value: formatMoney(totalAmount),
        helper: `${orders.length} rows on this page`,
      },
      {
        title: "Visible Paid",
        value: formatMoney(totalPaid),
        helper: "Supplier payments on visible rows",
      },
      {
        title: "Partially Received",
        value: String(partialCount),
        helper: "Orders still waiting for stock-in",
      },
      {
        title: "Received Orders",
        value: String(receivedCount),
        helper: `${totalItems} total matched records`,
      },
    ]
  }, [orders, totalItems])

  return (
    <div className="h-full space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">{card.title}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <UniFieldSelect
          label="Supplier"
          value={supplierFilter}
          onValueChange={setSupplierFilter}
          placeholder="All suppliers"
          allowClear
        >
          <SelectItem value="all">All suppliers</SelectItem>
          {supplierOptions.map((supplier: any) => (
            <SelectItem key={supplier.id} value={String(supplier.id)}>
              {supplier.name}
            </SelectItem>
          ))}
        </UniFieldSelect>
        <UniFieldSelect
          label="Workflow Status"
          value={workflowFilter}
          onValueChange={setWorkflowFilter}
          placeholder="All statuses"
          allowClear
        >
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="ordered">Ordered</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="received">Received</SelectItem>
        </UniFieldSelect>
      </div>

      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Purchase Orders"
        title={canCreate ? "Add Purchase" : undefined}
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
