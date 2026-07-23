"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Banknote, Printer, ReceiptText, Save, Trash2, X } from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { DatePicker } from "@/components/date-picker"
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
import { DashboardPage } from "@/components/dashboard/dashboard-page"

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
  "not-available": "Not Available",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  good: "Good",
  damaged: "Damaged",
  unspoiled: "Unspoiled",
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

const parseStringToDate = (str?: string) => {
  if (!str) return undefined
  const [yyyy, mm, dd] = str.split("-").map(Number)
  return new Date(yyyy, mm - 1, dd)
}

const formatDateToString = (date?: Date) => {
  if (!date) return ""
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const resolvePaidAmount = (sale: any) => {
  const directValue =
    sale?.tendered_amount ??
    sale?.tendered ??
    sale?.totals_summary?.paid_amount
  if (directValue !== undefined && directValue !== null) return money(directValue)
  return (sale?.payments || []).reduce(
    (sum: number, payment: any) => sum + money(payment.value || payment.amount),
    0
  )
}

const resolveUnpaidAmount = (sale: any, paidAmount: number) => {
  if (sale?.payment_status === "paid") return 0
  const directDue = sale?.due_amount ?? sale?.totals_summary?.due_amount
  if (directDue !== undefined && directDue !== null) {
    return Math.max(money(directDue), 0)
  }
  return Math.max(money(sale?.total) - paidAmount, 0)
}

const emptyInstallmentLine = (): InstallmentLineForm => ({
  id: crypto.randomUUID(),
  due_date: "",
  amount: "",
})

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
    const documentType = posOptions.pos_printing_document === "invoice" ? "invoice" : "receipt"
    return documentType === "invoice"
      ? `/sales/${saleId}/receipt?doc=invoice`
      : `/sales/${saleId}/receipt`
  }

  const { hasPermission } = usePermissions()
  const canVoidSale = hasPermission(PERMISSIONS.sales.void)
  const canDeleteSale = hasPermission(PERMISSIONS.sales.delete)
  const canUpdateSale = hasPermission(PERMISSIONS.sales.update)
  const canCreatePayment = hasPermission(PERMISSIONS.payments.create)

  const [isInstallmentPayDialogOpen, setIsInstallmentPayDialogOpen] = useState(false)
  const [isRefundProductDialogOpen, setIsRefundProductDialogOpen] = useState(false)
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false)
  const [voidReason, setVoidReason] = useState("")
  const [refundPaymentType, setRefundPaymentType] = useState("")
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([])
  const [refundProductDraft, setRefundProductDraft] = useState<ReturnLine | null>(null)
  const [refundProductEditIndex, setRefundProductEditIndex] = useState<number | null>(null)
  const [selectedRefundProductId, setSelectedRefundProductId] = useState("")
  const [quickPaymentType, setQuickPaymentType] = useState("")
  const [quickPaymentAmount, setQuickPaymentAmount] = useState("")
  const [processingStatus, setProcessingStatus] = useState("")
  const [deliveryStatus, setDeliveryStatus] = useState("")
  const [showProcessingSelect, setShowProcessingSelect] = useState(false)
  const [showDeliverySelect, setShowDeliverySelect] = useState(false)
  const [installmentLines, setInstallmentLines] = useState<InstallmentLineForm[]>([])
  const [installmentTarget, setInstallmentTarget] = useState<any>(null)
  const [installmentPaymentType, setInstallmentPaymentType] = useState("")
  const [installmentPaymentAmount, setInstallmentPaymentAmount] = useState("")
  const [installmentPaymentNote, setInstallmentPaymentNote] = useState("")
  const [installmentDrafts, setInstallmentDrafts] = useState<Record<string, { due_date: string; amount: string }>>({})

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
  const [updateSaleInstallment, updateInstallmentState] = (
    sales as any
  ).useUpdateSaleInstallmentMutation()
  const [deleteSaleInstallment, deleteInstallmentState] = (
    sales as any
  ).useDeleteSaleInstallmentMutation()
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
    getPaymentTypesDropdown()
  }, [getPaymentTypesDropdown, getSaleById, id])

  const sale = saleState.data?.data
  const paymentTypeOptions = paymentTypesState.data?.data || []
  const installmentPlan = sale?.installment_plan
  useEffect(() => {
    setProcessingStatus(sale?.process_status || "")
    setDeliveryStatus(sale?.delivery_status || "")
  }, [sale?.process_status, sale?.delivery_status])

  useEffect(() => {
    const drafts: Record<string, { due_date: string; amount: string }> = {}
      ; (sale?.installment_plan?.lines || []).forEach((line: any) => {
        drafts[String(line.id)] = {
          due_date: line.due_date || line.date || "",
          amount: String(line.amount || ""),
        }
      })
    setInstallmentDrafts(drafts)
  }, [sale?.installment_plan?.lines])

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
  const paidAmount = resolvePaidAmount(sale)
  const unpaidAmount = resolveUnpaidAmount(sale, paidAmount)
  const paymentLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    paymentTypeOptions.forEach((payment: any) => {
      const key = payment.value || payment.identifier
      if (key) labels[key] = payment.label
    })
    return labels
  }, [paymentTypeOptions])
  const installmentRows = installmentPlan?.lines || []
  const installmentTotal = useMemo(
    () =>
      [...installmentRows, ...installmentLines].reduce(
        (sum, line: any) => sum + money(line.amount),
        0
      ),
    [installmentRows, installmentLines]
  )
  const installmentRemaining = Math.max(money(sale?.total) - installmentTotal, 0)

  const resetReturnForm = () => {
    setRefundPaymentType("")
    setSelectedRefundProductId("")
    setReturnLines([])
  }

  const openRefundProductDialog = () => {
    if (!selectedRefundProductId) {
      showToast.error(t("Please select a product before proceeding."))
      return
    }
    const item = (sale?.items || []).find(
      (product: any) => String(product.id) === String(selectedRefundProductId)
    )
    if (!item || Number(item.refundable_quantity || 0) <= 0) {
      showToast.error(t("Not enough quantity to proceed."))
      return
    }
    const usedQuantity = returnLines
      .filter((line) => String(line.sale_item_id) === String(item.id))
      .reduce((sum, line) => sum + money(line.quantity), 0)
    const remaining = Number(item.refundable_quantity || 0) - usedQuantity
    if (remaining <= 0) {
      showToast.error(t("Not enough quantity to proceed."))
      return
    }
    setRefundProductDraft({
      sale_item_id: Number(item.id),
      product_name: item.product__name || `Item #${item.id}`,
      refundable_quantity: remaining,
      quantity: String(remaining),
      unit_price: String(item.unit_price || 0),
      condition: "unspoiled",
      note: "",
    })
    setRefundProductEditIndex(null)
    setIsRefundProductDialogOpen(true)
    setSelectedRefundProductId("")
  }

  const openEditRefundProductDialog = (line: ReturnLine, index: number) => {
    setRefundProductDraft({ ...line })
    setRefundProductEditIndex(index)
    setIsRefundProductDialogOpen(true)
  }

  const saveRefundProductDraft = () => {
    if (!refundProductDraft) return
    if (money(refundProductDraft.unit_price) < 0) {
      showToast.error(t("Please provide a valid value"))
      return
    }
    const line = {
      ...refundProductDraft,
      quantity: refundProductDraft.quantity || String(refundProductDraft.refundable_quantity),
      note: refundProductDraft.note || "",
      condition: refundProductDraft.condition || "unspoiled",
    }
    setReturnLines((current) => {
      if (refundProductEditIndex === null) return [...current, line]
      return current.map((item, index) =>
        index === refundProductEditIndex ? line : item
      )
    })
    setIsRefundProductDialogOpen(false)
    setRefundProductDraft(null)
    setRefundProductEditIndex(null)
  }

  const removeRefundProduct = (index: number) => {
    setReturnLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
  }

  const updateReturnLineByIndex = (
    index: number,
    field: keyof Omit<ReturnLine, "sale_item_id" | "product_name" | "refundable_quantity">,
    value: string
  ) => {
    setReturnLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    )
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

    if (!refundPaymentType) {
      showToast.error(t("Choose refund payment type."))
      return
    }

    const payLoad: any = {
      return_type: "refund",
      payment_type: refundPaymentType,
      note: "",
      total: String(estimatedReturnTotal),
      items: selectedReturnItems.map((line) => ({
        sale_item_id: line.sale_item_id,
        quantity: String(line.quantity),
        unit_price: String(line.unit_price),
        condition: line.condition,
        note: line.note,
        description: line.note,
      })),
    }

    const response = await createSaleReturn({ id, payLoad }).unwrap()
    showToast.success(response?.message || t("Return processed successfully."))
    resetReturnForm()
    await getSaleById({ id })
  }

  const handleVoidSale = async () => {
    setVoidReason("")
    setIsVoidDialogOpen(true)
  }

  const submitVoidSale = async () => {
    const response = await voidSale({
      id,
      payLoad: { reason: voidReason, note: voidReason },
    }).unwrap()
    showToast.success(response?.message || t("Sale voided successfully."))
    setIsVoidDialogOpen(false)
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

  const handleUpdateProcessing = async (value: string) => {
    const previous = sale?.process_status || ""
    const ok = await confirm({
      title: t("Would you proceed ?"),
      description: t("The processing status of the order will be changed. Please confirm your action."),
      confirmLabel: t("Save"),
      cancelLabel: t("Cancel"),
    })
    if (!ok) {
      setProcessingStatus(previous)
      setShowProcessingSelect(false)
      return
    }
    setProcessingStatus(value)
    const response = await updateSaleProcessing({
      id,
      payLoad: { status: value },
    }).unwrap()
    showToast.success(response?.message || t("Processing status updated."))
    setShowProcessingSelect(false)
    await getSaleById({ id })
  }

  const handleUpdateDelivery = async (value: string) => {
    const previous = sale?.delivery_status || ""
    const ok = await confirm({
      title: t("Would you proceed ?"),
      description: t("The delivery status of the order will be changed. Please confirm your action."),
      confirmLabel: t("Save"),
      cancelLabel: t("Cancel"),
    })
    if (!ok) {
      setDeliveryStatus(previous)
      setShowDeliverySelect(false)
      return
    }
    setDeliveryStatus(value)
    const response = await updateSaleDelivery({
      id,
      payLoad: { status: value },
    }).unwrap()
    showToast.success(response?.message || t("Delivery status updated."))
    setShowDeliverySelect(false)
    await getSaleById({ id })
  }

  const handleQuickPayment = async () => {
    const value = money(quickPaymentAmount)
    if (!quickPaymentType) {
      showToast.error(t("Please select a payment gateway before proceeding."))
      return
    }
    if (value <= 0) {
      showToast.error(t("Please provide a valid value"))
      return
    }
    const ok = await confirm({
      title: t("Confirm Your Action"),
      description: t("You make a payment for {amount}. A payment can't be canceled. Would you like to proceed ?").replace(
        "{amount}",
        formatMoney(value)
      ),
      confirmLabel: t("Proceed"),
      cancelLabel: t("Cancel"),
    })
    if (!ok) return
    const response = await collectSaleDue({
      id,
      payLoad: {
        payments: [
          {
            payment_type: quickPaymentType,
            amount: String(value),
            reference_number: "",
            note: "",
          },
        ],
        note: "",
      },
    }).unwrap()
    showToast.success(response?.message || t("Payment saved successfully."))
    setQuickPaymentAmount("")
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
    setInstallmentLines((current) => current.filter((row) => row.id !== rowId))
  }

  const openInstallmentPayDialog = (line: any) => {
    setInstallmentTarget(line)
    const remaining = Math.max(
      money(line.amount) - money(line.paid_amount),
      0
    )
    setInstallmentPaymentAmount(remaining ? String(remaining) : "")
    setInstallmentPaymentNote("")
    setInstallmentPaymentType("")
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
    setInstallmentLines([])
    await getSaleById({ id })
  }

  const handleUpdateInstallment = async (line: any) => {
    const draft = installmentDrafts[String(line.id)] || {
      due_date: line.due_date || line.date,
      amount: String(line.amount || ""),
    }
    const ok = await confirm({
      title: t("Confirm Your Action"),
      description: t("Would you like to update that instalment ?"),
      confirmLabel: t("Save"),
      cancelLabel: t("Cancel"),
    })
    if (!ok) return
    const response = await updateSaleInstallment({
      id,
      installmentId: line.id,
      payLoad: {
        due_date: draft.due_date,
        date: draft.due_date,
        amount: String(money(draft.amount)),
      },
    }).unwrap()
    showToast.success(response?.message || t("Instalment updated successfully."))
    await getSaleById({ id })
  }

  const handleDeleteInstallment = async (line: any) => {
    const ok = await confirm({
      title: t("Confirm Your Action"),
      description: t("Would you like to delete this instalment ?"),
      confirmLabel: t("Delete"),
      cancelLabel: t("Cancel"),
      variant: "destructive",
    })
    if (!ok) return
    const response = await deleteSaleInstallment({
      id,
      installmentId: line.id,
    }).unwrap()
    showToast.success(response?.message || t("Instalment deleted successfully."))
    await getSaleById({ id })
  }

  const handlePayInstallment = async () => {
    if (!installmentTarget) return
    if (!installmentPaymentType) {
      showToast.error(t("Please select a payment gateway before proceeding."))
      return
    }
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
    sale.support_instalments !== false
  const canShowVoidAction =
    canVoidSale && ["paid", "partially_paid", "unpaid"].includes(paymentStatus)
  const canShowDeleteAction = canDeleteSale && paymentStatus === "hold"
  return (
    <DashboardPage padding="none">
      <div className="flex h-[calc(100vh-84px)] min-h-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-2">
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
                  {t("Order Options")} {sale.code}
                </h1>
                <p className="text-sm text-slate-500">
                  {t("Review billed items, payments, coupons and return history.")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

          <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b border-gray-100 px-6 pt-4">
              <TabsList variant="line" className="w-full justify-start">
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

            <TabsContent value="details" className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="space-y-3">
                  <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                    {t("Payment Summary")}
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      [t("Sub Total"), sale.subtotal],
                      [
                        `${t("Discount")}${sale.discount_type === "percentage"
                          ? ` (${sale.discount_percentage}%)`
                          : sale.discount_type === "flat"
                            ? ` (${t("Flat")})`
                            : ""
                        }`,
                        sale.discount,
                      ],
                      [t("Shipping"), sale.shipping],
                      [t("Coupons"), sale.total_coupons],
                      [t("Total"), sale.total],
                      [t("Taxes"), sale.tax_value || sale.tax_amount],
                      [t("Change"), sale.change],
                      [t("Paid"), paidAmount],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="flex items-center justify-between border border-gray-200 bg-white px-3 py-2"
                      >
                        <span className="font-semibold text-slate-800">{label}</span>
                        <span className="font-semibold text-slate-600">
                          {formatMoney(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                    {t("Order Status")}
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border border-gray-200 bg-white px-3 py-2">
                      <span className="font-semibold text-slate-800">{t("Customer")}</span>
                      <span className="font-semibold text-slate-600">
                        {sale.customer?.name ||
                          `${sale.customer?.first_name || ""} ${sale.customer?.last_name || ""}`.trim() ||
                          t("Walk-in Customer")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border border-gray-200 bg-white px-3 py-2">
                      <span className="font-semibold text-slate-800">{t("Type")}</span>
                      <span className="font-semibold capitalize text-slate-600">
                        {getStatusLabel(sale.type || sale.order_type, t)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border border-gray-200 bg-white px-3 py-2">
                      <span className="font-semibold text-slate-800">{t("Delivery Status")}</span>
                      {!showDeliverySelect ? (
                        <button
                          type="button"
                          className="border-b border-dashed border-gray-900 font-semibold capitalize text-slate-600"
                          onClick={() => setShowDeliverySelect(true)}
                          disabled={!canUpdateSale}
                        >
                          {getStatusLabel(deliveryStatus || sale.delivery_status, t)}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UniFieldSelect
                            value={deliveryStatus}
                            onValueChange={setDeliveryStatus}
                            containerClassName="w-40"
                          >
                            <SelectItem value="not-available">{t("Not Available")}</SelectItem>
                            <SelectItem value="pending">{t("Pending")}</SelectItem>
                            <SelectItem value="packed">{t("Packed")}</SelectItem>
                            <SelectItem value="shipped">{t("Shipped")}</SelectItem>
                            <SelectItem value="delivered">{t("Delivered")}</SelectItem>
                          </UniFieldSelect>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setDeliveryStatus(sale.delivery_status || "")
                              setShowDeliverySelect(false)
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => handleUpdateDelivery(deliveryStatus)}
                            disabled={updateDeliveryState.isLoading}
                          >
                            <Save className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 border border-gray-200 bg-white px-3 py-2">
                      <span className="font-semibold text-slate-800">{t("Processing Status")}</span>
                      {!showProcessingSelect ? (
                        <button
                          type="button"
                          className="border-b border-dashed border-gray-900 font-semibold capitalize text-slate-600"
                          onClick={() => setShowProcessingSelect(true)}
                          disabled={!canUpdateSale}
                        >
                          {getStatusLabel(processingStatus || sale.process_status, t)}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UniFieldSelect
                            value={processingStatus}
                            onValueChange={setProcessingStatus}
                            containerClassName="w-40"
                          >
                            <SelectItem value="not-available">{t("Not Available")}</SelectItem>
                            <SelectItem value="pending">{t("Pending")}</SelectItem>
                            <SelectItem value="processing">{t("Processing")}</SelectItem>
                            <SelectItem value="ready">{t("Ready")}</SelectItem>
                            <SelectItem value="completed">{t("Completed")}</SelectItem>
                          </UniFieldSelect>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setProcessingStatus(sale.process_status || "")
                              setShowProcessingSelect(false)
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => handleUpdateProcessing(processingStatus)}
                            disabled={updateProcessingState.isLoading}
                          >
                            <Save className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border border-gray-200 bg-white px-3 py-2">
                      <span className="font-semibold text-slate-800">{t("Payment Status")}</span>
                      <span className="font-semibold capitalize text-slate-600">
                        {getStatusLabel(sale.payment_status, t)}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                    {t("Products")}
                  </h2>
                  <div className="space-y-3">
                    {(sale.items || []).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between border border-gray-200 bg-white p-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.product__name || item.name} (x{item.quantity})
                          </p>
                          <p className="text-sm text-slate-500">
                            {item.unit__name || item.unit_name || item.unit?.name || "N/A"}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-600">
                          {formatMoney(item.total || item.total_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                    <h2 className="text-base font-semibold text-slate-700">
                      {t("Refunded Products")}
                    </h2>
                    <button
                      type="button"
                      className="border-b border-dashed border-gray-900 text-sm font-semibold text-slate-700"
                    >
                      {t("All Refunds")}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(sale.refunded_products || []).length ? (
                      sale.refunded_products.map((product: any, index: number) => (
                        <div
                          key={product.id || index}
                          className="flex items-start justify-between border border-gray-200 bg-white p-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {product.order_product?.name || product.name} (x{product.quantity})
                            </p>
                            <p className="text-sm text-slate-500">
                              {product.unit?.name || product.unit_name || "N/A"} |{" "}
                              <span className="capitalize">
                                {getStatusLabel(product.condition, t)}
                              </span>
                            </p>
                          </div>
                          <p className="font-semibold text-slate-600">
                            {formatMoney(product.total_price || product.total)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="border border-dashed border-gray-200 p-6 text-center text-sm text-slate-500">
                        {t("No refunded products.")}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </TabsContent>

            {canShowPaymentsTab ? (
              <TabsContent value="payments" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex h-12 items-center justify-between border border-blue-200 bg-blue-50 px-3 text-lg font-bold text-blue-900">
                    <span>{t("Total")}</span>
                    <span>{formatMoney(sale.total)}</span>
                  </div>
                  <div className="flex h-12 items-center justify-between border border-green-200 bg-green-50 px-3 text-lg font-bold text-green-900">
                    <span>{t("Paid")}</span>
                    <span>{formatMoney(paidAmount)}</span>
                  </div>
                  <div className="flex h-12 items-center justify-between border border-red-200 bg-red-50 px-3 text-lg font-bold text-red-900">
                    <span>{t("Unpaid")}</span>
                    <span>{formatMoney(unpaidAmount)}</span>
                  </div>
                  <div className="flex h-12 items-center justify-between border border-amber-200 bg-amber-50 px-3 text-lg font-bold text-amber-900">
                    <span>{t("Customer Account")}</span>
                    <span>{formatMoney(sale.customer?.account_amount)}</span>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="space-y-3">
                    <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                      {t("Payment")}
                    </h2>
                    {sale.payment_status === "paid" ? (
                      <div className="flex min-h-48 items-center justify-center border border-dashed border-gray-200 text-sm font-semibold text-slate-500">
                        {t("No payment possible for paid order.")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <UniFieldSelect
                          label={t("Select Payment")}
                          value={quickPaymentType || "none"}
                          onValueChange={(value) =>
                            setQuickPaymentType(value === "none" ? "" : value)
                          }
                        >
                          <SelectItem value="none">{t("Choose option")}</SelectItem>
                          {paymentTypeOptions.map((payment: any) => (
                            <SelectItem
                              key={payment.value || payment.identifier}
                              value={payment.value || payment.identifier}
                            >
                              {payment.label}
                            </SelectItem>
                          ))}
                        </UniFieldSelect>
                        <p className="-mt-2 text-xs font-medium text-slate-500">
                          {t("choose the payment type.")}
                        </p>
                        {/* <div className="flex h-12 items-center justify-end border border-gray-200 bg-white px-3">
                          <span className="font-semibold text-slate-700">
                            {formatMoney(quickPaymentAmount)}
                          </span>
                        </div> */}
                        <UniFieldInput
                          label={t("Amount")}
                          value={quickPaymentAmount}
                          onChange={(event) => setQuickPaymentAmount(event.target.value)}
                          placeholder="0.00"
                          prefix={currencyIndicator}
                          type="number"
                        />
                        <Button
                          type="button"
                          className="w-full"
                          onClick={handleQuickPayment}
                          disabled={collectDueState.isLoading}
                        >
                          {collectDueState.isLoading ? t("Saving...") : t("Enter")}
                        </Button>
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                      {t("Payment History")}
                    </h2>
                    {(sale.payments || []).length ? (
                      <div className="space-y-2">
                        {sale.payments.map((payment: any) => {
                          const identifier = payment.identifier || payment.payment_type
                          return (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between border border-gray-200 bg-white p-3"
                            >
                              <span className="flex items-center gap-2 font-semibold text-slate-700">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    router.push(`/sales/${sale.id}/receipt?payment=${payment.id}`)
                                  }
                                >
                                  <ReceiptText className="size-4" />
                                </Button>
                                {paymentLabels[identifier] ||
                                  String(identifier || t("Unknown")).replaceAll("-", " ")}
                              </span>
                              <span className="font-semibold text-slate-700">
                                {formatMoney(payment.value || payment.amount)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 p-8 text-center text-sm text-slate-500">
                        {t("No payments recorded.")}
                      </div>
                    )}
                  </section>
                </div>
              </TabsContent>
            ) : null}

            {canShowRefundTab ? (
              <TabsContent value="refund" className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="space-y-3">
                    <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                      {t("Refund With Products")}
                    </h2>
                    <div className="border border-gray-200 bg-white p-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <UniFieldSelect
                          label={t("Product")}
                          value={selectedRefundProductId || "none"}
                          onValueChange={(value) =>
                            setSelectedRefundProductId(value === "none" ? "" : value)
                          }
                          placeholder={t("Select the product to perform a refund.")}
                        >
                          <SelectItem value="none">{t("Choose option")}</SelectItem>
                          {(sale.items || [])
                            .filter((item: any) => Number(item.refundable_quantity || 0) > 0)
                            .map((item: any) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.product__name || item.name} -{" "}
                                {item.unit__name || item.unit_name || item.unit?.name || "N/A"}{" "}
                                (x{item.refundable_quantity || item.quantity})
                              </SelectItem>
                            ))}
                        </UniFieldSelect>
                        <div className="flex items-end">
                          <Button type="button" variant="outline" onClick={openRefundProductDialog}>
                            {t("Add Product")}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <h3 className="border-b border-gray-900 py-1 text-base font-semibold text-slate-700">
                      {t("Products")}
                    </h3>
                    <div className="space-y-2">
                      {returnLines.length ? (
                        returnLines.map((line, index) => (
                          <div
                            key={`${line.sale_item_id}-${index}`}
                            className="grid gap-3 border border-gray-200 bg-white p-3 md:grid-cols-[1fr_130px_96px_44px_44px]"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {line.product_name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {t("Available")}: {line.refundable_quantity} ·{" "}
                                {getStatusLabel(line.condition, t)}
                              </p>
                            </div>
                            <UniFieldInput
                              value={line.quantity}
                              onChange={(event) =>
                                updateReturnLineByIndex(
                                  index,
                                  "quantity",
                                  event.target.value
                                )
                              }
                              placeholder="0"
                              type="number"
                              min={0}
                              max={line.refundable_quantity}
                            />
                            <div className="flex items-center justify-end font-semibold text-slate-900">
                              {formatMoney(money(line.quantity) * money(line.unit_price))}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => openEditRefundProductDialog(line, index)}
                            >
                              <span className="sr-only">{t("Edit")}</span>
                              ...
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRefundProduct(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="border border-dashed border-gray-200 p-8 text-center text-sm text-slate-500">
                          {t("Please select a product before proceeding.")}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                      {t("Summary")}
                    </h2>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border border-gray-200 bg-white p-3 font-semibold">
                        <span>{t("Total")}</span>
                        <span>{formatMoney(estimatedReturnTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between border border-green-200 bg-green-50 p-3 font-semibold text-green-900">
                        <span>{t("Paid")}</span>
                        <span>{formatMoney(paidAmount)}</span>
                      </div>
                      <UniFieldSelect
                        label={t("Payment Gateway")}
                        value={refundPaymentType || "none"}
                        onValueChange={(value) =>
                          setRefundPaymentType(value === "none" ? "" : value)
                        }
                      >
                        <SelectItem value="none">{t("Choose option")}</SelectItem>
                        {paymentTypeOptions.map((payment: any) => (
                          <SelectItem
                            key={payment.value || payment.identifier}
                            value={payment.value || payment.identifier}
                          >
                            {payment.label}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>
                      <div className="flex items-center justify-between border border-gray-200 bg-white p-3 font-semibold">
                        <span>{t("Screen")}</span>
                        <span>{formatMoney(estimatedReturnTotal)}</span>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSubmitReturn}
                        disabled={createReturnState.isLoading || !returnLines.length}
                        className="w-full"
                      >
                        {createReturnState.isLoading ? t("Processing...") : t("Proceed")}
                      </Button>
                    </div>
                  </section>
                </div>
              </TabsContent>
            ) : null}

            {canShowInstallmentsTab ? (
              <TabsContent value="installments" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6">
                <h2 className="border-b border-gray-900 pb-2 text-base font-semibold text-slate-700">
                  {t("Instalments")}
                </h2>
                <div className="space-y-3">
                  {installmentRows.map((line: any) => {
                    const isPaid = Boolean(line.paid) || money(line.paid_amount) >= money(line.amount)
                    return (
                      <div
                        key={line.id}
                        className={cn(
                          "grid gap-3 border bg-white p-3 md:grid-cols-[1fr_1fr_auto]",
                          isPaid ? "border-green-200 bg-green-50/40" : "border-blue-200 bg-blue-50/30"
                        )}
                      >
                        <DatePicker
                          label={t("Date")}
                          value={parseStringToDate(installmentDrafts[String(line.id)]?.due_date)}
                          onChange={(date) =>
                            setInstallmentDrafts((current) => ({
                              ...current,
                              [String(line.id)]: {
                                due_date: formatDateToString(date),
                                amount:
                                  current[String(line.id)]?.amount || String(line.amount || ""),
                              },
                            }))
                          }
                          disabled={isPaid}
                        />
                        <UniFieldInput
                          label={t("Amount")}
                          value={installmentDrafts[String(line.id)]?.amount || ""}
                          onChange={(event) =>
                            setInstallmentDrafts((current) => ({
                              ...current,
                              [String(line.id)]: {
                                due_date:
                                  current[String(line.id)]?.due_date ||
                                  line.due_date ||
                                  line.date ||
                                  "",
                                amount: event.target.value,
                              },
                            }))
                          }
                          type="number"
                          prefix={currencyIndicator}
                          disabled={isPaid}
                        />
                        <div className="flex items-end gap-2">
                          {!isPaid && canCreatePayment ? (
                            <Button type="button" variant="outline" onClick={() => openInstallmentPayDialog(line)}>
                              <Banknote className="size-4" />
                              {t("Pay")}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (!line.payment_id) {
                                  showToast.error(t("This instalment doesn't have any payment attached."))
                                  return
                                }
                                router.push(`/sales/${sale.id}/receipt?payment=${line.payment_id}`)
                              }}
                            >
                              <Printer className="size-4" />
                              {t("Receipt")}
                            </Button>
                          )}
                          {!isPaid && canUpdateSale ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleUpdateInstallment(line)}
                              disabled={updateInstallmentState.isLoading}
                            >
                              <Save className="size-4" />
                            </Button>
                          ) : null}
                          {!isPaid && canUpdateSale ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleDeleteInstallment(line)}
                              disabled={deleteInstallmentState.isLoading}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                  {installmentLines.map((line) => (
                    <div
                      key={line.id}
                      className="grid gap-3 border border-blue-200 bg-blue-50/30 p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <DatePicker
                        label={t("Date")}
                        value={parseStringToDate(line.due_date)}
                        onChange={(date) =>
                          updateInstallmentLine(line.id, "due_date", formatDateToString(date))
                        }
                      />
                      <UniFieldInput
                        label={t("Amount")}
                        value={line.amount}
                        onChange={(event) =>
                          updateInstallmentLine(line.id, "amount", event.target.value)
                        }
                        placeholder="0.00"
                        prefix={currencyIndicator}
                        type="number"
                      />
                      <div className="flex items-end gap-2">
                        <Button
                          type="button"
                          onClick={() => handleCreateInstallments()}
                          disabled={createInstallmentsState.isLoading}
                        >
                          {createInstallmentsState.isLoading ? t("Saving...") : t("Create")}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => removeInstallmentLine(line.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!installmentRows.length && !installmentLines.length ? (
                    <div className="border border-dashed border-gray-200 p-10 text-center text-sm font-semibold text-slate-500">
                      {t("No installments created for this sale.")}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    <span>
                      {t("Total")} : {formatMoney(sale.total)} ({t("Remaining")} :{" "}
                      {formatMoney(installmentRemaining)})
                    </span>
                    <div className="flex items-center gap-4">
                      <span>
                        {t("Instalments")}: {formatMoney(installmentTotal)}
                      </span>
                      {canUpdateSale ? (
                        <Button type="button" size="sm" onClick={addInstallmentLine}>
                          {t("Add Instalment")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ) : null}
          </Tabs>

          <div className="mt-auto flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <div className="flex items-center gap-2">
              {canShowVoidAction ? (
                <Button
                  variant="destructive"
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
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(getPrintedDocumentUrl(sale.id))}
            >
              <Printer className="size-4" />
              {t("Print")}
            </Button>
          </div>
        </div>

        <Dialog
          open={isRefundProductDialogOpen}
          onOpenChange={(open) => {
            setIsRefundProductDialogOpen(open)
            if (!open) {
              setRefundProductDraft(null)
              setRefundProductEditIndex(null)
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("Products")}</DialogTitle>
            </DialogHeader>
            {refundProductDraft ? (
              <div className="space-y-4">
                <UniFieldInput
                  label={t("Unit Price")}
                  value={refundProductDraft.unit_price}
                  onChange={(event) =>
                    setRefundProductDraft((current) =>
                      current ? { ...current, unit_price: event.target.value } : current
                    )
                  }
                  placeholder="0"
                  prefix={currencyIndicator}
                  type="number"
                />
                <p className="-mt-3 text-xs font-medium text-slate-500">
                  {t("Define what is the unit price of the product.")}
                </p>
                <UniFieldSelect
                  label={t("Condition")}
                  value={refundProductDraft.condition || "unspoiled"}
                  onValueChange={(value) =>
                    setRefundProductDraft((current) =>
                      current ? { ...current, condition: value } : current
                    )
                  }
                >
                  <SelectItem value="unspoiled">{t("Unspoiled")}</SelectItem>
                  <SelectItem value="damaged">{t("Damaged")}</SelectItem>
                </UniFieldSelect>
                <p className="-mt-3 text-xs font-medium text-slate-500">
                  {t("Determine in which condition the product is returned.")}
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {t("Other Observations")}
                  </label>
                  <Textarea
                    value={refundProductDraft.note}
                    onChange={(event) =>
                      setRefundProductDraft((current) =>
                        current ? { ...current, note: event.target.value } : current
                      )
                    }
                    rows={8}
                    placeholder={t("Describe in details the condition of the returned product.")}
                  />
                  <p className="text-xs font-medium text-slate-500">
                    {t("Describe in details the condition of the returned product.")}
                  </p>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" onClick={saveRefundProductDraft}>
                {t("Add Product")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Confirm Your Action")}</DialogTitle>
              <DialogDescription>
                {t("The current order will be void. This action will be recorded. Consider providing a reason for this operation")}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              placeholder={t("Reason")}
              rows={4}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVoidDialogOpen(false)}
              >
                {t("Cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={submitVoidSale}
                disabled={voidSaleState.isLoading}
              >
                {voidSaleState.isLoading ? t("Voiding...") : t("Void")}
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
                value={installmentPaymentType || "none"}
                onValueChange={(value) =>
                  setInstallmentPaymentType(value === "none" ? "" : value)
                }
              >
                <SelectItem value="none">{t("Choose option")}</SelectItem>
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
    </DashboardPage>
  )
}
