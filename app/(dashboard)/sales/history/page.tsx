"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, ReceiptText, Wallet } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { usePermissions } from "@/hooks/use-permissions"
import { customers } from "@/lib/api/customers"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { PERMISSIONS } from "@/lib/permissions"
import { SelectItem } from "@/components/ui/select"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { settings } from "@/lib/api/settings"
import { showToast } from "@/lib/toast"
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

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

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
  const { hasPermission } = usePermissions()
  const canVoidSale = hasPermission(PERMISSIONS.sales.void)
  const canCollectDue = hasPermission(PERMISSIONS.payments.collectDue)
  const [voidSale] = (sales as any).useVoidSaleMutation()
  const [customerFilter, setCustomerFilter] = useState("all")
  const [cashierFilter, setCashierFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orderTypeFilter, setOrderTypeFilter] = useState("all")
  const [getCustomersDropdown, customersState] = (
    customers as any
  ).useGetCustomersDropdownMutation()
  const [getUsersDropdown, usersState] = (
    settings as any
  ).useGetUsersDropdownMutation()

  useEffect(() => {
    getCustomersDropdown()
    getUsersDropdown()
  }, [getCustomersDropdown, getUsersDropdown])

  const selectedFilters = {
    ...(customerFilter !== "all" ? { customer_id: Number(customerFilter) } : {}),
    ...(cashierFilter !== "all" ? { cashier_id: Number(cashierFilter) } : {}),
    ...(statusFilter !== "all" ? { payment_status: statusFilter } : {}),
    ...(orderTypeFilter !== "all" ? { order_type: orderTypeFilter } : {}),
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
    getMaster: (sales as any).useGetSalesDataMutation,
    itemsPerPage: 10,
    selectedFilters,
  })

  const customerOptions = customersState.data?.data || []
  const userOptions = usersState.data?.data || []

  const summaryCards = useMemo(() => {
    const totalSales = orders.reduce(
      (sum: number, sale: any) => sum + Number(sale.total || 0),
      0
    )
    const totalDue = orders.reduce(
      (sum: number, sale: any) => sum + Number(sale.due_amount || 0),
      0
    )
    const paidCount = orders.filter(
      (sale: any) => sale.payment_status === "paid"
    ).length
    const dueCount = orders.filter((sale: any) =>
      ["unpaid", "partially_paid"].includes(sale.payment_status)
    ).length

    return [
      {
        title: "Visible Sales",
        value: formatMoney(totalSales),
        helper: `${orders.length} rows on this page`,
      },
      {
        title: "Visible Due",
        value: formatMoney(totalDue),
        helper: `${dueCount} orders need collection`,
      },
      {
        title: "Paid Orders",
        value: String(paidCount),
        helper: "Fully settled orders",
      },
      {
        title: "Total Records",
        value: String(totalItems),
        helper: "Matched by current filters",
      },
    ]
  }, [orders, totalItems])

  const handleVoidSale = async (saleId: number | string) => {
    const response = await voidSale({
      id: saleId,
      payLoad: { note: "Voided from sales history." },
    }).unwrap()
    showToast.success(response?.message || "Sale voided successfully.")
    triggerRefresh()
  }

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
          label="Customer"
          value={customerFilter}
          onValueChange={setCustomerFilter}
          placeholder="All customers"
          allowClear
        >
          <SelectItem value="all">All customers</SelectItem>
          {customerOptions.map((customer: any) => (
            <SelectItem key={customer.id} value={String(customer.id)}>
              {customer.name}
            </SelectItem>
          ))}
        </UniFieldSelect>
        <UniFieldSelect
          label="Cashier"
          value={cashierFilter}
          onValueChange={setCashierFilter}
          placeholder="All cashiers"
          allowClear
        >
          <SelectItem value="all">All cashiers</SelectItem>
          {userOptions.map((user: any) => (
            <SelectItem key={user.id} value={String(user.id)}>
              {user.full_name || user.name || user.phone || `User #${user.id}`}
            </SelectItem>
          ))}
        </UniFieldSelect>
        <UniFieldSelect
          label="Payment Status"
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="All statuses"
          allowClear
        >
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partially_paid">Partially Paid</SelectItem>
          <SelectItem value="unpaid">Unpaid</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
          <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
          <SelectItem value="void">Void</SelectItem>
        </UniFieldSelect>
        <UniFieldSelect
          label="Order Type"
          value={orderTypeFilter}
          onValueChange={setOrderTypeFilter}
          placeholder="All order types"
          allowClear
        >
          <SelectItem value="all">All order types</SelectItem>
          <SelectItem value="takeaway">Take Order</SelectItem>
          <SelectItem value="delivery">Delivery</SelectItem>
        </UniFieldSelect>
      </div>

      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Sales History"
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
        showEdit
        onEdit={(record: any) => router.push(`/sales/${record.id}`)}
        rowActions={(_, record) => [
          {
            key: "receipt",
            label: "Receipt",
            labelText: "Receipt",
            icon: <ReceiptText className="size-4" />,
            onClick: () => router.push(`/sales/${record.id}/receipt`),
          },
          ...(canCollectDue &&
          Number(record.due_amount || 0) > 0 &&
          !["void", "refunded"].includes(record.payment_status)
            ? [
                {
                  key: "collect_due",
                  label: "Collect Due",
                  labelText: "Collect Due",
                  icon: <Wallet className="size-4" />,
                  onClick: () => router.push(`/sales/${record.id}`),
                },
              ]
            : []),
          ...(canVoidSale && !["void", "refunded", "partially_refunded"].includes(record.payment_status)
            ? [
                {
                  key: "void",
                  label: "Void Sale",
                  labelText: "Void Sale",
                  icon: <Ban className="size-4" />,
                  onClick: () => handleVoidSale(record.id),
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
