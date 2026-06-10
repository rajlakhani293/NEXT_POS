"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { accounting } from "@/lib/api/accounting"
import { getDateRange } from "@/lib/utils"
import { reports } from "@/lib/api/reports"
import { showToast } from "@/lib/toast"

const reportTabs = [
  "sales",
  "sold_stock",
  "profit",
  "payment_types",
  "products",
  "low_stock",
  "stock",
  "cashier",
  "customer_due",
  "supplier_payable",
  "stock_ledger",
  "customer_credit",
  "accounting",
] as const

const tabLabels: Record<(typeof reportTabs)[number], string> = {
  sales: "Sale Report",
  sold_stock: "Sold Stock",
  profit: "Profit",
  payment_types: "Payment Types",
  products: "Products",
  low_stock: "Low Stock",
  stock: "Stock",
  cashier: "Cashier",
  customer_due: "Customer Due",
  supplier_payable: "Supplier Payable",
  stock_ledger: "Stock Ledger",
  customer_credit: "Customer Credit",
  accounting: "Accounting",
}

const columns: Record<string, any[]> = {
  sales: [
    { key: "code", title: "Order" },
    { key: "customer__name", title: "Customer" },
    { key: "cashier__full_name", title: "Cashier" },
    { key: "order_type", title: "Type" },
    { key: "payment_status", title: "Payment" },
    { key: "total", title: "Total" },
    { key: "tendered_amount", title: "Paid" },
    { key: "due_amount", title: "Due" },
    { key: "created_at", title: "Date" },
  ],
  sold_stock: [
    { key: "sale_order__code", title: "Order" },
    { key: "product__name", title: "Product" },
    { key: "quantity", title: "Qty" },
    { key: "unit_price", title: "Price" },
    { key: "discount_amount", title: "Discount" },
    { key: "tax_amount", title: "Tax" },
    { key: "total", title: "Total" },
    { key: "cost_price", title: "Cost" },
    { key: "created_at", title: "Date" },
  ],
  profit: [
    { key: "sale_order__code", title: "Order" },
    { key: "product__name", title: "Product" },
    { key: "quantity", title: "Qty" },
    { key: "total", title: "Sales" },
    { key: "cost_total", title: "Cost" },
    { key: "profit_amount", title: "Profit" },
    { key: "created_at", title: "Date" },
  ],
  payment_types: [
    { key: "sale_order__code", title: "Order" },
    { key: "payment_type", title: "Payment" },
    { key: "amount", title: "Amount" },
    { key: "paid_at", title: "Paid At" },
    { key: "reference_number", title: "Reference" },
    { key: "note", title: "Note" },
  ],
  products: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "product_type", title: "Type" },
    { key: "current_stock", title: "Stock" },
    { key: "sold_quantity", title: "Sold Qty" },
    { key: "sold_amount", title: "Sold Amount" },
    { key: "selling_price", title: "Selling" },
  ],
  low_stock: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "current_stock", title: "Stock" },
    { key: "min_stock", title: "Min" },
    { key: "max_stock", title: "Max" },
    { key: "purchase_price", title: "Purchase" },
    { key: "selling_price", title: "Selling" },
  ],
  stock: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "product_type", title: "Type" },
    { key: "track_stock", title: "Track" },
    { key: "opening_stock", title: "Opening" },
    { key: "current_stock", title: "Current" },
    { key: "min_stock", title: "Min" },
    { key: "max_stock", title: "Max" },
  ],
  cashier: [
    { key: "cashier__full_name", title: "Cashier" },
    { key: "order_count", title: "Orders" },
    { key: "total_sales", title: "Sales" },
    { key: "total_paid", title: "Paid" },
    { key: "total_due", title: "Due" },
  ],
  customer_due: [
    { key: "name", title: "Customer" },
    { key: "phone", title: "Phone" },
    { key: "owed_amount", title: "Owed" },
    { key: "credit_limit_amount", title: "Credit Limit" },
    { key: "wallet_balance", title: "Wallet" },
  ],
  supplier_payable: [
    { key: "name", title: "Supplier" },
    { key: "phone", title: "Phone" },
    { key: "payable_amount", title: "Payable" },
  ],
  stock_ledger: [
    { key: "product__name", title: "Product" },
    { key: "entry_type", title: "Entry" },
    { key: "quantity", title: "Qty" },
    { key: "unit_cost", title: "Cost" },
    { key: "balance_after", title: "Balance" },
  ],
  customer_credit: [
    { key: "customer__name", title: "Customer" },
    { key: "amount", title: "Amount" },
    { key: "direction", title: "Direction" },
    { key: "balance_after", title: "Balance" },
    { key: "reason", title: "Reason" },
  ],
  accounting: [
    { key: "transaction__name", title: "Transaction" },
    { key: "account__name", title: "Account" },
    { key: "action_type", title: "Action" },
    { key: "amount", title: "Amount" },
    { key: "balance_after", title: "Balance" },
    { key: "source_type", title: "Source" },
  ],
}

export default function ReportsPage() {
  const lastRowsRequestRef = useRef("")
  const [activeTab, setActiveTab] =
    useState<(typeof reportTabs)[number]>("sales")
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(
    "This Month"
  )
  const [dateFilters, setDateFilters] = useState(() => getDateRange("This Month"))

  const {
    data: summaryResponse,
    refetch: refetchSummary,
    isLoading: isSummaryLoading,
  } = (reports as any).useGetDashboardSummaryQuery({})
  const summary = summaryResponse?.data || null
  const [refreshDashboardSnapshot, snapshotState] = (
    reports as any
  ).useRefreshDashboardSnapshotMutation()
  const [getCustomerDueReport, customerDueState] = (
    reports as any
  ).useGetCustomerDueReportMutation()
  const [getSupplierPayableReport, supplierPayableState] = (
    reports as any
  ).useGetSupplierPayableReportMutation()
  const [getStockLedgerReport, stockLedgerState] = (
    reports as any
  ).useGetStockLedgerReportMutation()
  const [getCustomerCreditLedgerReport, customerCreditState] = (
    reports as any
  ).useGetCustomerCreditLedgerReportMutation()
  const [getSaleReport, saleReportState] = (
    reports as any
  ).useGetSaleReportMutation()
  const [getSoldStockReport, soldStockState] = (
    reports as any
  ).useGetSoldStockReportMutation()
  const [getProfitReport, profitState] = (
    reports as any
  ).useGetProfitReportMutation()
  const [getPaymentTypesReport, paymentTypesState] = (
    reports as any
  ).useGetPaymentTypesReportMutation()
  const [getProductsReport, productsState] = (
    reports as any
  ).useGetProductsReportMutation()
  const [getLowStockReport, lowStockState] = (
    reports as any
  ).useGetLowStockReportMutation()
  const [getStockReport, stockState] = (
    reports as any
  ).useGetStockReportMutation()
  const [getCashierReport, cashierState] = (
    reports as any
  ).useGetCashierReportMutation()
  const [getTransactionHistoryData, accountingState] = (
    accounting as any
  ).useGetTransactionHistoryDataMutation()

  const isTableLoading =
    customerDueState.isLoading ||
    supplierPayableState.isLoading ||
    stockLedgerState.isLoading ||
    customerCreditState.isLoading ||
    saleReportState.isLoading ||
    soldStockState.isLoading ||
    profitState.isLoading ||
    paymentTypesState.isLoading ||
    productsState.isLoading ||
    lowStockState.isLoading ||
    stockState.isLoading ||
    cashierState.isLoading ||
    accountingState.isLoading



  const rowsPayload = useMemo(
    () => ({
      page,
      limit: 10,
      search: searchTerm || undefined,
      startDate: dateFilters.startDate,
      endDate: dateFilters.endDate,
    }),
    [dateFilters.endDate, dateFilters.startDate, page, searchTerm]
  )

  const loadRows = async (payload = rowsPayload, tab = activeTab) => {
    const requestKey = JSON.stringify({ tab, payload })

    if (lastRowsRequestRef.current === requestKey) return
    lastRowsRequestRef.current = requestKey

    const requestPayload = { ...payload, limit: 10 }
    const mutationMap: Record<string, any> = {
      sales: getSaleReport,
      sold_stock: getSoldStockReport,
      profit: getProfitReport,
      payment_types: getPaymentTypesReport,
      products: getProductsReport,
      low_stock: getLowStockReport,
      stock: getStockReport,
      cashier: getCashierReport,
      customer_due: getCustomerDueReport,
      supplier_payable: getSupplierPayableReport,
      stock_ledger: getStockLedgerReport,
      customer_credit: getCustomerCreditLedgerReport,
      accounting: getTransactionHistoryData,
    }
    const response = await mutationMap[tab](requestPayload).unwrap()
    const data = response?.data || {}
    setRows(data.items || [])
    setTotalItems(data.total || 0)
  }



  useEffect(() => {
    loadRows(rowsPayload, activeTab)
  }, [activeTab, rowsPayload])

  const handleFilterChange = (action: string, payload?: any) => {
    switch (action) {
      case "search":
        setPage(1)
        setSearchTerm(payload || "")
        break
      case "dateRange":
        if (typeof payload === "string") {
          setPage(1)
          setSelectedDateRange(payload)
          setDateFilters(getDateRange(payload))
        }
        break
      case "customDate":
        if (payload) {
          const [startDate, endDate] = payload
          setPage(1)
          setSelectedDateRange("Custom")
          setDateFilters({ startDate, endDate })
        }
        break
      default:
        break
    }
  }

  const refreshSnapshot = async () => {
    const response = await refreshDashboardSnapshot({}).unwrap()
    showToast.success(response?.message || "Dashboard snapshot refreshed.")
    refetchSummary()
  }

  const cards = [
    {
      label: "Sales",
      value: summary?.sales?.total_sales || 0,
      helper: `${summary?.sales?.order_count || 0} orders`,
    },
    {
      label: "Purchases",
      value: summary?.purchases?.total_purchase || 0,
      helper: `${summary?.purchases?.purchase_count || 0} purchases`,
    },
    {
      label: "Expenses",
      value: summary?.expenses?.total_expense || 0,
      helper: `${summary?.expenses?.expense_count || 0} entries`,
    },
    {
      label: "Customer Due",
      value: summary?.customers?.total_customer_due || 0,
      helper: `${summary?.customers?.customer_count || 0} customers`,
    },
    {
      label: "Supplier Payable",
      value: summary?.suppliers?.total_supplier_payable || 0,
      helper: `${summary?.suppliers?.supplier_count || 0} suppliers`,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Summary, ledgers and due reports.
          </p>
        </div>
        <Button onClick={refreshSnapshot} disabled={snapshotState.isLoading}>
          {snapshotState.isLoading ? <Spinner /> : "Refresh Snapshot"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-white p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              {card.label}
            </p>
            <h2 className="mt-1 text-xl font-bold">₹{card.value}</h2>
            <p className="text-xs font-medium text-muted-foreground">
              {card.helper}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {reportTabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            onClick={() => {
              setPage(1)
              setActiveTab(tab)
            }}
          >
            {tabLabels[tab]}
          </Button>
        ))}
      </div>

      <DynamicTable
        data={rows}
        columns={columns[activeTab]}
        tableTitle={tabLabels[activeTab]}
        showSearch
        showDateRange
        searchTerm={searchTerm}
        selectedDateRange={selectedDateRange}
        dateFilters={dateFilters}
        currentPage={page}
        itemsPerPage={10}
        totalItems={totalItems}
        onPageChange={setPage}
        onFilterChange={handleFilterChange}
        isLoading={isSummaryLoading || isTableLoading}
        hideActions
      />
    </div>
  )
}
