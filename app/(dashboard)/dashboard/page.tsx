"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  PackageCheck,
  ReceiptIndianRupee,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardPage as DashboardPageShell } from "@/components/dashboard/dashboard-page"
import { Spinner } from "@/components/ui/spinner"
import { reports } from "@/lib/api/reports"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { cn } from "@/lib/utils"

const money = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const apiDate = (date: Date) => {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { t } = useTranslation()

  const queryArgs = useMemo(() => {
    const now = new Date()
    return {
      startDate: apiDate(now),
      endDate: apiDate(now),
    }
  }, [])

  const { data: summaryResponse, isLoading } = (reports as any).useGetDashboardSummaryQuery(queryArgs)
  const summary = summaryResponse?.data || null

  const sales = summary?.sales || {}
  const purchases = summary?.purchases || {}
  const customers = summary?.customers || {}
  const suppliers = summary?.suppliers || {}
  const expenses = summary?.expenses || {}
  const shift = summary?.shift
  const cashierStats = summary?.cashier_stats
  const bestCustomers = summary?.best_customers || []
  const bestCashiers = summary?.best_cashiers || []
  const recentOrders = summary?.recent_orders || []
  const weeklySales = summary?.weekly_sales || []
  const prevWeeklySales = summary?.prev_weekly_sales || []

  const summaryCards = useMemo(
    () => [
      {
        title: t("Paid Orders"),
        value: money(sales.total_paid),
        helper: `${sales.paid_orders || 0} ${t("orders")}`,
        icon: BadgeIndianRupee,
        tone: "text-emerald-600 bg-emerald-50",
      },
      {
        title: t("Unpaid Orders"),
        value: money(sales.total_due),
        helper: `${sales.partially_paid_orders || 0} ${t("partial")} / ${sales.unpaid_orders || 0} ${t("unpaid")}`,
        icon: Wallet,
        tone: "text-amber-600 bg-amber-50",
      },
      {
        title: t("Refunded Orders"),
        value: money(sales.refund_total),
        helper: `${(sales.refunded_orders || 0) + (sales.partially_refunded_orders || 0)} ${t("orders")}`,
        icon: RotateCcw,
        tone: "text-rose-600 bg-rose-50",
      },
      {
        title: t("Total Orders"),
        value: String(sales.order_count || 0),
        helper: t("created today"),
        icon: ReceiptText,
        tone: "text-sky-600 bg-sky-50",
      },
    ],
    [sales, t]
  )

  const businessCards = useMemo(
    () => [
      {
        title: t("Purchases"),
        value: money(purchases.total_purchase),
        helper: `${purchases.purchase_count || 0} ${t("purchase orders")}`,
        icon: PackageCheck,
      },
      {
        title: t("Supplier Payable"),
        value: money(suppliers.total_supplier_payable),
        helper: `${suppliers.supplier_count || 0} ${t("suppliers")}`,
        icon: Truck,
      },
      {
        title: t("Customer Due"),
        value: money(customers.total_customer_due),
        helper: `${customers.customer_count || 0} ${t("customers")}`,
        icon: UserRound,
      },
      {
        title: t("Expenses"),
        value: money(expenses.total_expense),
        helper: `${expenses.expense_count || 0} ${t("entries")}`,
        icon: ReceiptIndianRupee,
      },
    ],
    [customers, expenses, purchases, suppliers, t]
  )

  const weeklyData = useMemo(() => {
    const today = new Date()
    const rows = []

    for (let i = 6; i >= 0; i--) {
      const current = new Date(today)
      current.setDate(today.getDate() - i)
      const currentDate = apiDate(current)

      const previous = new Date(current)
      previous.setDate(current.getDate() - 7)
      const previousDate = apiDate(previous)

      const currentMatch = weeklySales.find((day: any) => String(day.day).startsWith(currentDate))
      const previousMatch = prevWeeklySales.find((day: any) => String(day.day).startsWith(previousDate))

      rows.push({
        label: current.toLocaleDateString("en-US", { weekday: "short" }),
        date: currentDate,
        currentSales: Number(currentMatch?.total_sales || 0),
        currentOrders: Number(currentMatch?.order_count || 0),
        previousSales: Number(previousMatch?.total_sales || 0),
        previousOrders: Number(previousMatch?.order_count || 0),
      })
    }

    return rows
  }, [prevWeeklySales, weeklySales])

  const maxSales = Math.max(...weeklyData.map((item) => Math.max(item.currentSales, item.previousSales)), 1)
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" }),
    []
  )

  return (
    <DashboardPageShell padding="default">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white text-slate-900 shadow-sm">
          <div className="grid gap-px border-b border-gray-100 bg-gray-200 md:grid-cols-4">
            <InfoTile label={t("Business Date")} value={todayLabel} />
            <InfoTile label={t("Gross Sales")} value={money(sales.total_sales)} />
            <InfoTile label={t("Orders")} value={sales.order_count || 0} />
            <InfoTile label={t("Register")} value={shift?.register__name || t("No active shift")} />
          </div>

          <div className="grid gap-px bg-gray-200 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{card.title}</p>
                      <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{card.helper}</p>
                    </div>
                    <div className={cn("rounded-md p-2", card.tone)}>
                      <Icon className="size-5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {businessCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-500">{card.title}</p>
                  <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                    <Icon className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold text-slate-950">{card.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{card.helper}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{t("Weekly Sales")}</h2>
                <p className="text-sm text-slate-500">{t("This week compared with the previous week.")}</p>
              </div>
              <div className="hidden items-center gap-4 text-xs font-semibold text-slate-500 sm:flex">
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-teal-500" />{t("This Week")}</span>
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-300" />{t("Last Week")}</span>
              </div>
            </div>

            <div className="mt-5 flex h-64 items-end gap-3 border-b border-gray-200 px-1 pb-3">
              {weeklyData.map((day) => {
                const currentPct = Math.max((day.currentSales / maxSales) * 100, day.currentSales > 0 ? 4 : 1)
                const previousPct = Math.max((day.previousSales / maxSales) * 100, day.previousSales > 0 ? 4 : 1)
                return (
                  <div key={day.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg group-hover:block">
                      <p className="whitespace-nowrap font-semibold">{day.date}</p>
                      <p className="mt-1 whitespace-nowrap">{t("This Week")}: {money(day.currentSales)} ({day.currentOrders})</p>
                      <p className="whitespace-nowrap">{t("Last Week")}: {money(day.previousSales)} ({day.previousOrders})</p>
                    </div>
                    <div className="flex h-[88%] items-end justify-center gap-1">
                      <div className="w-full max-w-5 rounded-t bg-teal-500" style={{ height: `${currentPct}%` }} />
                      <div className="w-full max-w-5 rounded-t bg-slate-300" style={{ height: `${previousPct}%` }} />
                    </div>
                    <p className="mt-2 truncate text-center text-xs font-semibold text-slate-500">{day.label}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{t("Active Shift")}</h2>
            <p className="text-sm text-slate-500">{t("Current register activity for this branch.")}</p>

            {isLoading ? (
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Spinner />
                {t("Loading shift summary...")}
              </div>
            ) : shift ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-950">{shift.register__name || t("Register")}</p>
                  <p className="mt-1 text-sm text-slate-500">{t("Cashier")}: {shift.cashier__full_name || "-"}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <ShiftMetric label={t("Opening Cash")} value={money(shift.opening_cash)} />
                  <ShiftMetric label={t("Expected Cash")} value={money(shift.expected_cash)} />
                  <ShiftMetric label={t("Sales Collected")} value={money(shift.total_sales_amount)} />
                  <ShiftMetric label={t("Refund Out")} value={money(shift.total_refund_amount)} />
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm font-medium text-slate-500">
                {t("No active cashier shift found.")}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{t("Quick Access")}</h2>
            <p className="text-sm text-slate-500">{t("Common operations used during the day.")}</p>
            <div className="mt-4 grid gap-2">
              <QuickLink href="/sales/create" icon={ShoppingCart} title={t("Start Billing")} helper={t("Open POS screen and create a new sale.")} />
              <QuickLink href="/sales" icon={ReceiptText} title={t("Sales History")} helper={t("Review billed orders, dues and refunds.")} />
              <QuickLink href="/purchases" icon={PackageCheck} title={t("Purchases")} helper={t("Create purchase orders and receive stock.")} />
              <QuickLink href="/reports" icon={BarChart3} title={t("Reports")} helper={t("Open sales, stock and accounting reports.")} />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{t("Recent Orders")}</h2>
                <p className="text-sm text-slate-500">{t("Latest billed orders for quick follow-up.")}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/sales">{t("View All")}</Link>
              </Button>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              {recentOrders.length ? (
                recentOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/sales/${order.id}`}
                    className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {order.code} · {order.customer__full_name || t("Walk-in Customer")}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        {order.user__full_name || "-"} · {order.payment_status || "-"}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-slate-950">{money(order.total)}</p>
                  </Link>
                ))
              ) : (
                <div className="py-10 text-center text-sm font-medium text-slate-500">
                  {t("No recent orders found.")}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Leaderboard
            title={t("Best Customers")}
            description={t("Top customers by visible sales amount.")}
            empty={t("No customer sales found for this period.")}
            rows={bestCustomers.map((customer: any) => ({
              id: customer.customer_id,
              name: customer.customer__full_name || t("Walk-in Customer"),
              helper: `${customer.order_count || 0} ${t("orders")}`,
              value: money(customer.total_spent),
            }))}
          />
          <Leaderboard
            title={t("Best Cashiers")}
            description={t("Top cashiers by billed sales amount.")}
            empty={t("No cashier sales found for this period.")}
            rows={bestCashiers.map((cashier: any) => ({
              id: cashier.user_id,
              name: cashier.user__full_name || t("Cashier"),
              helper: `${cashier.order_count || 0} ${t("orders")}`,
              value: money(cashier.total_sales),
            }))}
          />
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{t("My Stats Today")}</h2>
            <p className="text-sm text-slate-500">{t("Personal cashier statistics for today.")}</p>
            {cashierStats ? (
              <div className="mt-4 grid gap-3">
                <ShiftMetric label={t("Today Orders")} value={cashierStats.today_orders || 0} helper={`${cashierStats.total_orders || 0} ${t("total")}`} />
                <ShiftMetric label={t("Today Sales")} value={money(cashierStats.today_sales)} helper={`${money(cashierStats.total_sales)} ${t("total")}`} />
                <ShiftMetric label={t("Today Refunds")} value={money(cashierStats.today_refunds)} helper={`${money(cashierStats.total_refunds)} ${t("total")}`} />
                <ShiftMetric label={t("New Customers")} value={cashierStats.today_customers || 0} helper={`${cashierStats.total_customers || 0} ${t("total")}`} />
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm font-medium text-slate-500">
                {t("No cashier stats found.")}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardPageShell>
  )
}

function ShiftMetric({ label, value, helper }: { label: string; value: any; helper?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p> : null}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-slate-950">{value}</p>
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  helper,
}: {
  href: string
  icon: any
  title: string
  helper: string
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-slate-50 p-3 hover:bg-white">
      <div className="rounded-md bg-white p-2 text-slate-700 shadow-sm">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-950">{title}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{helper}</p>
      </div>
      <ArrowRight className="size-4 text-slate-400 group-hover:text-slate-700" />
    </Link>
  )
}

function Leaderboard({
  title,
  description,
  empty,
  rows,
}: {
  title: string
  description: string
  empty: string
  rows: Array<{ id: any; name: string; helper: string; value: string }>
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="text-sm text-slate-500">{description}</p>
      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={`${row.id || row.name}-${index}`} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{row.name}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{row.helper}</p>
              </div>
              <p className="shrink-0 font-bold text-slate-950">{row.value}</p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm font-medium text-slate-500">
            {empty}
          </div>
        )}
      </div>
    </section>
  )
}
