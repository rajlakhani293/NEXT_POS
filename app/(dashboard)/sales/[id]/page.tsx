"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ReceiptText } from "lucide-react"

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

type DuePaymentRow = {
  id: string
  payment_type: string
  amount: string
  reference_number: string
  note: string
}

type InstallmentLineForm = {
  id: string
  due_date: string
  amount: string
}

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

const emptyDuePaymentRow = (): DuePaymentRow => ({
  id: crypto.randomUUID(),
  payment_type: "cash-payment",
  amount: "",
  reference_number: "",
  note: "",
})

const emptyInstallmentLine = (): InstallmentLineForm => ({
  id: crypto.randomUUID(),
  due_date: "",
  amount: "",
})

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
  const canVoidSale = hasPermission(PERMISSIONS.sales.void)
  const canCollectDue = hasPermission(PERMISSIONS.payments.collectDue)
  const canUpdateSale = hasPermission(PERMISSIONS.sales.update)
  const canCreatePayment = hasPermission(PERMISSIONS.payments.create)

  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isCollectDueDialogOpen, setIsCollectDueDialogOpen] = useState(false)
  const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false)
  const [isInstallmentPayDialogOpen, setIsInstallmentPayDialogOpen] = useState(false)
  const [returnType, setReturnType] = useState("refund")
  const [refundPaymentType, setRefundPaymentType] = useState("cash-payment")
  const [exchangeSaleId, setExchangeSaleId] = useState("")
  const [returnNote, setReturnNote] = useState("")
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([])
  const [dueNote, setDueNote] = useState("")
  const [duePayments, setDuePayments] = useState<DuePaymentRow[]>([
    emptyDuePaymentRow(),
  ])
  const [processingStatus, setProcessingStatus] = useState("")
  const [deliveryStatus, setDeliveryStatus] = useState("")
  const [installmentLines, setInstallmentLines] = useState<InstallmentLineForm[]>([
    emptyInstallmentLine(),
  ])
  const [installmentTarget, setInstallmentTarget] = useState<any>(null)
  const [installmentPaymentType, setInstallmentPaymentType] = useState("cash-payment")
  const [installmentPaymentAmount, setInstallmentPaymentAmount] = useState("")
  const [installmentPaymentNote, setInstallmentPaymentNote] = useState("")

  const [getSaleById, saleState] = (sales as any).useGetSaleByIdMutation()
  const [createSaleReturn, createReturnState] = (
    sales as any
  ).useCreateSaleReturnMutation()
  const [updateSaleProcessing, updateProcessingState] = (
    sales as any
  ).useUpdateSaleProcessingMutation()
  const [updateSaleDelivery, updateDeliveryState] = (
    sales as any
  ).useUpdateSaleDeliveryMutation()
  const [createSaleInstallments, createInstallmentsState] = (
    sales as any
  ).useCreateSaleInstallmentsMutation()
  const [paySaleInstallment, payInstallmentState] = (
    sales as any
  ).usePaySaleInstallmentMutation()
  const [collectSaleDue, collectDueState] = (
    sales as any
  ).useCollectSaleDueMutation()
  const [voidSale, voidSaleState] = (sales as any).useVoidSaleMutation()
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
  const installmentPlan = sale?.installment_plan
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

  useEffect(() => {
    setProcessingStatus(sale?.process_status || "")
    setDeliveryStatus(sale?.delivery_status || "")
  }, [sale?.process_status, sale?.delivery_status])

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
  const dueCollectedAmount = useMemo(
    () => duePayments.reduce((sum, row) => sum + money(row.amount), 0),
    [duePayments]
  )

  const resetReturnForm = () => {
    setReturnType("refund")
    setRefundPaymentType("cash-payment")
    setExchangeSaleId("")
    setReturnNote("")
    setReturnLines(buildReturnLines(sale?.items || []))
  }

  const resetCollectDueForm = () => {
    setDueNote("")
    setDuePayments([
      {
        ...emptyDuePaymentRow(),
        amount: sale?.due_amount ? String(sale.due_amount) : "",
      },
    ])
  }

  const openReturnDialog = () => {
    resetReturnForm()
    setIsReturnDialogOpen(true)
  }

  const openCollectDueDialog = () => {
    resetCollectDueForm()
    getPaymentTypesDropdown()
    setIsCollectDueDialogOpen(true)
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
    const invalidLine = selectedReturnItems.find(
      (line) => money(line.quantity) > line.refundable_quantity
    )
    if (invalidLine) {
      showToast.error(`Return quantity exceeds available quantity for ${invalidLine.product_name}.`)
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

  const handleVoidSale = async () => {
    const response = await voidSale({
      id,
      payLoad: { note: "Voided from sale details." },
    }).unwrap()
    showToast.success(response?.message || "Sale voided successfully.")
    await getSaleById({ id })
  }

  const updateDuePaymentRow = (
    rowId: string,
    field: keyof Omit<DuePaymentRow, "id">,
    value: string
  ) => {
    setDuePayments((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addDuePaymentRow = () => {
    setDuePayments((current) => [...current, emptyDuePaymentRow()])
  }

  const removeDuePaymentRow = (rowId: string) => {
    setDuePayments((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== rowId)
    )
  }

  const handleCollectDue = async () => {
    const payments = duePayments
      .filter((row) => money(row.amount) > 0)
      .map((row) => ({
        payment_type: row.payment_type,
        amount: String(money(row.amount)),
        reference_number: row.reference_number,
        note: row.note,
      }))

    if (!payments.length) {
      showToast.error("Enter at least one due payment.")
      return
    }

    const response = await collectSaleDue({
      id,
      payLoad: {
        payments,
        note: dueNote,
      },
    }).unwrap()
    showToast.success(response?.message || "Due collected successfully.")
    setIsCollectDueDialogOpen(false)
    await getSaleById({ id })
  }

  const handleUpdateProcessing = async (value: string) => {
    setProcessingStatus(value)
    const response = await updateSaleProcessing({
      id,
      payLoad: { status: value },
    }).unwrap()
    showToast.success(response?.message || "Processing status updated.")
    await getSaleById({ id })
  }

  const handleUpdateDelivery = async (value: string) => {
    setDeliveryStatus(value)
    const response = await updateSaleDelivery({
      id,
      payLoad: { status: value },
    }).unwrap()
    showToast.success(response?.message || "Delivery status updated.")
    await getSaleById({ id })
  }

  const addInstallmentLine = () => {
    setInstallmentLines((current) => [...current, emptyInstallmentLine()])
  }

  const updateInstallmentLine = (
    rowId: string,
    field: keyof Omit<InstallmentLineForm, "id">,
    value: string
  ) => {
    setInstallmentLines((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const removeInstallmentLine = (rowId: string) => {
    setInstallmentLines((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== rowId)
    )
  }

  const openInstallmentDialog = () => {
    setInstallmentLines([emptyInstallmentLine()])
    setIsInstallmentDialogOpen(true)
  }

  const openInstallmentPayDialog = (line: any) => {
    setInstallmentTarget(line)
    const remaining = Math.max(
      money(line.amount) - money(line.paid_amount),
      0
    )
    setInstallmentPaymentAmount(remaining ? String(remaining) : "")
    setInstallmentPaymentNote("")
    setInstallmentPaymentType("cash-payment")
    setIsInstallmentPayDialogOpen(true)
  }

  const handleCreateInstallments = async () => {
    const lines = installmentLines.filter(
      (row) => row.due_date && money(row.amount) > 0
    )
    if (!lines.length) {
      showToast.error("Add at least one installment line.")
      return
    }

    const response = await createSaleInstallments({
      id,
      payLoad: {
        total_installments: lines.length,
        total_amount: String(sale?.due_amount || 0),
        lines: lines.map((line) => ({
          due_date: line.due_date,
          amount: String(money(line.amount)),
        })),
      },
    }).unwrap()
    showToast.success(response?.message || "Installments saved successfully.")
    setIsInstallmentDialogOpen(false)
    await getSaleById({ id })
  }

  const handlePayInstallment = async () => {
    if (!installmentTarget) return
    if (money(installmentPaymentAmount) <= 0) {
      showToast.error("Enter installment payment amount.")
      return
    }

    const response = await paySaleInstallment({
      id,
      installmentId: installmentTarget.id,
      payLoad: {
        amount: String(money(installmentPaymentAmount)),
        payment_type: installmentPaymentType,
        note: installmentPaymentNote,
      },
    }).unwrap()
    showToast.success(response?.message || "Installment paid successfully.")
    setIsInstallmentPayDialogOpen(false)
    setInstallmentTarget(null)
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
            {canCollectDue &&
            Number(sale.due_amount || 0) > 0 &&
            !["void", "refunded"].includes(sale.payment_status) ? (
              <Button variant="outline" onClick={openCollectDueDialog}>
                Collect Due
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => router.push(`/sales/${sale.id}/receipt`)}
            >
              <ReceiptText className="size-4" />
              Receipt
            </Button>
            {canVoidSale &&
            !["void", "refunded", "partially_refunded"].includes(
              sale.payment_status
            ) ? (
              <Button
                variant="outline"
                onClick={handleVoidSale}
                disabled={voidSaleState.isLoading}
              >
                {voidSaleState.isLoading ? "Voiding..." : "Void Sale"}
              </Button>
            ) : null}
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

        <div className="grid gap-4 border-t border-gray-100 px-6 py-6 lg:grid-cols-2">
          <UniFieldSelect
            label="Processing Status"
            value={processingStatus || "none"}
            onValueChange={(value) =>
              handleUpdateProcessing(value === "none" ? "" : value)
            }
            disabled={!canUpdateSale || updateProcessingState.isLoading}
          >
            <SelectItem value="none">Not Set</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </UniFieldSelect>

          <UniFieldSelect
            label="Delivery Status"
            value={deliveryStatus || "none"}
            onValueChange={(value) =>
              handleUpdateDelivery(value === "none" ? "" : value)
            }
            disabled={!canUpdateSale || updateDeliveryState.isLoading}
          >
            <SelectItem value="none">Not Set</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </UniFieldSelect>
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
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Instalments</h2>
            <p className="text-sm text-slate-500">
              Payment schedule and installment collections for this sale.
            </p>
          </div>
          {canUpdateSale && Number(sale.due_amount || 0) > 0 ? (
            <Button type="button" variant="outline" onClick={openInstallmentDialog}>
              {installmentPlan ? "Update Instalments" : "Create Instalments"}
            </Button>
          ) : null}
        </div>
        <div className="overflow-x-auto px-4 py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installmentPlan?.lines?.length ? (
                installmentPlan.lines.map((line: any) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.due_date}</TableCell>
                    <TableCell>{formatMoney(line.amount)}</TableCell>
                    <TableCell>{formatMoney(line.paid_amount)}</TableCell>
                    <TableCell>
                      {formatMoney(money(line.amount) - money(line.paid_amount))}
                    </TableCell>
                    <TableCell className="capitalize">
                      {String(line.installment_status || "-").replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      {canCreatePayment &&
                      money(line.amount) > money(line.paid_amount) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openInstallmentPayDialog(line)}
                        >
                          Pay
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    No installments created for this sale.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

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
                        <div className="flex items-center gap-2">
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateReturnLine(
                                line.sale_item_id,
                                "quantity",
                                String(line.refundable_quantity)
                              )
                            }
                          >
                            Max
                          </Button>
                        </div>
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

      <Dialog
        open={isCollectDueDialogOpen}
        onOpenChange={setIsCollectDueDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Collect Due</DialogTitle>
            <DialogDescription>
              Add one or more payments to reduce the remaining due amount.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Remaining Due</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(sale.due_amount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Entered Payment</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(dueCollectedAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Payments</p>
              <Button type="button" variant="outline" size="sm" onClick={addDuePaymentRow}>
                Add Payment
              </Button>
            </div>

            {duePayments.map((row, index) => (
              <div
                key={row.id}
                className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_140px_44px]">
                  <UniFieldSelect
                    label={index === 0 ? "Payment Type" : undefined}
                    value={row.payment_type}
                    onValueChange={(value) =>
                      updateDuePaymentRow(row.id, "payment_type", value)
                    }
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
                  <UniFieldInput
                    label={index === 0 ? "Amount" : undefined}
                    value={row.amount}
                    onChange={(event) =>
                      updateDuePaymentRow(row.id, "amount", event.target.value)
                    }
                    placeholder="0.00"
                    prefix="₹"
                    type="number"
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeDuePaymentRow(row.id)}
                    >
                      <span className="sr-only">Remove payment</span>
                      x
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <UniFieldInput
                    value={row.reference_number}
                    onChange={(event) =>
                      updateDuePaymentRow(
                        row.id,
                        "reference_number",
                        event.target.value
                      )
                    }
                    placeholder="Reference number"
                  />
                  <UniFieldInput
                    value={row.note}
                    onChange={(event) =>
                      updateDuePaymentRow(row.id, "note", event.target.value)
                    }
                    placeholder="Payment note"
                  />
                </div>
              </div>
            ))}
          </div>

          <UniFieldInput
            label="Collection Note"
            value={dueNote}
            onChange={(event) => setDueNote(event.target.value)}
            placeholder="Optional note"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCollectDueDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCollectDue} disabled={collectDueState.isLoading}>
              {collectDueState.isLoading ? "Collecting..." : "Collect Due"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInstallmentDialogOpen}
        onOpenChange={setIsInstallmentDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Save Instalments</DialogTitle>
            <DialogDescription>
              Create payment schedule lines for the current due amount.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Current Due</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(sale.due_amount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Installment Lines</p>
              <Button type="button" variant="outline" size="sm" onClick={addInstallmentLine}>
                Add Line
              </Button>
            </div>

            {installmentLines.map((line, index) => (
              <div
                key={line.id}
                className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-[1fr_1fr_44px]"
              >
                <UniFieldInput
                  label={index === 0 ? "Due Date" : undefined}
                  type="date"
                  value={line.due_date}
                  onChange={(event) =>
                    updateInstallmentLine(line.id, "due_date", event.target.value)
                  }
                />
                <UniFieldInput
                  label={index === 0 ? "Amount" : undefined}
                  value={line.amount}
                  onChange={(event) =>
                    updateInstallmentLine(line.id, "amount", event.target.value)
                  }
                  placeholder="0.00"
                  prefix="₹"
                  type="number"
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => removeInstallmentLine(line.id)}
                  >
                    <span className="sr-only">Remove installment line</span>
                    x
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInstallmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInstallments}
              disabled={createInstallmentsState.isLoading}
            >
              {createInstallmentsState.isLoading ? "Saving..." : "Save Instalments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInstallmentPayDialogOpen}
        onOpenChange={setIsInstallmentPayDialogOpen}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Pay Instalment</DialogTitle>
            <DialogDescription>
              Record payment against the selected installment line.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Due Date</span>
              <span className="font-semibold text-slate-900">
                {installmentTarget?.due_date || "-"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">Remaining</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(
                  money(installmentTarget?.amount) - money(installmentTarget?.paid_amount)
                )}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <UniFieldSelect
              label="Payment Type"
              value={installmentPaymentType}
              onValueChange={setInstallmentPaymentType}
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
            <UniFieldInput
              label="Amount"
              value={installmentPaymentAmount}
              onChange={(event) => setInstallmentPaymentAmount(event.target.value)}
              placeholder="0.00"
              prefix="₹"
              type="number"
            />
            <UniFieldInput
              label="Note"
              value={installmentPaymentNote}
              onChange={(event) => setInstallmentPaymentNote(event.target.value)}
              placeholder="Optional note"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInstallmentPayDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePayInstallment} disabled={payInstallmentState.isLoading}>
              {payInstallmentState.isLoading ? "Paying..." : "Pay Instalment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
