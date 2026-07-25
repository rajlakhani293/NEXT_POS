"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { sales } from "@/lib/api/sales"
import { formatBusinessDateTime, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"

const formatLabel = (value: any) =>
  String(value || "-").replaceAll("_", " ").replaceAll("-", " ")

const statusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-amber-50 text-amber-700",
  unpaid: "bg-rose-50 text-rose-700",
  refunded: "bg-sky-50 text-sky-700",
  partially_refunded: "bg-indigo-50 text-indigo-700",
  hold: "bg-gray-100 text-gray-700",
  void: "bg-zinc-200 text-zinc-700",
  order_void: "bg-zinc-200 text-zinc-700",
}

export default function SaleReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const id = params.id as string
  const documentType = searchParams.get("doc") || "receipt"
  const refundId = searchParams.get("refund_id")
  const loadKeyRef = useRef("")

  const [getSaleReceipt, receiptState] = (sales as any).useGetSaleReceiptMutation()
  const [getSaleInvoice, invoiceState] = (sales as any).useGetSaleInvoiceMutation()
  const [getSaleRefundReceipt, refundReceiptState] = (sales as any).useGetSaleRefundReceiptMutation()

  useEffect(() => {
    if (!id) return
    const loadKey = `${documentType}:${id}:${refundId || ""}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey
    if (documentType === "invoice") {
      getSaleInvoice({ id })
      return
    }
    if (documentType === "refund" && refundId) {
      getSaleRefundReceipt({ id: refundId })
      return
    }
    getSaleReceipt({ id })
  }, [documentType, getSaleInvoice, getSaleReceipt, getSaleRefundReceipt, id, refundId])

  const activeState =
    documentType === "invoice"
      ? invoiceState
      : documentType === "refund"
        ? refundReceiptState
        : receiptState
  const receipt = activeState.data?.data
  const order = receipt?.sale_order || receipt
  const documentTitle =
    documentType === "invoice"
      ? t("Invoice")
      : documentType === "refund"
        ? t("Refund Receipt")
        : t("Receipt")
  const documentSubtitle =
    documentType === "invoice"
      ? t("Order Invoice")
      : documentType === "refund"
        ? t("Order Refund Receipt")
        : t("Sale Receipt")

  if (activeState.isLoading && !receipt) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading receipt...")}
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-gray-600">{t("Receipt not found.")}</p>
          <Button variant="outline" onClick={() => router.push("/sales")}>
            {t("Back to Sales History")}
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
              onClick={() => router.push("/sales")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {documentTitle} {order.code}
              </h1>
              <p className="text-sm text-slate-500">
                {t("Review billed items, payments, coupons and return history.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[order.payment_status] || "bg-gray-100 text-gray-700"
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
          {documentType === "invoice" ? (
            <div className="mx-auto w-full max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm print:mt-0 print:max-w-none print:rounded-none print:border-0 print:p-4 print:shadow-none">
              {/* Document Header */}
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-blue-600">NEXT POS</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {documentSubtitle}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {t("Invoice No")}: <span className="text-blue-600">{order.code}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("Date")}: {formatBusinessDateTime(receipt.created_at || order.created_at, posOptions)}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 capitalize">
                      {t(order.payment_status) !== order.payment_status ? t(order.payment_status) : formatLabel(order.payment_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Order Details */}
              <div className="grid gap-6 border-b border-slate-100 py-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("Billed To")}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      {receipt.customer?.name || order.customer?.name || t("Walk-in Customer")}
                    </p>
                    {(receipt.customer?.phone || order.customer?.phone) && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-400">{t("Phone")}:</span> {receipt.customer?.phone || order.customer?.phone}
                      </p>
                    )}
                    {(receipt.customer?.email || order.customer?.email) && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-400">{t("Email")}:</span> {receipt.customer?.email || order.customer?.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="md:text-right">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("Order Details")}
                  </h3>
                  <div className="mt-2 space-y-1 md:inline-block md:text-left">
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-400">{t("Order Type")}:</span>{" "}
                      <span className="font-bold text-slate-800 capitalize">
                        {order.order_type === "takeaway"
                          ? t("Take Away")
                          : formatLabel(order.order_type)}
                      </span>
                    </p>
                    {order.author_username && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-400">{t("Served By")}:</span> {order.author_username}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="py-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 bg-slate-50/50">
                      <TableHead className="font-bold text-slate-700">{t("Item")}</TableHead>
                      <TableHead className="text-center font-bold text-slate-700">{t("Qty")}</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">{t("Rate")}</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">{t("Total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(receipt.items || []).map((item: any) => (
                      <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="py-4">
                          <div>
                            <p className="font-bold text-slate-900">
                              {item.product__name || item.sale_item__product__name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {t("SKU")}: {item.product__sku || item.sale_item__product__sku || "-"}
                              {item.unit__name ? ` · ${t("Unit")}: ${item.unit__name}` : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-800">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium text-slate-600">{formatMoney(item.unit_price)}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">{formatMoney(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals & Payments */}
              <div className="mt-4 grid gap-8 border-t border-slate-200 pt-6 md:grid-cols-2">
                {/* Left Side: Payments & Coupons info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{t("Payments")}</h3>
                    <div className="mt-3 space-y-2">
                      {(receipt.payments || []).map((payment: any) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="capitalize text-slate-500 font-medium">
                            {t(payment.payment_type) !== payment.payment_type ? t(payment.payment_type) : formatLabel(payment.payment_type)}
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatMoney(payment.amount)}
                          </span>
                        </div>
                      ))}
                      {!(receipt.payments || []).length ? (
                        <p className="text-sm text-slate-400 italic">{t("No payment recorded.")}</p>
                      ) : null}
                    </div>
                  </div>

                  {(receipt.applied_coupons || []).length ? (
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{t("Coupons")}</h3>
                      <div className="mt-3 space-y-2">
                        {(receipt.applied_coupons || []).map((coupon: any) => (
                          <div
                            key={coupon.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{coupon.code}</span>
                            <span className="font-bold text-slate-800">
                              -{formatMoney(coupon.discount_amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right Side: Totals Summary */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t("Subtotal")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(receipt.subtotal ?? order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t("Discount")}</span>
                    <span className="font-semibold text-slate-900">
                      -{formatMoney(
                        Number(receipt.discount_amount ?? order.discount_amount ?? 0) +
                        Number(receipt.coupon_discount_amount ?? order.coupon_discount_amount ?? 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t("Tax")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(receipt.tax_amount ?? order.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t("Shipping")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(receipt.shipping_amount ?? receipt.shipping ?? order.shipping_amount ?? order.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
                    <span>{t("Grand Total")}</span>
                    <span>{formatMoney(receipt.total ?? order.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-slate-100">
                    <span>{t("Received")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(order.tendered_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t("Change")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(order.change_amount)}
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

              {/* Footer */}
              <div className="mt-12 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm font-bold text-slate-800">
                  {t("Thank you for shopping with us!")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("Please retain this copy for your records.")}
                </p>
              </div>
            </div>
          ) : (
            /* ========================================================
               RECEIPT LAYOUT (Thermal slip 80mm compact design)
               ======================================================== */
            <div className="mx-auto mt-6 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm print:mt-0 print:max-w-none print:rounded-none print:border-0 print:p-2 print:shadow-none">
              {/* Header */}
              <div className="border-b border-dashed border-slate-300 pb-4 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">NEXT POS</h2>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {documentSubtitle}
                </p>
                <div className="mt-3 space-y-0.5 text-xs text-slate-500">
                  <p className="font-bold text-slate-800">{t("Order")}: {order.code}</p>
                  <p>{formatBusinessDateTime(receipt.created_at || order.created_at, posOptions)}</p>
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 uppercase">
                    {t(order.payment_status) !== order.payment_status ? t(order.payment_status) : formatLabel(order.payment_status)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="border-b border-dashed border-slate-300 py-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">{t("Customer")}:</span>
                  <span className="font-bold text-slate-900">{receipt.customer?.name || order.customer?.name || t("Walk-in Customer")}</span>
                </div>
                {(receipt.customer?.phone || order.customer?.phone) && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">{t("Phone")}:</span>
                    <span className="font-semibold text-slate-800">{receipt.customer?.phone || order.customer?.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">{t("Order Type")}:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {order.order_type === "takeaway"
                      ? t("Take Away")
                      : formatLabel(order.order_type)}
                  </span>
                </div>
                {order.author_username && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">{t("Cashier")}:</span>
                    <span className="font-semibold text-slate-800">{order.author_username}</span>
                  </div>
                )}
              </div>

              {/* Simple Compact Table */}
              <div className="py-4">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-dashed border-slate-300 font-bold text-slate-700">
                      <th className="pb-2">{t("Item")}</th>
                      <th className="pb-2 text-center w-12">{t("Qty")}</th>
                      <th className="pb-2 text-right w-24">{t("Price")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-100">
                    {(receipt.items || []).map((item: any) => (
                      <tr key={item.id} className="text-slate-800">
                        <td className="py-2.5 pr-2">
                          <p className="font-bold text-slate-900">{item.product__name || item.sale_item__product__name}</p>
                          {(item.product__sku || item.sale_item__product__sku) && (
                            <p className="text-[10px] text-slate-400">
                              {t("SKU")}: {item.product__sku || item.sale_item__product__sku}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 text-center font-semibold">{item.quantity}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{t("Subtotal")}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(receipt.subtotal ?? order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t("Discount")}</span>
                  <span className="font-semibold text-slate-900">
                    -{formatMoney(
                      Number(receipt.discount_amount ?? order.discount_amount ?? 0) +
                      Number(receipt.coupon_discount_amount ?? order.coupon_discount_amount ?? 0)
                    )}
                  </span>
                </div>
                {Number(receipt.tax_amount ?? order.tax_amount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{t("Tax")}</span>
                    <span className="font-semibold text-slate-900">{formatMoney(receipt.tax_amount ?? order.tax_amount)}</span>
                  </div>
                )}
                {Number(receipt.shipping_amount ?? receipt.shipping ?? order.shipping_amount ?? order.shipping) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{t("Shipping")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(receipt.shipping_amount ?? receipt.shipping ?? order.shipping_amount ?? order.shipping)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 text-sm font-bold text-slate-900">
                  <span>{t("Grand Total")}</span>
                  <span>{formatMoney(receipt.total ?? order.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1.5">
                  <span>{t("Received")}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(order.tendered_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t("Change")}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(order.change_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t("Due")}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(order.due_amount)}</span>
                </div>
              </div>

              {/* Payments */}
              {(receipt.payments || []).length > 0 && (
                <div className="border-t border-dashed border-slate-300 mt-3 pt-3 text-xs">
                  <p className="font-bold text-slate-800 mb-2">{t("Payments")}</p>
                  <div className="space-y-1.5">
                    {(receipt.payments || []).map((payment: any) => (
                      <div key={payment.id} className="flex justify-between text-slate-600">
                        <span className="capitalize">
                          {t(payment.payment_type) !== payment.payment_type ? t(payment.payment_type) : formatLabel(payment.payment_type)}
                        </span>
                        <span className="font-bold text-slate-900">{formatMoney(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupons */}
              {(receipt.applied_coupons || []).length > 0 && (
                <div className="border-t border-dashed border-slate-300 mt-3 pt-3 text-xs">
                  <p className="font-bold text-slate-800 mb-2">{t("Coupons")}</p>
                  <div className="space-y-1.5">
                    {(receipt.applied_coupons || []).map((coupon: any) => (
                      <div key={coupon.id} className="flex justify-between text-slate-600">
                        <span className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{coupon.code}</span>
                        <span className="font-bold text-slate-900">-{formatMoney(coupon.discount_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 border-t border-dashed border-slate-300 pt-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-800">{t("Thank you for shopping with us!")}</p>
                <p>{t("Please keep this receipt.")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  )
}
