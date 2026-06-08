"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { usePermissions } from "@/hooks/use-permissions"
import { payments } from "@/lib/api/payments"
import { sales } from "@/lib/api/sales"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-amber-50 text-amber-700",
  unpaid: "bg-rose-50 text-rose-700",
  refunded: "bg-sky-50 text-sky-700",
  partially_refunded: "bg-indigo-50 text-indigo-700",
  hold: "bg-gray-100 text-gray-700",
  void: "bg-zinc-200 text-zinc-700",
}

type ReturnLine = {
  sale_item_id: number
  product_name: string
  refundable_quantity: number
  quantity: string
  unit_price: string
  condition: string
  note: string
}

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

const buildReturnLines = (items: any[] = []): ReturnLine[] =>
  items
    .filter((item) => Number(item.refundable_quantity || 0) > 0)
    .map((item) => ({
      sale_item_id: Number(item.id),
      product_name: item.product__name || `Item #${item.id}`,
      refundable_quantity: Number(item.refundable_quantity || 0),
      quantity: "",
      unit_price: String(item.unit_price || 0),
      condition: "good",
      note: "",
    }))

export default function SaleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const loadKeyRef = useRef("")

  const { hasPermission } = usePermissions()
  const canRefundOrder = hasPermission(PERMISSIONS.special.refundOrder)

  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [returnType, setReturnType] = useState("refund")
  const [refundPaymentType, setRefundPaymentType] = useState("cash-payment")
  const [exchangeSaleId, setExchangeSaleId] = useState("")
  const [returnNote, setReturnNote] = useState("")
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([])

  const [getSaleById, saleState] = (sales as any).useGetSaleByIdMutation()
  const [createSaleReturn, createReturnState] = (
    sales as any
  ).useCreateSaleReturnMutation()
  const [getPaymentTypesDropdown, paymentTypesState] = (
    payments as any
  ).useGetPaymentTypesDropdownMutation()

  useEffect(() => {
    if (!id) return
    if (loadKeyRef.current === id) return
    loadKeyRef.current = id
    getSaleById({ id })
  }, [getSaleById, id])

  const sale = saleState.data?.data
  const paymentTypeOptions = paymentTypesState.data?.data || []
  const refundableItems = useMemo(
    () =>
      (sale?.items || []).filter(
        (item: any) => Number(item.refundable_quantity || 0) > 0
      ),
    [sale?.items]
  )

  useEffect(() => {
    if (!isReturnDialogOpen) return
    getPaymentTypesDropdown()
    setReturnLines(buildReturnLines(sale?.items || []))
  }, [getPaymentTypesDropdown, isReturnDialogOpen, sale?.items])

  const selectedReturnItems = useMemo(
    () => returnLines.filter((line) => money(line.quantity) > 0),
    [returnLines]
  )

  const estimatedReturnTotal = useMemo(
    () =>
      selectedReturnItems.reduce(
        (sum, line) => sum + money(line.quantity) * money(line.unit_price),
        0
      ),
    [selectedReturnItems]
  )

  const resetReturnForm = () => {
    setReturnType("refund")
    setRefundPaymentType("cash-payment")
    setExchangeSaleId("")
    setReturnNote("")
    setReturnLines(buildReturnLines(sale?.items || []))
  }

  const openReturnDialog = () => {
    resetReturnForm()
    setIsReturnDialogOpen(true)
  }

  const updateReturnLine = (
    saleItemId: number,
    field: keyof Omit<ReturnLine, "sale_item_id" | "product_name" | "refundable_quantity">,
    value: string
  ) => {
    setReturnLines((current) =>
      current.map((line) =>
        line.sale_item_id === saleItemId ? { ...line, [field]: value } : line
      )
    )
  }

  const handleSubmitReturn = async () => {
    if (!selectedReturnItems.length) {
      showToast.error("Enter return quantity for at least one item.")
      return
    }

    if (returnType === "refund" && !refundPaymentType) {
      showToast.error("Choose refund payment type.")
      return
    }

    const payLoad: any = {
      return_type: returnType,
      payment_type: returnType === "refund" ? refundPaymentType : undefined,
      exchange_sale_id:
        returnType === "exchange" && exchangeSaleId
          ? Number(exchangeSaleId)
          : undefined,
      note: returnNote,
      items: selectedReturnItems.map((line) => ({
        sale_item_id: line.sale_item_id,
        quantity: String(line.quantity),
        unit_price: String(line.unit_price),
        condition: line.condition,
        note: line.note,
      })),
    }

    const response = await createSaleReturn({ id, payLoad }).unwrap()
    showToast.success(response?.message || "Return processed successfully.")
    setIsReturnDialogOpen(false)
    await getSaleById({ id })
  }

  if (saleState.isLoading && !sale) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          Loading sale details...
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-gray-600">
            Sale details not found.
          </p>
          <Button variant="outline" onClick={() => router.push("/sales/history")}>
            Back to Sales History
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12 rounded-2xl"
              onClick={() => router.push("/sales/history")}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Sale {sale.code}
              </h1>
              <p className="text-sm text-slate-500">
                Review billed items, payments, coupons and return history.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canRefundOrder && refundableItems.length ? (
              <Button onClick={openReturnDialog}>Refund / Exchange</Button>
            ) : null}
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                statusColors[sale.payment_status] || "bg-gray-100 text-gray-700"
              )}
            >
              {String(sale.payment_status || "-").replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Customer
            </p>
            <p className="mt-2 text-base font-bold text-slate-900">
              {sale.customer?.name || "Walk-in customer"}
            </p>
            <p className="text-sm text-slate-500">{sale.customer?.phone || "-"}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total
            </p>
            <p className="mt-2 text-base font-bold text-slate-900">
              {formatMoney(sale.total)}
            </p>
            <p className="text-sm text-slate-500">
              Paid {formatMoney(sale.totals_summary?.paid_amount)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Due Amount
            </p>
            <p className="mt-2 text-base font-bold text-slate-900">
              {formatMoney(sale.due_amount)}
            </p>
            <p className="text-sm text-slate-500">
              Change {formatMoney(sale.change_amount)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Refunded
            </p>
            <p className="mt-2 text-base font-bold text-slate-900">
              {formatMoney(sale.totals_summary?.refunded_amount)}
            </p>
            <p className="text-sm text-slate-500">
              {sale.refunds?.length || 0} return(s)
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">Sale Items</h2>
          </div>
          <div className="overflow-x-auto px-4 py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Refunded</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sale.items || []).map((item: any) => (
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
                    <TableCell>{item.refunded_quantity}</TableCell>
                    <TableCell>{item.refundable_quantity}</TableCell>
                    <TableCell>{formatMoney(item.unit_price)}</TableCell>
                    <TableCell>{formatMoney(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Payments</h2>
            </div>
            <div className="space-y-3 px-6 py-5">
              {(sale.payments || []).length ? (
                sale.payments.map((payment: any) => (
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
                      Ref: {payment.reference_number || "-"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No payments recorded.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Applied Coupons</h2>
            </div>
            <div className="space-y-3 px-6 py-5">
              {(sale.applied_coupons || []).length ? (
                sale.applied_coupons.map((coupon: any) => (
                  <div
                    key={coupon.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{coupon.code}</p>
                      <p className="font-bold text-slate-900">
                        {formatMoney(coupon.discount_amount)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {String(coupon.type || "-").replaceAll("_", " ")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No coupon used on this sale.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Return History</h2>
        </div>
        <div className="overflow-x-auto px-4 py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sale.refunds || []).length ? (
                sale.refunds.map((refund: any) => (
                  <TableRow key={refund.id}>
                    <TableCell>#{refund.id}</TableCell>
                    <TableCell className="capitalize">
                      {String(refund.return_type || "-").replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="capitalize">
                      {String(refund.return_status || "-").replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>{refund.cashier__full_name || "-"}</TableCell>
                    <TableCell>{formatMoney(refund.total)}</TableCell>
                    <TableCell>{refund.note || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    No returns recorded for this sale.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              Choose refund, credit note or exchange and enter return quantities.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <UniFieldSelect
              label="Return Type"
              value={returnType}
              onValueChange={setReturnType}
            >
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="credit_note">Credit Note</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
            </UniFieldSelect>

            {returnType === "refund" ? (
              <UniFieldSelect
                label="Refund Payment Type"
                value={refundPaymentType}
                onValueChange={setRefundPaymentType}
                placeholder="Choose payment type"
              >
                {paymentTypeOptions.map((payment: any) => (
                  <SelectItem
                    key={payment.value || payment.identifier}
                    value={payment.value || payment.identifier}
                  >
                    {payment.label}
                  </SelectItem>
                ))}
              </UniFieldSelect>
            ) : null}

            {returnType === "exchange" ? (
              <UniFieldInput
                label="Exchange Sale ID"
                value={exchangeSaleId}
                onChange={(event) => setExchangeSaleId(event.target.value)}
                placeholder="Optional linked sale id"
                type="number"
              />
            ) : null}

            <UniFieldInput
              label="Note"
              value={returnNote}
              onChange={(event) => setReturnNote(event.target.value)}
              placeholder="Return note"
            />
          </div>

          <div className="max-h-[420px] overflow-auto rounded-2xl border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Return Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnLines.length ? (
                  returnLines.map((line) => (
                    <TableRow key={line.sale_item_id}>
                      <TableCell className="font-semibold text-slate-900">
                        {line.product_name}
                      </TableCell>
                      <TableCell>{line.refundable_quantity}</TableCell>
                      <TableCell className="min-w-32">
                        <UniFieldInput
                          value={line.quantity}
                          onChange={(event) =>
                            updateReturnLine(
                              line.sale_item_id,
                              "quantity",
                              event.target.value
                            )
                          }
                          placeholder="0"
                          type="number"
                          min={0}
                          max={line.refundable_quantity}
                        />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <UniFieldInput
                          value={line.unit_price}
                          onChange={(event) =>
                            updateReturnLine(
                              line.sale_item_id,
                              "unit_price",
                              event.target.value
                            )
                          }
                          placeholder="0"
                          type="number"
                          prefix="₹"
                        />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <UniFieldSelect
                          value={line.condition}
                          onValueChange={(value) =>
                            updateReturnLine(line.sale_item_id, "condition", value)
                          }
                        >
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                        </UniFieldSelect>
                      </TableCell>
                      <TableCell className="min-w-48">
                        <UniFieldInput
                          value={line.note}
                          onChange={(event) =>
                            updateReturnLine(
                              line.sale_item_id,
                              "note",
                              event.target.value
                            )
                          }
                          placeholder="Item note"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No refundable items remaining.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Selected Items: {selectedReturnItems.length}
              </p>
              <p className="text-xs text-slate-500">
                Estimated return total without tax split preview.
              </p>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {formatMoney(estimatedReturnTotal)}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReturnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReturn}
              disabled={createReturnState.isLoading || !returnLines.length}
            >
              {createReturnState.isLoading ? "Processing..." : "Submit Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
