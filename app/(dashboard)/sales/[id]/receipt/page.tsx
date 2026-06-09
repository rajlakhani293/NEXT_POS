"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"

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
import { sales } from "@/lib/api/sales"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

export default function SaleReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const loadKeyRef = useRef("")

  const [getSaleReceipt, receiptState] = (sales as any).useGetSaleReceiptMutation()

  useEffect(() => {
    if (!id) return
    if (loadKeyRef.current === id) return
    loadKeyRef.current = id
    getSaleReceipt({ id })
  }, [getSaleReceipt, id])

  const receipt = receiptState.data?.data

  if (receiptState.isLoading && !receipt) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          Loading receipt...
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-gray-600">Receipt not found.</p>
          <Button variant="outline" onClick={() => router.push("/sales/history")}>
            Back to Sales History
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
            onClick={() => router.push(`/sales/${receipt.id}`)}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Receipt</h1>
            <p className="text-sm text-slate-500">
              Sale {receipt.code} printable receipt view.
            </p>
          </div>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>

      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="border-b border-dashed border-gray-200 pb-6 text-center">
          <h2 className="text-3xl font-bold text-slate-950">NEXT POS</h2>
          <p className="mt-2 text-sm text-slate-500">Sale Receipt</p>
          <p className="mt-1 text-sm text-slate-700">Sale No: {receipt.code}</p>
        </div>

        <div className="grid gap-4 border-b border-dashed border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Customer
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {receipt.customer?.name || "Walk-in customer"}
            </p>
            <p className="text-sm text-slate-500">{receipt.customer?.phone || "-"}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order Type
            </p>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
              {String(receipt.order_type || "-").replaceAll("_", " ")}
            </p>
            <p className="text-sm text-slate-500">
              Status: {String(receipt.payment_status || "-").replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(receipt.items || []).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.product__name}
                      </p>
                      <p className="text-xs text-slate-500">
                        SKU: {item.product__sku || "-"}
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
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Discount</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(
                Number(receipt.discount_amount || 0) +
                  Number(receipt.coupon_discount_amount || 0)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.tax_amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Shipping</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.shipping_amount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-lg">
            <span className="font-bold text-slate-900">Grand Total</span>
            <span className="font-bold text-slate-900">
              {formatMoney(receipt.total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Received</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.tendered_amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Change</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.change_amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Due</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(receipt.due_amount)}
            </span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 pt-6">
          <p className="text-sm font-semibold text-slate-900">Payments</p>
          <div className="mt-3 space-y-2">
            {(receipt.payments || []).map((payment: any) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="capitalize text-slate-500">
                  {String(payment.payment_type || "-").replaceAll("-", " ")}
                </span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
