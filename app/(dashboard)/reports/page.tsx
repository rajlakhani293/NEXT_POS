"use client"

import { useEffect, useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { accounting } from "@/lib/api/accounting"
import { reports } from "@/lib/api/reports"
import { showToast } from "@/lib/toast"

const reportTabs = [
  "customer_due",
  "supplier_payable",
  "stock_ledger",
  "customer_credit",
  "accounting",
] as const

const tabLabels: Record<(typeof reportTabs)[number], string> = {
  customer_due: "Customer Due",
  supplier_payable: "Supplier Payable",
  stock_ledger: "Stock Ledger",
  customer_credit: "Customer Credit",
  accounting: "Accounting",
}

const columns: Record<string, any[]> = {
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
  const [activeTab, setActiveTab] =
    useState<(typeof reportTabs)[number]>("customer_due")
  const [summary, setSummary] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)

  const [getDashboardSummary, summaryState] = (
    reports as any
  ).useGetDashboardSummaryMutation()
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
  const [getTransactionHistoryData, accountingState] = (
    accounting as any
  ).useGetTransactionHistoryDataMutation()

  const isTableLoading =
    customerDueState.isLoading ||
    supplierPayableState.isLoading ||
    stockLedgerState.isLoading ||
    customerCreditState.isLoading ||
    accountingState.isLoading

  const loadSummary = async () => {
    const response = await getDashboardSummary({}).unwrap()
    setSummary(response?.data)
  }

  const loadRows = async (nextPage = page, tab = activeTab) => {
    const payload = { page: nextPage, limit: 10 }
    const mutationMap: Record<string, any> = {
      customer_due: getCustomerDueReport,
      supplier_payable: getSupplierPayableReport,
      stock_ledger: getStockLedgerReport,
      customer_credit: getCustomerCreditLedgerReport,
      accounting: getTransactionHistoryData,
    }
    const response = await mutationMap[tab](payload).unwrap()
    const data = response?.data || {}
    setRows(data.items || [])
    setTotalItems(data.total || 0)
  }

  useEffect(() => {
    loadSummary()
  }, [])

  useEffect(() => {
    loadRows(page, activeTab)
  }, [activeTab, page])

  const refreshSnapshot = async () => {
    const response = await refreshDashboardSnapshot({}).unwrap()
    showToast.success(response?.message || "Dashboard snapshot refreshed.")
    await loadSummary()
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
        currentPage={page}
        itemsPerPage={10}
        totalItems={totalItems}
        onPageChange={setPage}
        isLoading={summaryState.isLoading || isTableLoading}
        hideActions
      />
    </div>
  )
}
