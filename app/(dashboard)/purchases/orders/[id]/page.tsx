"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileTextIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { catalog } from "@/lib/api/catalog"
import { payments } from "@/lib/api/payments"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type PurchaseItemForm = {
  id: string
  purchase_item_id?: number
  product_id: string
  ordered_quantity: string
  cost_price: string
  tax_amount: string
  unit_id: string
}

type PurchaseFormValues = {
  supplier_id: string
  code: string
  invoice_reference: string
  order_date: string
  expected_date: string
  workflow_status: string
  discount_amount: string
  shipping_amount: string
  note: string
  automatic_approval: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = (): PurchaseItemForm => ({
  id: crypto.randomUUID(),
  product_id: "",
  ordered_quantity: "",
  cost_price: "",
  tax_amount: "",
  unit_id: "",
})

const initialValues: PurchaseFormValues = {
  supplier_id: "",
  code: "",
  invoice_reference: "",
  order_date: today(),
  expected_date: "",
  workflow_status: "ordered",
  discount_amount: "",
  shipping_amount: "",
  note: "",
  automatic_approval: true,
}

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

export default function PurchaseOrderFormPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: string | number | null | undefined) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const id = params.id as string
  const isEdit = id !== "create"
  const loadKeyRef = useRef("")
  const contentRef = useRef<HTMLDivElement>(null)
  const paginationSentinelRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<PurchaseFormValues>(initialValues)
  const [items, setItems] = useState<PurchaseItemForm[]>([emptyItem()])
  const [receiveItems, setReceiveItems] = useState<Record<string, string>>({})
  const [payment, setPayment] = useState({
    amount: "",
    paid_at: today(),
    payment_type: "cash-payment",
    reference_number: "",
    note: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)

  const [getSuppliersDropdown, suppliers] = (purchases as any).useGetSuppliersDropdownMutation()
  const [getProductsDropdown, products] = (catalog as any).useGetProductsDropdownMutation()
  const [getPaymentTypesDropdown, paymentTypes] = (payments as any).useGetPaymentTypesDropdownMutation()
  const [getUnitsDropdown, units] = (catalog as any).useGetUnitsDropdownMutation()
  const [getProductById] = (catalog as any).useGetProductByIdMutation()
  const [getPurchaseOrderById, purchaseOrder] = (purchases as any).useGetPurchaseOrderByIdMutation()
  const [createPurchaseOrder] = (purchases as any).useCreatePurchaseOrderMutation()
  const [editPurchaseOrder] = (purchases as any).useEditPurchaseOrderMutation()
  const [receivePurchaseOrder] = (purchases as any).useReceivePurchaseOrderMutation()
  const [payPurchaseOrder] = (purchases as any).usePayPurchaseOrderMutation()
  const [changePurchasePaymentStatus] = (purchases as any).useChangePurchasePaymentStatusMutation()
  const [bulkUpdatePurchaseOrderProducts] = (purchases as any).useBulkUpdatePurchaseOrderProductsMutation()
  const [deletePurchaseOrderProduct] = (purchases as any).useDeletePurchaseOrderProductMutation()
  const [getLowStockSuggestions] = (purchases as any).useGetLowStockSuggestionsMutation()
  const [refreshPurchaseOrder] = (purchases as any).useRefreshPurchaseOrderMutation()
  const [setPurchaseOrderAsPaid] = (purchases as any).useSetPurchaseOrderAsPaidMutation()

  const record = purchaseOrder.data?.data
  const orderItems = record?.items || []
  const productOptions = products.data?.data || []
  const paymentTypeOptions = paymentTypes.data?.data || []
  const supplierOptions = suppliers.data?.data || []

  const hydratePurchase = (purchase: any) => {
    setFormData({
      supplier_id: purchase.provider_id ? String(purchase.provider_id) : "",
      code: purchase.code || "",
      invoice_reference: purchase.invoice_reference || "",
      order_date: purchase.invoice_date ? purchase.invoice_date.slice(0, 10) : today(),
      expected_date: purchase.delivery_time ? purchase.delivery_time.slice(0, 10) : "",
      workflow_status: purchase.delivery_status || "ordered",
      discount_amount: String(purchase.discount_amount || ""),
      shipping_amount: String(purchase.shipping_amount || ""),
      note: purchase.description || "",
      automatic_approval: purchase.automatic_approval !== undefined ? Boolean(purchase.automatic_approval) : true,
    })

    setItems(
      (purchase.items || []).map((item: any) => ({
        id: crypto.randomUUID(),
        purchase_item_id: item.id,
        product_id: item.product_id ? String(item.product_id) : "",
        ordered_quantity: String(item.quantity || item.ordered_quantity || ""),
        cost_price: String(item.purchase_price || item.cost_price || ""),
        tax_amount: String(item.tax_value || item.tax_amount || ""),
        unit_id: item.unit_id ? String(item.unit_id) : "",
      }))
    )

    const dueAmount = Math.max(
      money(purchase.total) - money(purchase.paid_amount),
      0
    )
    setPayment((current) => ({
      ...current,
      amount: dueAmount ? String(dueAmount) : "",
    }))
  }

  const reloadOrder = async () => {
    if (!isEdit) return null
    const response = await getPurchaseOrderById({ id }).unwrap()
    const purchase = response?.data
    if (purchase) {
      hydratePurchase(purchase)
    }
    return purchase
  }

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await Promise.all([
        getSuppliersDropdown(),
        getProductsDropdown(),
        getPaymentTypesDropdown(),
        getUnitsDropdown(),
      ])
      if (!isEdit) {
        setFormData(initialValues)
        setItems([emptyItem()])
        return
      }

      await reloadOrder()
    }

    load()
  }, [
    getPaymentTypesDropdown,
    getProductsDropdown,
    getPurchaseOrderById,
    getSuppliersDropdown,
    getUnitsDropdown,
    id,
    isEdit,
  ])

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum + money(item.ordered_quantity) * money(item.cost_price),
      0
    )
    const tax = items.reduce((sum, item) => sum + money(item.tax_amount), 0)
    const total =
      subtotal - money(formData.discount_amount) + tax + money(formData.shipping_amount)
    return { subtotal, tax, total }
  }, [formData.discount_amount, formData.shipping_amount, items])

  const isLoading =
    suppliers.isLoading ||
    products.isLoading ||
    (isEdit && purchaseOrder.isLoading)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const updateFooterState = () => {
      const distanceFromBottom =
        content.scrollHeight - content.scrollTop - content.clientHeight
      setIsFooterStuck(distanceFromBottom > 40)
    }

    updateFooterState()
    content.addEventListener("scroll", updateFooterState, { passive: true })
    window.addEventListener("resize", updateFooterState)

    return () => {
      content.removeEventListener("scroll", updateFooterState)
      window.removeEventListener("resize", updateFooterState)
    }
  }, [isEdit, isLoading, items.length, orderItems.length])

  const updateField = (name: keyof PurchaseFormValues, value: any) => {
    setFormData((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }))
  }

  const updateItem = (
    rowId: string,
    name: keyof Omit<PurchaseItemForm, "id">,
    value: string
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === rowId ? { ...item, [name]: value } : item
      )
    )
  }

  const updateProductItemSelection = async (rowId: string, productId: string) => {
    updateItem(rowId, "product_id", productId)
    if (!productId) return

    try {
      const response = await getProductById({ id: Number(productId) }).unwrap()
      const product = response?.data
      if (product) {
        const primaryUnit = product.unit_quantities?.[0]?.unit_id
        const primaryCost = product.unit_quantities?.[0]?.cogs || 0

        setItems((current) =>
          current.map((item) =>
            item.id === rowId
              ? {
                  ...item,
                  product_id: productId,
                  unit_id: primaryUnit ? String(primaryUnit) : "",
                  cost_price: primaryCost ? String(primaryCost) : "",
                }
              : item
          )
        )
      }
    } catch (e) {
      console.error(e)
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.supplier_id) nextErrors.supplier_id = t("Provider is required")
    if (!formData.order_date) nextErrors.order_date = t("Invoice date is required")
    if (items.length) {
      items.forEach((item, index) => {
        if (!item.product_id) nextErrors[`product_${index}`] = t("Product is required")
        if (!item.unit_id) nextErrors[`unit_${index}`] = t("Unit is required")
        if (!item.ordered_quantity)
          nextErrors[`quantity_${index}`] = t("Quantity is required")
        if (!item.cost_price) nextErrors[`cost_${index}`] = t("Purchase price is required")
      })
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/purchases")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payLoad: any = {
        provider_id: Number(formData.supplier_id),
        name: formData.code || undefined,
        invoice_reference: formData.invoice_reference || undefined,
        invoice_date: formData.order_date || undefined,
        delivery_time: formData.expected_date || undefined,
        delivery_status: formData.workflow_status,
        automatic_approval: formData.automatic_approval,
        description: formData.note || undefined,
      }

      if (!isEdit) {
        payLoad.products = items.map((item) => ({
          product_id: Number(item.product_id),
          unit_id: Number(item.unit_id),
          purchase_price: item.cost_price || "0",
          quantity: item.ordered_quantity || "0",
          tax_value: item.tax_amount || "0",
        }))
        const response = await createPurchaseOrder(payLoad).unwrap()
        showToast.success(response?.message || t("The procurement has been created successfully."))
      } else {
        const response = await editPurchaseOrder({ id, payLoad }).unwrap()
        await bulkUpdatePurchaseOrderProducts({
          id,
          payLoad: {
            products: items.map((item) => ({
              purchase_item_id: item.purchase_item_id,
              product_id: Number(item.product_id),
              unit_id: Number(item.unit_id),
              purchase_price: item.cost_price || "0",
              quantity: item.ordered_quantity || "0",
              tax_value: item.tax_amount || "0",
            })),
          },
        }).unwrap()
        showToast.success(response?.message || t("The procurement has been updated successfully."))
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitReceive = async () => {
    const selectedItems = Object.entries(receiveItems)
      .filter(([, value]) => money(value) > 0)
      .map(([purchase_item_id, received_quantity]) => ({
        purchase_item_id: Number(purchase_item_id),
        received_quantity,
      }))

    if (!selectedItems.length) {
      showToast.error(t("Enter receive quantity for at least one item."))
      return
    }

    const response = await receivePurchaseOrder({
      id,
      payLoad: { items: selectedItems, note: formData.note || "" },
    }).unwrap()
    showToast.success(response?.message || t("Stock received successfully."))
    await reloadOrder()
    setReceiveItems({})
  }

  const submitPayment = async () => {
    if (money(payment.amount) <= 0) {
      showToast.error(t("Payment amount is required."))
      return
    }

    const response = await payPurchaseOrder({
      id,
      payLoad: payment,
    }).unwrap()
    showToast.success(response?.message || t("Procurement payment recorded."))
    await reloadOrder()
  }

  const handleUseLowStockSuggestions = async () => {
    const response = await getLowStockSuggestions().unwrap()
    const suggestions = response?.data || []
    if (!suggestions.length) {
      showToast.error(t("No low stock suggestions found."))
      return
    }
    setItems((current) => [
      ...current,
      ...suggestions.map((item: any) => ({
        id: crypto.randomUUID(),
        product_id: String(item.id),
        ordered_quantity: "1",
        cost_price: String(item.purchase_price || 0),
        tax_amount: "0",
      })),
    ])
    showToast.success(t("Low stock suggestions added."))
  }

  const handleRefreshOrder = async () => {
    await refreshPurchaseOrder({ id }).unwrap()
    await reloadOrder()
    showToast.success(t("Procurement refreshed successfully."))
  }

  const handleSetAsPaid = async () => {
    const response = await setPurchaseOrderAsPaid({ id }).unwrap()
    showToast.success(response?.message || t("Procurement marked as paid."))
    await reloadOrder()
  }

  const handlePaymentStatusChange = async (
    payment_status: "paid" | "partial" | "unpaid"
  ) => {
    const payLoad: Record<string, string> = { payment_status }
    if (payment_status === "partial") {
      if (money(payment.amount) <= 0) {
        showToast.error(t("Enter partial amount first."))
        return
      }
      payLoad.amount = payment.amount
    }

    const response = await changePurchasePaymentStatus({ id, payLoad }).unwrap()
    showToast.success(response?.message || t("Payment status updated."))
    await reloadOrder()
  }

  const handleRemoveItem = async (item: PurchaseItemForm) => {
    if (isEdit && item.purchase_item_id) {
      await deletePurchaseOrderProduct({ id, productId: item.purchase_item_id }).unwrap()
      showToast.success(t("Procurement product deleted."))
      await reloadOrder()
      return
    }
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading procurement data...")}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={goBack}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEdit ? t("Edit Procurement") : t("New Procurement")}
            </h1>
            <p className="text-xs font-medium text-gray-500">
              {t("Make a new procurement.")}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isEdit ? (
              <>
                <Button type="button" variant="outline" onClick={handleRefreshOrder}>
                  <RefreshCwIcon className="size-4" />
                  {t("Refresh")}
                </Button>
                <Button type="button" variant="outline" onClick={handleSetAsPaid}>
                  {t("Set As Paid")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/purchases/orders/${id}/invoice`)}
                >
                  <FileTextIcon className="size-4" />
                  {t("Invoice")}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-4 px-4 pt-4 mb-0">
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <UniFieldSelect
                  label={t("Provider")}
                  required
                  value={formData.supplier_id}
                  onValueChange={(value) => updateField("supplier_id", value)}
                  placeholder={t("Select Provider")}
                  error={errors.supplier_id}
                >
                  {supplierOptions.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
                <UniFieldInput
                  label={t("Procurement Name")}
                  placeholder={t("Auto generated if empty")}
                  value={formData.code}
                  onChange={(event) => updateField("code", event.target.value)}
                />
                <UniFieldInput
                  label={t("Invoice Number")}
                  placeholder={t("External Invoice reference")}
                  value={formData.invoice_reference}
                  onChange={(event) => updateField("invoice_reference", event.target.value)}
                />
                <UniFieldInput
                  label={t("Invoice Date")}
                  required
                  type="date"
                  value={formData.order_date}
                  onChange={(event) =>
                    updateField("order_date", event.target.value)
                  }
                  error={errors.order_date}
                />
                <UniFieldInput
                  label={t("Delivery Time")}
                  type="date"
                  value={formData.expected_date}
                  onChange={(event) =>
                    updateField("expected_date", event.target.value)
                  }
                />
                <UniFieldSelect
                  label={t("Delivery Status")}
                  value={formData.workflow_status}
                  onValueChange={(value) => updateField("workflow_status", value)}
                >
                  <SelectItem value="draft">{t("Draft")}</SelectItem>
                  <SelectItem value="ordered">{t("Ordered")}</SelectItem>
                  <SelectItem value="partial">{t("Partial")}</SelectItem>
                  <SelectItem value="received">{t("Received")}</SelectItem>
                </UniFieldSelect>
                
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2">
                  <span className="text-sm font-semibold text-gray-700">{t("Automatic Approval")}</span>
                  <input
                    type="checkbox"
                    checked={formData.automatic_approval}
                    onChange={(event) => updateField("automatic_approval", event.target.checked)}
                    className="size-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                </div>

                <UniFieldInput
                  label={t("Shipping Amount")}
                  type="number"
                  min="0"
                  step="0.01"
                  prefix={posOptions.currency_symbol}
                  placeholder={t("Enter shipping")}
                  value={formData.shipping_amount}
                  onChange={(event) =>
                    updateField("shipping_amount", event.target.value)
                  }
                />
                <UniFieldInput
                  label={t("Discount Amount")}
                  type="number"
                  min="0"
                  step="0.01"
                  prefix={posOptions.currency_symbol}
                  placeholder={t("Enter discount")}
                  value={formData.discount_amount}
                  onChange={(event) =>
                    updateField("discount_amount", event.target.value)
                  }
                />
                <div className="md:col-span-3">
                  <UniFieldInput
                    as="textarea"
                    label={t("Description")}
                    placeholder={t("Enter description note")}
                    value={formData.note}
                    onChange={(event) => updateField("note", event.target.value)}
                  />
                </div>
              </div>
            </section>

            {!isEdit ? (
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {t("Procurement Products List")}
                    </h2>
                    <p className="text-xs font-medium text-gray-500">
                      {t("Add products that you are buying from the provider.")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleUseLowStockSuggestions}>
                      {t("Low Stock Suggestions")}
                    </Button>
                    <Button type="button" onClick={() => setItems([...items, emptyItem()])}>
                      <PlusIcon className="size-4" />
                      {t("Add Item")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]"
                    >
                      <UniFieldSelect
                        label={index === 0 ? t("Product") : undefined}
                        required
                        value={item.product_id}
                        onValueChange={(value) =>
                          updateProductItemSelection(item.id, value)
                        }
                        placeholder={t("Select product")}
                        error={errors[`product_${index}`]}
                      >
                        {productOptions.map((product: any) => (
                          <SelectItem key={product.id} value={String(product.id)}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>
                      <UniFieldSelect
                        label={index === 0 ? t("Unit") : undefined}
                        required
                        value={item.unit_id}
                        onValueChange={(value) =>
                          updateItem(item.id, "unit_id", value)
                        }
                        placeholder={t("Select unit")}
                        error={errors[`unit_${index}`]}
                      >
                        {(units.data?.data || []).map((unit: any) => (
                          <SelectItem key={unit.id} value={String(unit.id)}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>
                      <UniFieldInput
                        label={index === 0 ? t("Quantity") : undefined}
                        required
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder={t("Quantity")}
                        value={item.ordered_quantity}
                        onChange={(event) =>
                          updateItem(item.id, "ordered_quantity", event.target.value)
                        }
                        error={errors[`quantity_${index}`]}
                      />
                      <UniFieldInput
                        label={index === 0 ? t("Purchase Price") : undefined}
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        prefix={posOptions.currency_symbol}
                        placeholder={t("Purchase Price")}
                        value={item.cost_price}
                        onChange={(event) =>
                          updateItem(item.id, "cost_price", event.target.value)
                        }
                        error={errors[`cost_${index}`]}
                      />
                      <UniFieldInput
                        label={index === 0 ? t("Tax") : undefined}
                        type="number"
                        min="0"
                        step="0.01"
                        prefix={posOptions.currency_symbol}
                        placeholder={t("Tax")}
                        value={item.tax_amount}
                        onChange={(event) =>
                          updateItem(item.id, "tax_amount", event.target.value)
                        }
                      />
                      <div className={cn("flex items-end", index === 0 && "pt-6")}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={items.length === 1}
                          onClick={() => handleRemoveItem(item)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-700 md:ml-auto md:w-80">
                  <div className="flex justify-between">
                    <span>{t("Subtotal")}</span>
                    <span>{formatMoney(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("Tax")}</span>
                    <span>{formatMoney(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-950">
                    <span>{t("Total")}</span>
                    <span>{formatMoney(totals.total)}</span>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {t("Procurement Products List")}
                      </h2>
                      <p className="text-xs font-medium text-gray-500">
                        {t("Manage procurement products, receive quantities and provider billing.")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={handleUseLowStockSuggestions}>
                        {t("Low Stock Suggestions")}
                      </Button>
                      <Button type="button" onClick={() => setItems([...items, emptyItem()])}>
                        <PlusIcon className="size-4" />
                        {t("Add Item")}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const existingItem = orderItems.find(
                        (orderItem: any) => orderItem.id === item.purchase_item_id
                      )
                      const receivedQuantity = money(existingItem?.received_quantity)
                      const rowTotal =
                        money(item.ordered_quantity) * money(item.cost_price) +
                        money(item.tax_amount)

                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]"
                        >
                          <UniFieldSelect
                            label={index === 0 ? t("Product") : undefined}
                            required
                            value={item.product_id}
                            onValueChange={(value) =>
                              updateProductItemSelection(item.id, value)
                            }
                            placeholder={t("Select product")}
                            error={errors[`product_${index}`]}
                          >
                            {productOptions.map((product: any) => (
                              <SelectItem key={product.id} value={String(product.id)}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </UniFieldSelect>
                          <UniFieldSelect
                            label={index === 0 ? t("Unit") : undefined}
                            required
                            value={item.unit_id}
                            onValueChange={(value) =>
                              updateItem(item.id, "unit_id", value)
                            }
                            placeholder={t("Select unit")}
                            error={errors[`unit_${index}`]}
                          >
                            {(units.data?.data || []).map((unit: any) => (
                              <SelectItem key={unit.id} value={String(unit.id)}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </UniFieldSelect>
                          <UniFieldInput
                            label={index === 0 ? t("Quantity") : undefined}
                            required
                            type="number"
                            min={receivedQuantity}
                            step="0.001"
                            placeholder={t("Quantity")}
                            value={item.ordered_quantity}
                            onChange={(event) =>
                              updateItem(item.id, "ordered_quantity", event.target.value)
                            }
                            error={errors[`quantity_${index}`]}
                          />
                          <UniFieldInput
                            label={index === 0 ? t("Received") : undefined}
                            value={existingItem ? String(existingItem.received_quantity || 0) : "0"}
                            readOnly
                            disabled
                          />
                          <UniFieldInput
                            label={index === 0 ? t("Purchase Price") : undefined}
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            prefix={posOptions.currency_symbol}
                            placeholder={t("Purchase Price")}
                            value={item.cost_price}
                            onChange={(event) =>
                              updateItem(item.id, "cost_price", event.target.value)
                            }
                            error={errors[`cost_${index}`]}
                          />
                          <div className="space-y-2">
                            <UniFieldInput
                              label={index === 0 ? t("Tax") : undefined}
                              type="number"
                              min="0"
                              step="0.01"
                              prefix={posOptions.currency_symbol}
                              placeholder={t("Tax")}
                              value={item.tax_amount}
                              onChange={(event) =>
                                updateItem(item.id, "tax_amount", event.target.value)
                              }
                            />
                            <p className="text-xs font-medium text-gray-500">
                              {t("Total")}: {formatMoney(rowTotal)}
                            </p>
                          </div>
                          <div className={cn("flex items-end", index === 0 && "pt-6")}>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={items.length === 1}
                              onClick={() => handleRemoveItem(item)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 grid gap-2 rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-700 md:ml-auto md:w-80">
                    <div className="flex justify-between">
                      <span>{t("Subtotal")}</span>
                      <span>{formatMoney(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("Tax")}</span>
                      <span>{formatMoney(totals.tax)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-950">
                      <span>{t("Total")}</span>
                      <span>{formatMoney(totals.total)}</span>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <section className="rounded-lg border border-gray-200 bg-white p-4">
                    <h2 className="text-base font-bold text-gray-900">
                      {t("Stock In")}
                    </h2>
                    <p className="mb-4 text-xs font-medium text-gray-500">
                      {t("Enter received quantity. This increases product current stock.")}
                    </p>
                    <div className="space-y-3">
                      {orderItems.map((item: any) => {
                        const pending = Math.max(
                          money(item.ordered_quantity) - money(item.received_quantity),
                          0
                        )
                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-[1fr_160px]"
                          >
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {item.product__name}
                              </p>
                              <p className="text-xs font-medium text-gray-500">
                                {t("Pending")}: {pending}
                              </p>
                            </div>
                            <UniFieldInput
                              type="number"
                              min="0"
                              max={pending}
                              step="0.001"
                              placeholder={t("Receive quantity")}
                              value={receiveItems[item.id] || ""}
                              onChange={(event) =>
                                setReceiveItems((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      type="button"
                      className="mt-4"
                      onClick={submitReceive}
                      disabled={receivePurchaseOrder.isLoading}
                    >
                      {receivePurchaseOrder.isLoading ? <Spinner /> : t("Receive Stock")}
                    </Button>
                  </section>

                  <section className="rounded-lg border border-gray-200 bg-white p-4">
                    <h2 className="text-base font-bold text-gray-900">
                      {t("Provider Payment")}
                    </h2>
                    <p className="mb-4 text-xs font-medium text-gray-500">
                      {t("Record payment against this procurement.")}
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <UniFieldInput
                        label={t("Amount")}
                        type="number"
                        min="0"
                        step="0.01"
                        prefix={posOptions.currency_symbol}
                        placeholder={t("Enter amount")}
                        value={payment.amount}
                        onChange={(event) =>
                          setPayment((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                      />
                      <UniFieldSelect
                        label={t("Payment Type")}
                        value={payment.payment_type}
                        onValueChange={(value) =>
                          setPayment((current) => ({
                            ...current,
                            payment_type: value,
                          }))
                        }
                      >
                        {paymentTypeOptions.map((type: any) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>
                      <UniFieldInput
                        label={t("Paid At")}
                        type="date"
                        value={payment.paid_at}
                        onChange={(event) =>
                          setPayment((current) => ({
                            ...current,
                            paid_at: event.target.value,
                          }))
                        }
                      />
                      <UniFieldInput
                        label={t("Reference")}
                        placeholder={t("Transaction/reference number")}
                        value={payment.reference_number}
                        onChange={(event) =>
                          setPayment((current) => ({
                            ...current,
                            reference_number: event.target.value,
                          }))
                        }
                      />
                      <div className="md:col-span-2">
                        <UniFieldInput
                          as="textarea"
                          label={t("Payment Note")}
                          placeholder={t("Enter payment note")}
                          value={payment.note}
                          onChange={(event) =>
                            setPayment((current) => ({
                              ...current,
                              note: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="mt-4"
                      onClick={submitPayment}
                      disabled={payPurchaseOrder.isLoading}
                    >
                      {payPurchaseOrder.isLoading ? <Spinner /> : t("Pay Provider")}
                    </Button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePaymentStatusChange("unpaid")}
                      >
                        {t("Mark Unpaid")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePaymentStatusChange("partial")}
                      >
                        {t("Mark Partial")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePaymentStatusChange("paid")}
                      >
                        {t("Mark Paid")}
                      </Button>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>

          <div ref={paginationSentinelRef} className="h-px w-full" />

          <footer
            className={cn(
              "sticky z-50 transition-all duration-300 ease-in-out",
              isFooterStuck ? "bottom-2 mx-3" : "bottom-0 mx-0"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-end gap-x-2 rounded-b-xl bg-white/90 p-3 backdrop-blur-md transition-shadow duration-200",
                isFooterStuck
                  ? "rounded-t-xl border border-gray-200"
                  : "rounded-t-none border-t-2 border-gray-100"
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
              >
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-32 bg-black text-white hover:bg-black/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    {t("Saving...")}
                  </span>
                ) : isEdit ? (
                  t("Save Procurement")
                ) : (
                  t("Create Procurement")
                )}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
