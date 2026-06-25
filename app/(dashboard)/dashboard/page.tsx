"use client"

import { useMemo, useState, useEffect } from "react"
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
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { reports } from "@/lib/api/reports"
import { showToast } from "@/lib/toast"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

export default function DashboardPage() {
  const [refreshDashboardSnapshot, refreshState] = (reports as any).useRefreshDashboardSnapshotMutation()
  const [getLowStockReport, lowStockState] = (reports as any).useGetLowStockReportMutation()
  const [lowStockItems, setLowStockItems] = useState<any[]>([])

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await getLowStockReport({ page: 1, limit: 5 }).unwrap()
        setLowStockItems(res?.data?.items || [])
      } catch (err) {
        console.error("Failed to load low stock report", err)
      }
    }
    fetchLowStock()
  }, [getLowStockReport])


  const queryArgs = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }, [])

  const { data: summaryResponse, refetch } = (reports as any).useGetDashboardSummaryQuery(queryArgs)
  const summary = summaryResponse?.data || null

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
  const prevWeeklySales = summary?.prev_weekly_sales || []

  const normalizedWeeklyData = useMemo(() => {
    const data = []
    const today = new Date()
    const formatDate = (date: Date) => {
      const offset = date.getTimezoneOffset()
      const localDate = new Date(date.getTime() - offset * 60 * 1000)
      return localDate.toISOString().split("T")[0]
    }

    for (let i = 6; i >= 0; i--) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() - i)
      const currentDateStr = formatDate(currentDate)

      const prevDate = new Date(currentDate)
      prevDate.setDate(currentDate.getDate() - 7)
      const prevDateStr = formatDate(prevDate)

      const currentMatch = weeklySales.find((d: any) => String(d.day).startsWith(currentDateStr))
      const prevMatch = prevWeeklySales.find((d: any) => String(d.day).startsWith(prevDateStr))

      data.push({
        day: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
        date: currentDateStr,
        currentSales: Number(currentMatch?.total_sales || 0),
        currentOrders: Number(currentMatch?.order_count || 0),
        prevSales: Number(prevMatch?.total_sales || 0),
        prevOrders: Number(prevMatch?.order_count || 0),
      })
    }
    return data
  }, [weeklySales, prevWeeklySales])

  const refreshSnapshot = async () => {
    const response = await refreshDashboardSnapshot({}).unwrap()
    showToast.success(response?.message || "Dashboard snapshot refreshed.")
    refetch()
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
              href="/sales/create"
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
              href="/sales"
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

        <div className="space-y-4">
          {/* Active Shift Widget */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Active Shift</h2>
            <p className="text-sm text-slate-500">
              Live cashier shift summary for this branch.
            </p>

            {!summary ? (
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

          {/* Cashier Stats Widget */}
          {summary?.cashier_stats && (
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">My Stats Today</h2>
              <p className="text-sm text-slate-500 mb-4">
                Personal cashier statistics for today.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold uppercase text-sm">
                    {summary.cashier_stats.cashier_name?.[0] || "C"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">
                      {summary.cashier_stats.cashier_name || "Cashier"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Member since {summary.cashier_stats.member_since}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 p-3 bg-slate-50/50">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Today's Orders</p>
                    <p className="mt-1 font-bold text-slate-950">{summary.cashier_stats.today_orders}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{summary.cashier_stats.total_orders} total</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 bg-slate-50/50">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Today's Sales</p>
                    <p className="mt-1 font-bold text-slate-950">{formatMoney(summary.cashier_stats.today_sales)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatMoney(summary.cashier_stats.total_sales)} total</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 bg-slate-50/50">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Today's Refunds</p>
                    <p className="mt-1 font-bold text-rose-600">{formatMoney(summary.cashier_stats.today_refunds)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatMoney(summary.cashier_stats.total_refunds)} total</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-3 bg-slate-50/50">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">New Customers</p>
                    <p className="mt-1 font-bold text-slate-950">{summary.cashier_stats.today_customers}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{summary.cashier_stats.total_customers} total</p>
                  </div>
                </div>
              </div>
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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Weekly Sales</h2>
          <p className="text-sm text-slate-500 mb-4">
            Last 7 days sales snapshot for this branch.
          </p>
          {weeklySales.length || prevWeeklySales.length ? (
            <div className="mt-4 flex h-60 items-end justify-between gap-2 px-2 pb-2 border-b border-gray-100">
              {(() => {
                const maxVal = Math.max(
                  ...normalizedWeeklyData.map((d) => Math.max(d.currentSales, d.prevSales)),
                  1
                );
                return normalizedWeeklyData.map((day: any, index: number) => {
                  const currentPct = (day.currentSales / maxVal) * 100;
                  const prevPct = (day.prevSales / maxVal) * 100;
                  return (
                    <div key={`${day.date}-${index}`} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute bottom-full mb-2 hidden flex-col items-center group-hover:flex z-30">
                        <div className="rounded bg-slate-950 px-3 py-2 text-xs text-white shadow-md whitespace-nowrap">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-[10px]">{day.date} ({day.day})</p>
                          <p className="text-[10px] flex items-center gap-1.5">
                            <span className="inline-block size-2 rounded-full bg-blue-600"></span>
                            This Week: <span className="font-semibold">{formatMoney(day.currentSales)}</span> ({day.currentOrders} orders)
                          </p>
                          <p className="text-[10px] flex items-center gap-1.5 mt-0.5">
                            <span className="inline-block size-2 rounded-full bg-slate-400"></span>
                            Last Week: <span className="font-semibold">{formatMoney(day.prevSales)}</span> ({day.prevOrders} orders)
                          </p>
                        </div>
                        <div className="h-1.5 w-1.5 rotate-45 bg-slate-950"></div>
                      </div>
                      
                      {/* Bars container */}
                      <div className="flex w-full items-end gap-1 px-1 h-[85%]">
                        {/* Current week bar */}
                        <div 
                          style={{ height: `${Math.max(currentPct, 2)}%` }} 
                          className="flex-1 rounded-t bg-blue-600 transition group-hover:bg-blue-500"
                        />
                        {/* Previous week bar */}
                        <div 
                          style={{ height: `${Math.max(prevPct, 2)}%` }} 
                          className="flex-1 rounded-t bg-slate-300 transition group-hover:bg-slate-400"
                        />
                      </div>
                      
                      {/* Label */}
                      <span className="mt-2 text-[11px] font-semibold text-slate-500">{day.day}</span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">
              No weekly sales found.
            </div>
          )}
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

      {/* Low Stock Alert Widget */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-950">Low Stock Alerts</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Products that have fallen below their minimum stock threshold.
        </p>
        <div className="mt-5">
          {lowStockState.isLoading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Spinner />
              Loading low stock report...
            </div>
          ) : lowStockItems.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {lowStockItems.map((item: any, idx: number) => (
                <div key={`${item.id}-${idx}`} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                  <p className="font-semibold text-slate-950 truncate" title={item.name}>{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">SKU: {item.sku || "-"}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Current Stock</p>
                      <p className="text-sm font-bold text-rose-600">{Number(item.current_stock).toFixed(0)} units</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Min Alert</p>
                      <p className="text-sm font-bold text-slate-700">{Number(item.min_stock).toFixed(0)} units</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 py-6 text-center text-sm text-slate-500">
              All products are sufficiently stocked.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

