"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/confirm-dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { usePermissions } from "@/hooks/use-permissions"
import { payments } from "@/lib/api/payments"
import { sales } from "@/lib/api/sales"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
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
  order_void: "bg-zinc-200 text-zinc-700",
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

const statusLabelKeys: Record<string, string> = {
  hold: "Hold",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  void: "Voided",
  order_void: "Voided",
  due: "Due",
  partially_due: "Due With Payment",
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  completed: "Completed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  good: "Good",
  damaged: "Damaged",
  refund: "Refund",
  credit_note: "Credit Note",
  exchange: "Exchange",
}

const getStatusLabel = (value: any, t: (key: string) => string) => {
  const key = String(value || "").trim()
  return key ? t(statusLabelKeys[key] || key.replaceAll("_", " ")) : "-"
}

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
  const { t } = useTranslation()
  const { confirm, confirmDialog } = useConfirmDialog()
  const posOptions = usePosOptions()
  const currencyIndicator =
    posOptions.currency_preferred === "iso"
      ? posOptions.currency_iso
      : posOptions.currency_symbol
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const getPrintedDocumentUrl = (saleId: number | string) => {
    const documentType = posOptions.printing_document === "invoice" ? "invoice" : "receipt"
    return documentType === "invoice"
      ? `/sales/${saleId}/receipt?doc=invoice`
      : `/sales/${saleId}/receipt`
  }

  const { hasPermission } = usePermissions()
  const canRefundOrder = hasPermission(PERMISSIONS.special.refundOrder)
  const canVoidSale = hasPermission(PERMISSIONS.sales.void)
  const canDeleteSale = hasPermission(PERMISSIONS.sales.delete)
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
  const [deleteSales, deleteSalesState] = (sales as any).useDeleteSalesMutation()
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
      showToast.error(t("Enter return quantity for at least one item."))
      return
    }
    const invalidLine = selectedReturnItems.find(
      (line) => money(line.quantity) > line.refundable_quantity
    )
    if (invalidLine) {
      showToast.error(
        t("Return quantity exceeds available quantity for {product}.").replace(
          "{product}",
          invalidLine.product_name
        )
      )
      return
    }

    if ((returnType === "refund" || returnType === "exchange") && !refundPaymentType) {
      showToast.error(t("Choose refund payment type."))
      return
    }
    if (returnType === "exchange" && !exchangeSaleId) {
      showToast.error(t("Enter exchange sale id."))
      return
    }

    const payLoad: any = {
      return_type: returnType,
      payment_type:
        returnType === "refund" || returnType === "exchange"
          ? refundPaymentType
          : undefined,
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
    showToast.success(response?.message || t("Return processed successfully."))
    setIsReturnDialogOpen(false)
    await getSaleById({ id })
  }

  const handleVoidSale = async () => {
    const ok = await confirm({
      title: t("Confirm Your Action"),
      description: t("The current order will be void. This action will be recorded. Consider providing a reason for this operation"),
      confirmLabel: t("Void"),
      cancelLabel: t("Cancel"),
    })
    if (!ok) return
    const response = await voidSale({
      id,
      payLoad: { note: "Voided from sale details." },
    }).unwrap()
    showToast.success(response?.message || t("Sale voided successfully."))
    await getSaleById({ id })
  }

  const handleDeleteSale = async () => {
    const ok = await confirm({
      title: t("Confirm Your Action"),
      description: t("Would you like to delete this order"),
      confirmLabel: t("Delete"),
      cancelLabel: t("Cancel"),
    })
    if (!ok) return
    const response = await deleteSales({ ids: [id] }).unwrap()
    showToast.success(response?.message || t("The order has been deleted."))
    router.push("/sales")
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
      showToast.error(t("Enter at least one due payment."))
      return
    }

    const response = await collectSaleDue({
      id,
      payLoad: {
        payments,
        note: dueNote,
      },
    }).unwrap()
    showToast.success(response?.message || t("Due collected successfully."))
    setIsCollectDueDialogOpen(false)
    await getSaleById({ id })
  }

  const handleUpdateProcessing = async (value: string) => {
    setProcessingStatus(value)
    const response = await updateSaleProcessing({
      id,
      payLoad: { status: value },
    }).unwrap()
    showToast.success(response?.message || t("Processing status updated."))
    await getSaleById({ id })
  }

  const handleUpdateDelivery = async (value: string) => {
    setDeliveryStatus(value)
    const response = await updateSaleDelivery({
      id,
      payLoad: { status: value },
    }).unwrap()
    showToast.success(response?.message || t("Delivery status updated."))
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
      showToast.error(t("Add at least one installment line."))
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
    showToast.success(response?.message || t("Installments saved successfully."))
    setIsInstallmentDialogOpen(false)
    await getSaleById({ id })
  }

  const handlePayInstallment = async () => {
    if (!installmentTarget) return
    if (money(installmentPaymentAmount) <= 0) {
      showToast.error(t("Enter installment payment amount."))
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
    showToast.success(response?.message || t("Installment paid successfully."))
    setIsInstallmentPayDialogOpen(false)
    setInstallmentTarget(null)
    await getSaleById({ id })
  }

  if (saleState.isLoading && !sale) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading sale details...")}
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-gray-600">
            {t("Sale details not found.")}
          </p>
          <Button variant="outline" onClick={() => router.push("/sales")}>
            {t("Back to Sales History")}
          </Button>
        </div>
      </div>
    )
  }

  const paymentStatus = String(sale.payment_status || "")
  const canShowPaymentsTab = ![
    "order_void",
    "void",
    "hold",
    "refunded",
    "partially_refunded",
  ].includes(paymentStatus)
  const canShowRefundTab = ![
    "order_void",
    "void",
    "hold",
    "refunded",
  ].includes(paymentStatus)
  const canShowInstallmentsTab =
    ["partially_paid", "unpaid"].includes(paymentStatus) &&
    Boolean(sale.support_instalments)
  const canShowVoidAction =
    canVoidSale && ["paid", "partially_paid", "unpaid"].includes(paymentStatus)
  const canShowDeleteAction = canDeleteSale && paymentStatus === "hold"
  const canShowCollectDueAction =
    canCollectDue && canShowPaymentsTab && Number(sale.due_amount || 0) > 0
  const canShowRefundAction =
    canRefundOrder && canShowRefundTab && refundableItems.length > 0

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
              onClick={() => router.push("/sales")}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t("Order Options")} {sale.code}
              </h1>
              <p className="text-sm text-slate-500">
                {t("Review billed items, payments, coupons and return history.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(getPrintedDocumentUrl(sale.id))}
            >
              <Printer className="size-4" />
              {t("Print")}
            </Button>
            {canShowVoidAction ? (
              <Button
                variant="outline"
                onClick={handleVoidSale}
                disabled={voidSaleState.isLoading}
              >
                {voidSaleState.isLoading ? t("Voiding...") : t("Void")}
              </Button>
            ) : null}
            {canShowDeleteAction ? (
              <Button
                variant="destructive"
                onClick={handleDeleteSale}
                disabled={deleteSalesState.isLoading}
              >
                <Trash2 className="size-4" />
                {deleteSalesState.isLoading ? t("Deleting...") : t("Delete")}
              </Button>
            ) : null}
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                statusColors[sale.payment_status] || "bg-gray-100 text-gray-700"
              )}
            >
              {getStatusLabel(sale.payment_status, t)}
            </span>
          </div>
        </div>

        <Tabs defaultValue="details" className="gap-0">
          <div className="border-b border-gray-100 px-6 pt-4">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="details">{t("Details")}</TabsTrigger>
              {canShowPaymentsTab ? (
                <TabsTrigger value="payments">{t("Payments")}</TabsTrigger>
              ) : null}
              {canShowRefundTab ? (
                <TabsTrigger value="refund">{t("Refund & Return")}</TabsTrigger>
              ) : null}
              {canShowInstallmentsTab ? (
                <TabsTrigger value="installments">{t("Instalments")}</TabsTrigger>
              ) : null}
            </TabsList>
          </div>

          <TabsContent value="details" className="space-y-6 px-6 py-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("Customer")}
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">
                  {sale.customer?.name || t("Walk-in Customer")}
                </p>
                <p className="text-sm text-slate-500">{sale.customer?.phone || "-"}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("Total")}
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">
                  {formatMoney(sale.total)}
                </p>
                <p className="text-sm text-slate-500">
                  {t("Paid")} {formatMoney(sale.totals_summary?.paid_amount)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("Due Amount")}
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">
                  {formatMoney(sale.due_amount)}
                </p>
                <p className="text-sm text-slate-500">
                  {t("Change")} {formatMoney(sale.change_amount)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("Refunded")}
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">
                  {formatMoney(sale.totals_summary?.refunded_amount)}
                </p>
                <p className="text-sm text-slate-500">
                  {String(t("{count} return(s)")).replace("{count}", String(sale.refunds?.length || 0))}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <UniFieldSelect
                label={t("Processing Status")}
                value={processingStatus || "none"}
                onValueChange={(value) =>
                  handleUpdateProcessing(value === "none" ? "" : value)
                }
                disabled={!canUpdateSale || updateProcessingState.isLoading}
              >
                <SelectItem value="none">{t("Not Set")}</SelectItem>
                <SelectItem value="pending">{t("Pending")}</SelectItem>
                <SelectItem value="processing">{t("Processing")}</SelectItem>
                <SelectItem value="ready">{t("Ready")}</SelectItem>
                <SelectItem value="completed">{t("Completed")}</SelectItem>
              </UniFieldSelect>

              <UniFieldSelect
                label={t("Delivery Status")}
                value={deliveryStatus || "none"}
                onValueChange={(value) =>
                  handleUpdateDelivery(value === "none" ? "" : value)
                }
                disabled={!canUpdateSale || updateDeliveryState.isLoading}
              >
                <SelectItem value="none">{t("Not Set")}</SelectItem>
                <SelectItem value="pending">{t("Pending")}</SelectItem>
                <SelectItem value="packed">{t("Packed")}</SelectItem>
                <SelectItem value="shipped">{t("Shipped")}</SelectItem>
                <SelectItem value="delivered">{t("Delivered")}</SelectItem>
              </UniFieldSelect>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
              <section className="rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900">{t("Products")}</h2>
                </div>
                <div className="overflow-x-auto px-4 py-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Product")}</TableHead>
                        <TableHead>{t("Qty")}</TableHead>
                        <TableHead>{t("Refunded")}</TableHead>
                        <TableHead>{t("Remaining")}</TableHead>
                        <TableHead>{t("Rate")}</TableHead>
                        <TableHead>{t("Total")}</TableHead>
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
                                {t("SKU")}: {item.product__sku || "-"}
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

              <section className="rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900">{t("Applied Coupons")}</h2>
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
                          {getStatusLabel(coupon.type, t)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{t("No coupon used on this sale.")}</p>
                  )}
                </div>
              </section>
            </div>
          </TabsContent>

          {canShowPaymentsTab ? (
            <TabsContent value="payments" className="space-y-4 px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t("Payments")}</h2>
                  <p className="text-sm text-slate-500">
                    {t("Payments recorded for this order.")}
                  </p>
                </div>
                {canShowCollectDueAction ? (
                  <Button variant="outline" onClick={openCollectDueDialog}>
                    {t("Collect Due")}
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                        {t("Reference")}: {payment.reference_number || "-"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                    {t("No payments recorded.")}
                  </div>
                )}
              </div>
            </TabsContent>
          ) : null}

          {canShowRefundTab ? (
            <TabsContent value="refund" className="space-y-4 px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t("Refund & Return")}</h2>
                  <p className="text-sm text-slate-500">
                    {t("Refundable items and return history for this order.")}
                  </p>
                </div>
                {canShowRefundAction ? (
                  <Button onClick={openReturnDialog}>{t("Refund & Return")}</Button>
                ) : null}
              </div>
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Return ID")}</TableHead>
                      <TableHead>{t("Type")}</TableHead>
                      <TableHead>{t("Status")}</TableHead>
                      <TableHead>{t("Cashier")}</TableHead>
                      <TableHead>{t("Total")}</TableHead>
                      <TableHead>{t("Note")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sale.refunds || []).length ? (
                      sale.refunds.map((refund: any) => (
                        <TableRow key={refund.id}>
                          <TableCell>#{refund.id}</TableCell>
                          <TableCell className="capitalize">
                            {getStatusLabel(refund.return_type, t)}
                          </TableCell>
                          <TableCell className="capitalize">
                            {getStatusLabel(refund.return_status, t)}
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
                          {t("No returns recorded for this sale.")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ) : null}

          {canShowInstallmentsTab ? (
            <TabsContent value="installments" className="space-y-4 px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t("Instalments")}</h2>
                  <p className="text-sm text-slate-500">
                    {t("Payment schedule and installment collections for this sale.")}
                  </p>
                </div>
                {canUpdateSale && Number(sale.due_amount || 0) > 0 ? (
                  <Button type="button" variant="outline" onClick={openInstallmentDialog}>
                    {installmentPlan ? t("Update Instalments") : t("Create Instalments")}
                  </Button>
                ) : null}
              </div>
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Due Date")}</TableHead>
                      <TableHead>{t("Amount")}</TableHead>
                      <TableHead>{t("Paid")}</TableHead>
                      <TableHead>{t("Remaining")}</TableHead>
                      <TableHead>{t("Status")}</TableHead>
                      <TableHead>{t("Action")}</TableHead>
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
                            {getStatusLabel(line.installment_status, t)}
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
                                {t("Pay")}
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
                          {t("No installments created for this sale.")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("Refund & Return")}</DialogTitle>
            <DialogDescription>
              {t("Choose refund, credit note or exchange and enter return quantities.")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <UniFieldSelect
              label={t("Return Type")}
              value={returnType}
              onValueChange={setReturnType}
            >
              <SelectItem value="refund">{t("Refund")}</SelectItem>
              <SelectItem value="credit_note">{t("Credit Note")}</SelectItem>
              <SelectItem value="exchange">{t("Exchange")}</SelectItem>
            </UniFieldSelect>

            {returnType === "refund" || returnType === "exchange" ? (
              <UniFieldSelect
                label={returnType === "exchange" ? t("Difference Refund Type") : t("Refund Payment Type")}
                value={refundPaymentType}
                onValueChange={setRefundPaymentType}
                placeholder={t("Choose payment type")}
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
                label={t("Exchange Sale ID")}
                value={exchangeSaleId}
                onChange={(event) => setExchangeSaleId(event.target.value)}
                placeholder={t("Linked sale id")}
                type="number"
              />
            ) : null}

            <UniFieldInput
              label={t("Note")}
              value={returnNote}
              onChange={(event) => setReturnNote(event.target.value)}
              placeholder={t("Return note")}
            />
          </div>

          <div className="max-h-[420px] overflow-auto rounded-2xl border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Product")}</TableHead>
                  <TableHead>{t("Available")}</TableHead>
                  <TableHead>{t("Return Qty")}</TableHead>
                  <TableHead>{t("Unit Price")}</TableHead>
                  <TableHead>{t("Condition")}</TableHead>
                  <TableHead>{t("Note")}</TableHead>
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
                            {t("Max")}
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
                          prefix={currencyIndicator}
                        />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <UniFieldSelect
                          value={line.condition}
                          onValueChange={(value) =>
                            updateReturnLine(line.sale_item_id, "condition", value)
                          }
                        >
                          <SelectItem value="good">{t("Good")}</SelectItem>
                          <SelectItem value="damaged">{t("Damaged")}</SelectItem>
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
                          placeholder={t("Item note")}
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
                      {t("No refundable items remaining.")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {t("Selected Items")}: {selectedReturnItems.length}
              </p>
              <p className="text-xs text-slate-500">
                {t("Estimated return total without tax split preview.")}
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
              {t("Cancel")}
            </Button>
            <Button
              onClick={handleSubmitReturn}
              disabled={createReturnState.isLoading || !returnLines.length}
            >
              {createReturnState.isLoading ? t("Processing...") : t("Submit Return")}
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
            <DialogTitle>{t("Collect Due")}</DialogTitle>
            <DialogDescription>
              {t("Add one or more payments to reduce the remaining due amount.")}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t("Remaining Due")}</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(sale.due_amount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">{t("Entered Payment")}</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(dueCollectedAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{t("Payments")}</p>
              <Button type="button" variant="outline" size="sm" onClick={addDuePaymentRow}>
                {t("Add Payment")}
              </Button>
            </div>

            {duePayments.map((row, index) => (
              <div
                key={row.id}
                className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_140px_44px]">
                  <UniFieldSelect
                    label={index === 0 ? t("Payment Type") : undefined}
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
                    label={index === 0 ? t("Amount") : undefined}
                    value={row.amount}
                    onChange={(event) =>
                      updateDuePaymentRow(row.id, "amount", event.target.value)
                    }
                    placeholder="0.00"
                    prefix={currencyIndicator}
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
                      <span className="sr-only">{t("Remove payment")}</span>
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
                    placeholder={t("Reference number")}
                  />
                  <UniFieldInput
                    value={row.note}
                    onChange={(event) =>
                      updateDuePaymentRow(row.id, "note", event.target.value)
                    }
                    placeholder={t("Payment note")}
                  />
                </div>
              </div>
            ))}
          </div>

          <UniFieldInput
            label={t("Collection Note")}
            value={dueNote}
            onChange={(event) => setDueNote(event.target.value)}
            placeholder={t("Optional note")}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCollectDueDialogOpen(false)}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleCollectDue} disabled={collectDueState.isLoading}>
              {collectDueState.isLoading ? t("Collecting...") : t("Collect Due")}
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
            <DialogTitle>{t("Save Instalments")}</DialogTitle>
            <DialogDescription>
              {t("Create payment schedule lines for the current due amount.")}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t("Current Due")}</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(sale.due_amount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{t("Installment Lines")}</p>
              <Button type="button" variant="outline" size="sm" onClick={addInstallmentLine}>
                {t("Add Line")}
              </Button>
            </div>

            {installmentLines.map((line, index) => (
              <div
                key={line.id}
                className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-[1fr_1fr_44px]"
              >
                <UniFieldInput
                  label={index === 0 ? t("Due Date") : undefined}
                  type="date"
                  value={line.due_date}
                  onChange={(event) =>
                    updateInstallmentLine(line.id, "due_date", event.target.value)
                  }
                />
                <UniFieldInput
                  label={index === 0 ? t("Amount") : undefined}
                  value={line.amount}
                  onChange={(event) =>
                    updateInstallmentLine(line.id, "amount", event.target.value)
                  }
                  placeholder="0.00"
                  prefix={currencyIndicator}
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
                    <span className="sr-only">{t("Remove installment line")}</span>
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
              {t("Cancel")}
            </Button>
            <Button
              onClick={handleCreateInstallments}
              disabled={createInstallmentsState.isLoading}
            >
              {createInstallmentsState.isLoading ? t("Saving...") : t("Save Instalments")}
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
            <DialogTitle>{t("Pay Instalment")}</DialogTitle>
            <DialogDescription>
              {t("Record payment against the selected installment line.")}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("Due Date")}</span>
              <span className="font-semibold text-slate-900">
                {installmentTarget?.due_date || "-"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">{t("Remaining")}</span>
              <span className="font-semibold text-slate-900">
                {formatMoney(
                  money(installmentTarget?.amount) - money(installmentTarget?.paid_amount)
                )}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <UniFieldSelect
              label={t("Payment Type")}
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
              label={t("Amount")}
              value={installmentPaymentAmount}
              onChange={(event) => setInstallmentPaymentAmount(event.target.value)}
              placeholder="0.00"
              prefix={currencyIndicator}
              type="number"
            />
            <UniFieldInput
              label={t("Note")}
              value={installmentPaymentNote}
              onChange={(event) => setInstallmentPaymentNote(event.target.value)}
              placeholder={t("Optional note")}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInstallmentPayDialogOpen(false)}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handlePayInstallment} disabled={payInstallmentState.isLoading}>
              {payInstallmentState.isLoading ? t("Paying...") : t("Pay Instalment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  )
}
