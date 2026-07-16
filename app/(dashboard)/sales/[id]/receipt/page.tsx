"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useTranslation } from "@/lib/contexts/TranslationContext"
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
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 rounded-2xl"
            onClick={() => router.push(`/sales/${order.id}`)}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{documentTitle}</h1>
            <p className="text-sm text-slate-500">
              {t("Order")} {order.code} {t("printable document")}.
            </p>
          </div>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          {t("print")}
        </Button>
      </div>

      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-4 print:shadow-none">
        <div className="border-b border-dashed border-gray-200 pb-6 text-center">
          <h2 className="text-3xl font-bold text-slate-950">NEXT POS</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {documentSubtitle}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
          {t("Receipt Code")}: {order.code}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatBusinessDateTime(receipt.created_at || order.created_at, posOptions)}
          </p>
        </div>

        <div className="grid gap-4 border-b border-dashed border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("Customer")}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {receipt.customer?.name || order.customer?.name || t("Walk-in Customer")}
            </p>
            <p className="text-sm text-slate-500">{receipt.customer?.phone || order.customer?.phone || "-"}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("Order Type")}
            </p>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
              {order.order_type === "takeaway"
                ? t("Take Away")
                : formatLabel(order.order_type)}
            </p>
            <p className="text-sm text-slate-500">
              {t("Status")}: {t(order.payment_status) !== order.payment_status ? t(order.payment_status) : formatLabel(order.payment_status)}
            </p>
          </div>
        </div>

        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Item")}</TableHead>
                <TableHead>{t("Qty")}</TableHead>
                <TableHead>{t("Rate")}</TableHead>
                <TableHead className="text-right">{t("Total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(receipt.items || []).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.product__name || item.sale_item__product__name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("SKU")}: {item.product__sku || item.sale_item__product__sku || "-"}
                        {item.unit__name ? ` · ${t("Unit")}: ${item.unit__name}` : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatMoney(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2 border-t border-dashed border-gray-200 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("Subtotal")}</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.subtotal ?? order.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("Discount")}</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(
                Number(receipt.discount_amount ?? order.discount_amount ?? 0) +
                  Number(receipt.coupon_discount_amount ?? order.coupon_discount_amount ?? 0)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("Tax")}</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.tax_amount ?? order.tax_amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("Shipping")}</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.shipping_amount ?? receipt.shipping ?? order.shipping_amount ?? order.shipping)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-lg">
            <span className="font-bold text-slate-900">{t("Grand Total")}</span>
            <span className="font-bold text-slate-900">
              {formatMoney(receipt.total ?? order.total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("Received")}</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(order.tendered_amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("Change")}</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(order.change_amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("Due")}</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(order.due_amount)}
            </span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 pt-6">
          <p className="text-sm font-semibold text-slate-900">{t("Payments")}</p>
          <div className="mt-3 space-y-2">
            {(receipt.payments || []).map((payment: any) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="capitalize text-slate-500">
                  {t(payment.payment_type) !== payment.payment_type ? t(payment.payment_type) : formatLabel(payment.payment_type)}
                </span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(payment.amount)}
                </span>
              </div>
            ))}
            {!(receipt.payments || []).length ? (
              <p className="text-sm text-slate-500">{t("No payment recorded.")}</p>
            ) : null}
          </div>
        </div>

        {(receipt.applied_coupons || []).length ? (
          <div className="mt-6 border-t border-dashed border-gray-200 pt-6">
            <p className="text-sm font-semibold text-slate-900">{t("Coupons")}</p>
            <div className="mt-3 space-y-2">
              {(receipt.applied_coupons || []).map((coupon: any) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-500">{coupon.code}</span>
                  <span className="font-semibold text-slate-900">
                    -{formatMoney(coupon.discount_amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 border-t border-dashed border-gray-200 pt-5 text-center">
          <p className="text-sm font-bold text-slate-900">
            {t("Thank you")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {t("Please keep this receipt.")}
          </p>
        </div>
      </div>
    </div>
  )
}
