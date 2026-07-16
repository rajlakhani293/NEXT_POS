"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"

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
          <Button variant="outline" onClick={() => router.push("/purchases")}>
            {t("Return to Procurements")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-12 rounded-2xl"
            onClick={() => router.push(`/purchases/orders/${id}`)}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("%s - Invoice").replace("%s", order.code || t("Procurement"))}
            </h1>
            <p className="text-sm text-slate-500">
              {t("list of product procured.")}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          {t("Print")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("Provider")}
          </p>
          <p className="mt-2 text-base font-bold text-slate-900">
            {order.supplier?.name || "-"}
          </p>
          <p className="text-sm text-slate-500">{order.supplier?.phone || "-"}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("Total")}
          </p>
          <p className="mt-2 text-base font-bold text-slate-900">
            {formatMoney(order.total)}
          </p>
          <p className="text-sm text-slate-500">{t("Paid")} {formatMoney(order.paid_amount)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("Due")}
          </p>
          <p className="mt-2 text-base font-bold text-slate-900">
            {formatMoney(order.due_amount)}
          </p>
          <p className="text-sm text-slate-500 capitalize">{order.workflow_status}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("Dates")}
          </p>
          <p className="mt-2 text-base font-bold text-slate-900">
            {formatDate(order.order_date)}
          </p>
          <p className="text-sm text-slate-500">
            {t("Expected")} {formatDate(order.expected_date)}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{t("Procurement Products List")}</h2>
        </div>
        <div className="overflow-x-auto px-6 py-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-slate-500">
                <th className="py-3 font-semibold">{t("Product")}</th>
                <th className="py-3 font-semibold">{t("Quantity")}</th>
                <th className="py-3 font-semibold">{t("Received")}</th>
                <th className="py-3 font-semibold">{t("Purchase Price")}</th>
                <th className="py-3 font-semibold">{t("Tax")}</th>
                <th className="py-3 font-semibold">{t("Total")}</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item: any) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-3 font-semibold text-slate-900">
                    {item.product__name}
                  </td>
                  <td className="py-3">{item.ordered_quantity}</td>
                  <td className="py-3">{item.received_quantity}</td>
                  <td className="py-3">{formatMoney(item.cost_price)}</td>
                  <td className="py-3">{formatMoney(item.tax_amount)}</td>
                  <td className="py-3">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{t("Payment History")}</h2>
        </div>
        <div className="space-y-3 px-6 py-5">
          {(order.payments || []).length ? (
            order.payments.map((payment: any) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold capitalize text-slate-900">
                    {String(payment.payment_type || "-").replaceAll("-", " ")}
                  </p>
                  <p className="font-bold text-slate-900">
                    {formatMoney(payment.amount)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {payment.paid_at || "-"} · {t("Ref")}: {payment.reference_number || "-"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">{t("No provider payments recorded.")}</p>
          )}
        </div>
      </section>
    </div>
  )
}
