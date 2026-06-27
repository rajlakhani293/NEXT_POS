"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { accounting } from "@/lib/api/accounting"
import { reports } from "@/lib/api/reports"
import { getDateRange } from "@/lib/utils"
import {
  isReportKey,
  reportColumns,
  tabLabels,
  type ReportKey,
} from "../report-config"

export default function ReportViewPage() {
  const router = useRouter()
  const params = useParams()
  const reportParam = String(params.report || "")

  if (!isReportKey(reportParam)) {
    notFound()
  }

  const activeReport = reportParam as ReportKey
  const lastRowsRequestRef = useRef("")
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(
    "This Month"
  )
  const [dateFilters, setDateFilters] = useState(() =>
    getDateRange("This Month")
  )

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [annualTotals, setAnnualTotals] = useState<any>(null)

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
  const [getAnnualReport, annualState] = (
    reports as any
  ).useGetAnnualReportMutation()

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
    accountingState.isLoading ||
    annualState.isLoading

  const rowsPayload = useMemo(() => {
    if (activeReport === "annual") {
      return { year: selectedYear }
    }
    return {
      page,
      limit: 10,
      search: searchTerm || undefined,
      startDate: dateFilters.startDate,
      endDate: dateFilters.endDate,
    }
  }, [activeReport, selectedYear, dateFilters.endDate, dateFilters.startDate, page, searchTerm])

  useEffect(() => {
    // Reset data when report type changes
    setRows([])
    setTotalItems(0)
    setAnnualTotals(null)
  }, [activeReport])

  useEffect(() => {
    const requestKey = JSON.stringify({ report: activeReport, rowsPayload })
    if (lastRowsRequestRef.current === requestKey) return
    lastRowsRequestRef.current = requestKey

    const mutationMap: Record<ReportKey, any> = {
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
      annual: getAnnualReport,
    }

    const payload = activeReport === "annual" ? rowsPayload : { ...rowsPayload, limit: 10 }

    void mutationMap[activeReport](payload)
      .unwrap()
      .then((response: any) => {
        const data = response?.data || {}
        if (activeReport === "annual") {
          setRows(data.months || [])
          setTotalItems(12)
          setAnnualTotals(data.totals || null)
        } else {
          setRows(data.items || [])
          setTotalItems(data.total || 0)
        }
      })
      .catch(() => {
        lastRowsRequestRef.current = ""
      })
  }, [
    activeReport,
    getAnnualReport,
    getCashierReport,
    getCustomerCreditLedgerReport,
    getCustomerDueReport,
    getLowStockReport,
    getPaymentTypesReport,
    getProductsReport,
    getProfitReport,
    getSaleReport,
    getSoldStockReport,
    getStockLedgerReport,
    getStockReport,
    getSupplierPayableReport,
    getTransactionHistoryData,
    rowsPayload,
  ])

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  const yearSelector = activeReport === "annual" ? (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-500">Year:</span>
      <Select
        value={String(selectedYear)}
        onValueChange={(val) => setSelectedYear(Number(val))}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : undefined

  const formattedColumns = useMemo(() => {
    const rawColumns = reportColumns[activeReport] || []
    return rawColumns.map((col: any) => {
      if (col.render) return col

      const formatMoney = (val: any) => `₹${Number(val || 0).toFixed(2)}`

      const moneyKeys = [
        "total",
        "tendered_amount",
        "due_amount",
        "subtotal",
        "discount_amount",
        "tax_amount",
        "unit_price",
        "cost_price",
        "cost_total",
        "profit_amount",
        "amount",
        "sold_amount",
        "selling_price",
        "purchase_price",
        "owed_amount",
        "credit_limit_amount",
        "wallet_balance",
        "payable_amount",
        "unit_cost",
        "balance_after",
        "total_sales",
        "total_taxes",
        "total_expenses",
        "net_income",
      ]

      if (moneyKeys.includes(col.key)) {
        return {
          ...col,
          render: (val: any) => formatMoney(val),
        }
      }

      if (col.key === "created_at" || col.key === "paid_at") {
        return {
          ...col,
          render: (val: any) => (val ? new Date(val).toLocaleString() : "-"),
        }
      }

      if (col.key === "customer__name") {
        return {
          ...col,
          render: (val: any, record: any) => record.customer__full_name || record.customer__name || "Walk-in Customer",
        }
      }

      if (col.key === "cashier__full_name") {
        return {
          ...col,
          render: (val: any, record: any) => record.user__full_name || record.cashier__full_name || "-",
        }
      }

      if (col.key === "due_amount") {
        return {
          ...col,
          render: (_: any, record: any) => {
            const total = Number(record.total || 0)
            const paid = Number(record.tendered_amount || 0)
            const due = Math.max(0, total - paid)
            return formatMoney(due)
          },
        }
      }

      return col
    })
  }, [activeReport])

  const footerSummary = useMemo(() => {
    if (activeReport !== "annual" || !annualTotals) return undefined
    const formatMoney = (val: any) => `₹${Number(val || 0).toFixed(2)}`
    return [
      { label: "Total Sales", value: formatMoney(annualTotals.total_sales) },
      { label: "Total Taxes", value: formatMoney(annualTotals.total_taxes) },
      { label: "Total Expenses", value: formatMoney(annualTotals.total_expenses) },
      { label: "Net Income", value: formatMoney(annualTotals.net_income) },
    ]
  }, [activeReport, annualTotals])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => router.push("/reports")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {tabLabels[activeReport]}
            </h1>
            <p className="text-sm font-medium text-gray-500">
              {activeReport === "annual" 
                ? "Monthly summary breakdown of sales, taxes, expenses, and net income."
                : "Review this report with search, date filters and pagination."}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <DynamicTable
          data={rows}
          columns={formattedColumns}
          tableTitle={tabLabels[activeReport]}
          showSearch={activeReport !== "annual"}
          showDateRange={activeReport !== "annual"}
          searchTerm={searchTerm}
          selectedDateRange={selectedDateRange}
          dateFilters={dateFilters}
          currentPage={page}
          itemsPerPage={activeReport === "annual" ? 12 : 10}
          totalItems={totalItems}
          onPageChange={setPage}
          onFilterChange={handleFilterChange}
          isLoading={isTableLoading}
          hideActions
          secondaryActionButton={yearSelector}
          footerSummary={footerSummary}
        />
      </div>
    </div>
  )
}
