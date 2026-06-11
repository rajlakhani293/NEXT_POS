"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
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
    }

    void mutationMap[activeReport]({ ...rowsPayload, limit: 10 })
      .unwrap()
      .then((response: any) => {
        const data = response?.data || {}
        setRows(data.items || [])
        setTotalItems(data.total || 0)
      })
      .catch(() => {
        lastRowsRequestRef.current = ""
      })
  }, [
    activeReport,
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
              Review this report with search, date filters and pagination.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <DynamicTable
          data={rows}
          columns={reportColumns[activeReport]}
          tableTitle={tabLabels[activeReport]}
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
          isLoading={isTableLoading}
          hideActions
        />
      </div>
    </div>
  )
}
