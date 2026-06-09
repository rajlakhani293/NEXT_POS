"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeIndianRupee,
  PackageCheck,
  ReceiptIndianRupee,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Truck,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { reports } from "@/lib/api/reports"
import { showToast } from "@/lib/toast"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null)

  const [getDashboardSummary, summaryState] = (
    reports as any
  ).useGetDashboardSummaryMutation()
  const [refreshDashboardSnapshot, refreshState] = (
    reports as any
  ).useRefreshDashboardSnapshotMutation()

  const loadSummary = async () => {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    const response = await getDashboardSummary({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }).unwrap()
    setSummary(response?.data || null)
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const cards = useMemo(
    () => [
      {
        title: "Today Sales",
        value: formatMoney(summary?.sales?.total_sales),
        helper: `${summary?.sales?.order_count || 0} orders`,
        icon: <ReceiptText className="size-5" />,
      },
      {
        title: "Collected Today",
        value: formatMoney(summary?.sales?.total_paid),
        helper: `${summary?.sales?.paid_orders || 0} fully paid`,
        icon: <BadgeIndianRupee className="size-5" />,
      },
      {
        title: "Due Pending",
        value: formatMoney(summary?.sales?.total_due),
        helper: `${summary?.sales?.partially_paid_orders || 0} partial / ${summary?.sales?.unpaid_orders || 0} unpaid`,
        icon: <Wallet className="size-5" />,
      },
      {
        title: "Refunded",
        value: formatMoney(summary?.sales?.refund_total),
        helper: `${(summary?.sales?.refunded_orders || 0) + (summary?.sales?.partially_refunded_orders || 0)} orders`,
        icon: <RotateCcw className="size-5" />,
      },
    ],
    [summary]
  )

  const businessCards = useMemo(
    () => [
      {
        title: "Purchases",
        value: formatMoney(summary?.purchases?.total_purchase),
        helper: `${summary?.purchases?.purchase_count || 0} purchase orders`,
        icon: <PackageCheck className="size-5" />,
      },
      {
        title: "Supplier Payable",
        value: formatMoney(summary?.suppliers?.total_supplier_payable),
        helper: `${summary?.suppliers?.supplier_count || 0} suppliers`,
        icon: <Truck className="size-5" />,
      },
      {
        title: "Customer Due",
        value: formatMoney(summary?.customers?.total_customer_due),
        helper: `${summary?.customers?.customer_count || 0} customers`,
        icon: <Wallet className="size-5" />,
      },
      {
        title: "Expenses",
        value: formatMoney(summary?.expenses?.total_expense),
        helper: `${summary?.expenses?.expense_count || 0} expense entries`,
        icon: <ReceiptIndianRupee className="size-5" />,
      },
    ],
    [summary]
  )

  const shift = summary?.shift
  const bestCustomers = summary?.best_customers || []
  const bestCashiers = summary?.best_cashiers || []
  const recentOrders = summary?.recent_orders || []
  const weeklySales = summary?.weekly_sales || []

  const refreshSnapshot = async () => {
    const response = await refreshDashboardSnapshot({}).unwrap()
    showToast.success(response?.message || "Dashboard snapshot refreshed.")
    await loadSummary()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Sales snapshot, due summary and live shift overview.
          </p>
        </div>
        <Button onClick={refreshSnapshot} disabled={refreshState.isLoading}>
          {refreshState.isLoading ? <Spinner /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{card.title}</p>
              <div className="rounded-full bg-slate-100 p-2 text-slate-700">
                {card.icon}
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {businessCards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{card.title}</p>
              <div className="rounded-full bg-slate-100 p-2 text-slate-700">
                {card.icon}
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Quick Access</h2>
              <p className="text-sm text-slate-500">
                Jump straight into common sales operations.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Link
              href="/sales"
              className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-950">Start Billing</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Open POS screen and create new sale.
                  </p>
                </div>
                <ArrowRight className="size-4 text-slate-500" />
              </div>
            </Link>
            <Link
              href="/sales/history"
              className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-950">Sales History</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Review billed orders, due and refunds.
                  </p>
                </div>
                <ArrowRight className="size-4 text-slate-500" />
              </div>
            </Link>
            <Link
              href="/purchases"
              className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-950">Purchases</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Create purchase orders and receive stock.
                  </p>
                </div>
                <ArrowRight className="size-4 text-slate-500" />
              </div>
            </Link>
            <Link
              href="/customers/credit"
              className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-950">Customer Credit</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Monitor due balances and ledger changes.
                  </p>
                </div>
                <ArrowRight className="size-4 text-slate-500" />
              </div>
            </Link>
            <Link
              href="/reports"
              className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-950">Reports</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Open due, ledger and accounting reports.
                  </p>
                </div>
                <ArrowRight className="size-4 text-slate-500" />
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Active Shift</h2>
          <p className="text-sm text-slate-500">
            Live cashier shift summary for this branch.
          </p>

          {summaryState.isLoading && !summary ? (
            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <Spinner />
              Loading shift summary...
            </div>
          ) : shift ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">
                  {shift.register__name || "Register"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cashier: {shift.cashier__full_name || "-"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Opening Cash</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatMoney(shift.opening_cash)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Expected Cash</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatMoney(shift.expected_cash)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Sales Collected</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatMoney(shift.total_sales_amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Refund Out</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatMoney(shift.total_refund_amount)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">
              No active cashier shift found.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Best Customers</h2>
              <p className="text-sm text-slate-500">
                Top customers by visible sales amount.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {bestCustomers.length ? (
              bestCustomers.map((customer: any, index: number) => (
                <div
                  key={`${customer.customer_id}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {customer.customer__name || "Walk-in Customer"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {customer.order_count || 0} orders
                    </p>
                  </div>
                  <p className="font-bold text-slate-950">
                    {formatMoney(customer.total_spent)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">
                No customer sales found for this period.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Best Cashiers</h2>
              <p className="text-sm text-slate-500">
                Top cashiers by billed sales amount.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {bestCashiers.length ? (
              bestCashiers.map((cashier: any, index: number) => (
                <div
                  key={`${cashier.cashier_id}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {cashier.cashier__full_name || "Cashier"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {cashier.order_count || 0} orders
                    </p>
                  </div>
                  <p className="font-bold text-slate-950">
                    {formatMoney(cashier.total_sales)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">
                No cashier sales found for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Weekly Sales</h2>
          <p className="text-sm text-slate-500">
            Last 7 days sales snapshot for this branch.
          </p>
          <div className="mt-5 space-y-3">
            {weeklySales.length ? (
              weeklySales.map((day: any, index: number) => (
                <div
                  key={`${day.day}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{day.day}</p>
                    <p className="text-sm text-slate-500">
                      {day.order_count || 0} orders
                    </p>
                  </div>
                  <p className="font-bold text-slate-950">
                    {formatMoney(day.total_sales)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">
                No weekly sales found.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Recent Orders</h2>
          <p className="text-sm text-slate-500">
            Latest billed orders for quick follow-up.
          </p>
          <div className="mt-5 space-y-3">
            {recentOrders.length ? (
              recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/sales/${order.id}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {order.code} · {order.customer__name || "Walk-in Customer"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {order.cashier__full_name || "-"} · {order.payment_status || "-"}
                    </p>
                  </div>
                  <p className="font-bold text-slate-950">
                    {formatMoney(order.total)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">
                No recent orders found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
