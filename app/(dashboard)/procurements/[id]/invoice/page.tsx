"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"

const formatLabel = (value: any) =>
  String(value || "-").replaceAll("_", " ").replaceAll("-", " ")

const statusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-amber-50 text-amber-700",
  unpaid: "bg-rose-50 text-rose-700",
}

export default function PurchaseInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)
  const id = params.id as string
  const [getPurchaseOrderById, purchaseOrder] = (
    purchases as any
  ).useGetPurchaseOrderByIdMutation()

  useEffect(() => {
    getPurchaseOrderById({ id })
  }, [getPurchaseOrderById, id])

  const order = purchaseOrder.data?.data

  if (purchaseOrder.isLoading && !order) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading procurement invoice...")}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-gray-600">
            {t("Procurement invoice not found.")}
          </p>
          <Button variant="outline" onClick={() => router.push("/procurements")}>
            {t("Return to Procurements")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardPage padding="none">
      <div className="print:bg-white print:pb-0 flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="flex items-center justify-between print:hidden z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.push("/procurements")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {t("Procurement Invoice")} {order.code}
              </h1>
              <p className="text-sm text-slate-500">
                {t("Review procured items, payments and procurement status.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                statusColors[order.payment_status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {t(order.payment_status) !== order.payment_status ? t(order.payment_status) : formatLabel(order.payment_status)}
            </span>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" />
              {t("print")}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm print:mt-0 print:max-w-none print:rounded-none print:border-0 print:p-4 print:shadow-none">
            {/* Document Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-blue-600">NEXT POS</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {t("Procurement Invoice")}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm font-bold text-slate-900">
                  {t("Invoice No")}: <span className="text-blue-600">{order.code}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t("Date")}: {formatDate(order.order_date)}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 capitalize">
                    {t(order.payment_status) !== order.payment_status ? t(order.payment_status) : formatLabel(order.payment_status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Provider & Details */}
            <div className="grid gap-6 border-b border-slate-100 py-6 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("Provider / Supplier")}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    {order.supplier?.name || "-"}
                  </p>
                  {order.supplier?.phone && (
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-400">{t("Phone")}:</span> {order.supplier?.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="md:text-right">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("Procurement Details")}
                </h3>
                <div className="mt-2 space-y-1 md:inline-block md:text-left">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-400">{t("Delivery Status")}:</span>{" "}
                    <span className="font-bold text-slate-800 capitalize">
                      {formatLabel(order.workflow_status)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-400">{t("Expected Date")}:</span>{" "}
                    <span>{formatDate(order.expected_date)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="py-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50/50">
                    <TableHead className="font-bold text-slate-700">{t("Product")}</TableHead>
                    <TableHead className="text-center font-bold text-slate-700">{t("Quantity")}</TableHead>
                    <TableHead className="text-center font-bold text-slate-700">{t("Received")}</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">{t("Purchase Price")}</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">{t("Tax")}</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">{t("Total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items || []).map((item: any) => (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="py-4">
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.product__name || item.name}
                          </p>
                          {item.barcode && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {t("Barcode")}: {item.barcode}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-800">{item.ordered_quantity}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-800">{item.received_quantity}</TableCell>
                      <TableCell className="text-right font-medium text-slate-600">{formatMoney(item.cost_price)}</TableCell>
                      <TableCell className="text-right font-medium text-slate-600">{formatMoney(item.tax_amount)}</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">{formatMoney(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals & Payments */}
            <div className="mt-4 grid gap-8 border-t border-slate-200 pt-6 md:grid-cols-2">
              {/* Left Side: Payments */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{t("Payments")}</h3>
                  <div className="mt-3 space-y-2">
                    {(order.payments || []).map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0"
                      >
                        <div>
                          <span className="capitalize text-slate-800 font-bold block">
                            {t(payment.payment_type) !== payment.payment_type ? t(payment.payment_type) : formatLabel(payment.payment_type)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {payment.paid_at || "-"} · {t("Ref")}: {payment.reference_number || "-"}
                          </span>
                        </div>
                        <span className="font-bold text-slate-800">
                          {formatMoney(payment.amount)}
                        </span>
                      </div>
                    ))}
                    {!(order.payments || []).length ? (
                      <p className="text-sm text-slate-400 italic">{t("No payment recorded.")}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right Side: Totals Summary */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
                  <span>{t("Grand Total")}</span>
                  <span>{formatMoney(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-slate-100">
                  <span>{t("Paid")}</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(order.paid_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{t("Due")}</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(order.due_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPage>
  )
}
