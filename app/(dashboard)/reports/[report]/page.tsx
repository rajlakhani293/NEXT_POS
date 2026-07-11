"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { ArrowLeft, PrinterIcon, RefreshCwIcon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { customers } from "@/lib/api/customers"
import { reports } from "@/lib/api/reports"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { getDateRange } from "@/lib/utils"
import { showToast } from "@/lib/toast"
import {
  isReportKey,
  reportColumns,
  tabLabels,
  type ReportKey,
} from "../report-config"

export default function ReportViewPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (val: any) =>
    `${posOptions.currency_symbol}${Number(val || 0).toFixed(posOptions.currency_precision)}`
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
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [annualTotals, setAnnualTotals] = useState<any>(null)

  const [getCustomersDropdown, customersDropdownState] = (
    customers as any
  ).useGetCustomersDropdownMutation()
  const [getCustomerStatement, customerStatementState] = (
    reports as any
  ).useGetCustomerStatementMutation()
  const [getProductHistoryCombinedReport, stockHistoryState] = (
    reports as any
  ).useGetProductHistoryCombinedReportMutation()
  const [computeProductHistoryCombinedReport, computeStockHistoryState] = (
    reports as any
  ).useComputeProductHistoryCombinedReportMutation()
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
  const [getStockReport, stockReportState] = (
    reports as any
  ).useGetStockReportMutation()
  const [getTransactionsReport, transactionsState] = (
    reports as any
  ).useGetTransactionsReportMutation()
  const [getAnnualReport, annualState] = (
    reports as any
  ).useGetAnnualReportMutation()
  const [computeAnnualReport, computeAnnualState] = (
    reports as any
  ).useComputeAnnualReportMutation()

  const isTableLoading =
    customerStatementState.isLoading ||
    customersDropdownState.isLoading ||
    stockHistoryState.isLoading ||
    saleReportState.isLoading ||
    soldStockState.isLoading ||
    profitState.isLoading ||
    paymentTypesState.isLoading ||
    productsState.isLoading ||
    lowStockState.isLoading ||
    stockReportState.isLoading ||
    transactionsState.isLoading ||
    annualState.isLoading ||
    computeAnnualState.isLoading ||
    computeStockHistoryState.isLoading

  const rowsPayload = useMemo(() => {
    if (activeReport === "annual") {
      return { year: selectedYear }
    }
    const payload: any = {
      page,
      limit: 10,
      search: searchTerm || undefined,
      startDate: dateFilters.startDate,
      endDate: dateFilters.endDate,
    }
    if (activeReport === "stock_ledger") {
      payload.date = dateFilters.endDate || dateFilters.startDate
    }
    return payload
  }, [activeReport, selectedYear, dateFilters.endDate, dateFilters.startDate, page, searchTerm])

  useEffect(() => {
    // Reset data when report type changes
    setRows([])
    setTotalItems(0)
    setAnnualTotals(null)
  }, [activeReport])

  useEffect(() => {
    if (activeReport !== "customers_statement") return
    void getCustomersDropdown()
  }, [activeReport, getCustomersDropdown])

  useEffect(() => {
    const requestKey = JSON.stringify({
      report: activeReport,
      rowsPayload,
      selectedCustomerId:
        activeReport === "customers_statement" ? selectedCustomerId : undefined,
    })
    if (lastRowsRequestRef.current === requestKey) return
    lastRowsRequestRef.current = requestKey

    if (activeReport === "customers_statement" && !selectedCustomerId) {
      setRows([])
      setTotalItems(0)
      return
    }

    const mutationMap: Record<ReportKey, any> = {
      sales: getSaleReport,
      sales_progress: getProductsReport,
      customers_statement: (payLoad: any) => getCustomerStatement({ id: selectedCustomerId, payLoad }),
      low_stock: getLowStockReport,
      stock_report: getStockReport,
      stock_ledger: getProductHistoryCombinedReport,
      sold_stock: getSoldStockReport,
      profit: getProfitReport,
      accounting: getTransactionsReport,
      annual: getAnnualReport,
      payment_types: getPaymentTypesReport,
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
        } else if (activeReport === "accounting") {
          const accountRows = Object.values(data.accounts || {}).flatMap((group: any) => [
            {
              id: `group-${group.name}`,
              name: group.name,
              debits: group.debits,
              credits: group.credits,
              is_group: true,
            },
            ...((group.transactions || []).map((account: any) => ({
              ...account,
              name: account.name,
              is_group: false,
            }))),
          ])
          setRows(accountRows)
          setTotalItems(accountRows.length)
          setAnnualTotals({
            total_debits: data.debits,
            total_credits: data.credits,
            profit: data.profit,
          })
        } else if (activeReport === "stock_report") {
          const items = (data.items || []).map((item: any) => ({
            ...item,
            stock_value: Number(item.current_stock || 0) * Number(item.selling_price || 0),
          }))
          setRows(items)
          setTotalItems(data.total || 0)
        } else if (activeReport === "payment_types") {
          setRows(data.summary || [])
          setTotalItems((data.summary || []).length)
          setAnnualTotals({ total: data.total })
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
    getCustomerStatement,
    getLowStockReport,
    getPaymentTypesReport,
    getProductsReport,
    getProfitReport,
    getSaleReport,
    getSoldStockReport,
    getProductHistoryCombinedReport,
    getStockReport,
    getTransactionsReport,
    rowsPayload,
    selectedCustomerId,
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
      <span className="text-sm font-semibold text-gray-500">{t("Year")}:</span>
      <Select
        value={String(selectedYear)}
        onValueChange={(val) => setSelectedYear(Number(val))}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder={t("Select year")} />
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

  const customerSelector = activeReport === "customers_statement" ? (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-500">{t("Customer")}:</span>
      <Select
        value={selectedCustomerId || undefined}
        onValueChange={(val) => {
          setPage(1)
          setSelectedCustomerId(val)
          lastRowsRequestRef.current = ""
        }}
      >
        <SelectTrigger className="h-9 w-[220px]">
          <SelectValue placeholder={t("Select Customer")} />
        </SelectTrigger>
        <SelectContent>
          {(customersDropdownState.data?.data || []).map((customer: any) => (
            <SelectItem key={customer.id} value={String(customer.id)}>
              {customer.name || customer.full_name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.email || customer.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : undefined

  const stockReportTypeSelector =
    activeReport === "stock_report" || activeReport === "low_stock" ? (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-500">
          {t("Report Type")}:
        </span>
        <Select
          value={activeReport}
          onValueChange={(val) => router.push(`/reports/${val}`)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder={t("Report Type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stock_report">{t("Stock Report")}</SelectItem>
            <SelectItem value="low_stock">{t("Low Stock")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ) : undefined

  const handlePrint = () => {
    window.print()
  }

  const handleRecomputeAnnual = async () => {
    const response = await computeAnnualReport({ year: selectedYear }).unwrap()
    showToast.success(response?.message || t("The report will be computed for the current year."))
  }

  const handleGenerateStockHistory = async () => {
    const response = await computeProductHistoryCombinedReport({
      date: dateFilters.endDate || dateFilters.startDate,
    }).unwrap()
    showToast.success(response?.message || t("Stock combined report recomputed successfully."))
    lastRowsRequestRef.current = ""
    setPage(1)
  }

  const reportActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {yearSelector}
      {customerSelector}
      {stockReportTypeSelector}
      {activeReport === "annual" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRecomputeAnnual}
          disabled={computeAnnualState.isLoading}
        >
          <RefreshCwIcon className="size-4" />
          {t("Recompute")}
        </Button>
      ) : null}
      {activeReport === "stock_ledger" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateStockHistory}
          disabled={computeStockHistoryState.isLoading}
        >
          <RefreshCwIcon className="size-4" />
          {t("Generate Report")}
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
        <PrinterIcon className="size-4" />
        {t("Print")}
      </Button>
    </div>
  )

  const formattedColumns = useMemo(() => {
    const rawColumns = reportColumns[activeReport] || []
    return rawColumns.map((col: any) => {
      if (col.render) return col

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
        "stock_value",
        "selling_price",
        "purchase_price",
        "owed_amount",
        "credit_limit_amount",
        "wallet_balance",
        "previous_amount",
        "next_amount",
        "payable_amount",
        "unit_cost",
        "balance_after",
        "total_sales",
        "total_taxes",
        "total_expenses",
        "net_income",
        "debits",
        "credits",
      ]

      if (activeReport === "accounting" && col.key === "name") {
        return {
          ...col,
          title: t(col.title),
          render: (val: any, record: any) => (
            <span className={record.is_group ? "font-bold" : "pl-4"}>
              {val || "-"}
            </span>
          ),
        }
      }

      if (col.key === "due_amount") {
        return {
          ...col,
          title: t(col.title),
          render: (_: any, record: any) => {
            const total = Number(record.total || 0)
            const paid = Number(record.tendered_amount || 0)
            const due = Math.max(0, total - paid)
            return formatMoney(due)
          },
        }
      }

      if (moneyKeys.includes(col.key)) {
        return {
          ...col,
          title: t(col.title),
          render: (val: any) => formatMoney(val),
        }
      }

      if (col.key === "created_at" || col.key === "paid_at" || col.key === "date") {
        return {
          ...col,
          title: t(col.title),
          render: (val: any) => (val ? new Date(val).toLocaleString() : "-"),
        }
      }

      if (col.key === "customer__name") {
        return {
          ...col,
          title: t(col.title),
          render: (val: any, record: any) => record.customer__full_name || record.customer__name || t("Walk-in Customer"),
        }
      }

      if (col.key === "cashier__full_name") {
        return {
          ...col,
          title: t(col.title),
          render: (val: any, record: any) => record.user__full_name || record.cashier__full_name || "-",
        }
      }

      return {
        ...col,
        title: t(col.title),
      }
    })
  }, [activeReport, formatMoney, t])

  const footerSummary = useMemo(() => {
    if (activeReport === "accounting" && annualTotals) {
      return [
        { label: t("Debit"), value: formatMoney(annualTotals.total_debits) },
        { label: t("Credit"), value: formatMoney(annualTotals.total_credits) },
        { label: t("Profit"), value: formatMoney(annualTotals.profit) },
      ]
    }
    if (activeReport === "payment_types" && annualTotals) {
      return [{ label: t("Total"), value: formatMoney(annualTotals.total) }]
    }
    if (activeReport !== "annual" || !annualTotals) return undefined
    return [
      { label: t("Total Sales"), value: formatMoney(annualTotals.total_sales) },
      { label: t("Total Taxes"), value: formatMoney(annualTotals.total_taxes) },
      { label: t("Total Expenses"), value: formatMoney(annualTotals.total_expenses) },
      { label: t("Net Income"), value: formatMoney(annualTotals.net_income) },
    ]
  }, [activeReport, annualTotals, formatMoney, t])

  return (
    <DashboardPage padding="none">
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
              {t(tabLabels[activeReport])}
            </h1>
            <p className="text-sm font-medium text-gray-500">
              {activeReport === "annual" 
                ? t("Monthly summary breakdown of sales, taxes, expenses, and net income.")
                : activeReport === "customers_statement"
                  ? t("Display the complete customer statement.")
                : t("Review this report with search, date filters and pagination.")}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <DynamicTable
          data={rows}
          columns={formattedColumns}
          tableTitle={t(tabLabels[activeReport])}
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
          secondaryActionButton={reportActions}
          footerSummary={footerSummary}
        />
      </div>
      </div>
    </DashboardPage>
  )
}
