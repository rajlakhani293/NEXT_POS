"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileTextIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { catalog } from "@/lib/api/catalog"
import { payments } from "@/lib/api/payments"
import { purchases } from "@/lib/api/purchases"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type PurchaseItemForm = {
  id: string
  product_id: string
  ordered_quantity: string
  cost_price: string
  tax_amount: string
}

type PurchaseFormValues = {
  supplier_id: string
  code: string
  order_date: string
  expected_date: string
  workflow_status: string
  discount_amount: string
  shipping_amount: string
  note: string
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = (): PurchaseItemForm => ({
  id: crypto.randomUUID(),
  product_id: "",
  ordered_quantity: "",
  cost_price: "",
  tax_amount: "",
})

const initialValues: PurchaseFormValues = {
  supplier_id: "",
  code: "",
  order_date: today(),
  expected_date: "",
  workflow_status: "ordered",
  discount_amount: "",
  shipping_amount: "",
  note: "",
}

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

export default function PurchaseOrderFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"
  const loadKeyRef = useRef("")

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

  const [getSuppliersDropdown, suppliers] = (
    purchases as any
  ).useGetSuppliersDropdownMutation()
  const [getProductsDropdown, products] = (
    catalog as any
  ).useGetProductsDropdownMutation()
  const [getPaymentTypesDropdown, paymentTypes] = (
    payments as any
  ).useGetPaymentTypesDropdownMutation()
  const [getPurchaseOrderById, purchaseOrder] = (
    purchases as any
  ).useGetPurchaseOrderByIdMutation()
  const [createPurchaseOrder] = (
    purchases as any
  ).useCreatePurchaseOrderMutation()
  const [editPurchaseOrder] = (purchases as any).useEditPurchaseOrderMutation()
  const [receivePurchaseOrder] = (
    purchases as any
  ).useReceivePurchaseOrderMutation()
  const [payPurchaseOrder] = (purchases as any).usePayPurchaseOrderMutation()

  const record = purchaseOrder.data?.data
  const orderItems = record?.items || []
  const productOptions = products.data?.data || []
  const paymentTypeOptions = paymentTypes.data?.data || []
  const supplierOptions = suppliers.data?.data || []

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await Promise.all([
        getSuppliersDropdown(),
        getProductsDropdown(),
        getPaymentTypesDropdown(),
      ])
      if (!isEdit) {
        setFormData(initialValues)
        setItems([emptyItem()])
        return
      }

      const response = await getPurchaseOrderById({ id }).unwrap()
      const purchase = response?.data
      if (!purchase) return

      setFormData({
        supplier_id: purchase.supplier_id ? String(purchase.supplier_id) : "",
        code: purchase.code || "",
        order_date: purchase.order_date || today(),
        expected_date: purchase.expected_date || "",
        workflow_status: purchase.workflow_status || "ordered",
        discount_amount: String(purchase.discount_amount || ""),
        shipping_amount: String(purchase.shipping_amount || ""),
        note: purchase.note || "",
      })

      const dueAmount = Math.max(
        money(purchase.total) - money(purchase.paid_amount),
        0
      )
      setPayment((current) => ({
        ...current,
        amount: dueAmount ? String(dueAmount) : "",
      }))
    }

    load()
  }, [
    getPaymentTypesDropdown,
    getProductsDropdown,
    getPurchaseOrderById,
    getSuppliersDropdown,
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

  const updateField = (name: keyof PurchaseFormValues, value: string) => {
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

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.supplier_id) nextErrors.supplier_id = "Supplier is required"
    if (!formData.order_date) nextErrors.order_date = "Order date is required"
    if (!isEdit) {
      items.forEach((item, index) => {
        if (!item.product_id) nextErrors[`product_${index}`] = "Product is required"
        if (!item.ordered_quantity)
          nextErrors[`quantity_${index}`] = "Quantity is required"
        if (!item.cost_price) nextErrors[`cost_${index}`] = "Cost is required"
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
        ...formData,
        supplier_id: Number(formData.supplier_id),
        discount_amount: formData.discount_amount || "0",
        shipping_amount: formData.shipping_amount || "0",
      }

      if (!isEdit) {
        payLoad.items = items.map((item) => ({
          product_id: Number(item.product_id),
          ordered_quantity: item.ordered_quantity || "0",
          cost_price: item.cost_price || "0",
          tax_amount: item.tax_amount || "0",
        }))
        const response = await createPurchaseOrder(payLoad).unwrap()
        showToast.success(response?.message || "Purchase order created.")
      } else {
        const response = await editPurchaseOrder({ id, payLoad }).unwrap()
        showToast.success(response?.message || "Purchase order updated.")
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
      showToast.error("Enter receive quantity for at least one item.")
      return
    }

    const response = await receivePurchaseOrder({
      id,
      payLoad: { items: selectedItems, note: formData.note || "" },
    }).unwrap()
    showToast.success(response?.message || "Stock received successfully.")
    await getPurchaseOrderById({ id })
    setReceiveItems({})
  }

  const submitPayment = async () => {
    if (money(payment.amount) <= 0) {
      showToast.error("Payment amount is required.")
      return
    }

    const response = await payPurchaseOrder({
      id,
      payLoad: payment,
    }).unwrap()
    showToast.success(response?.message || "Purchase payment recorded.")
    await getPurchaseOrderById({ id })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          Loading purchase data...
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
              {isEdit ? "Edit Purchase Order" : "Create Purchase Order"}
            </h1>
            <p className="text-xs font-medium text-gray-500">
              Buy stock from supplier, receive stock-in and record supplier payment.
            </p>
          </div>
          {isEdit ? (
            <Button
              type="button"
              variant="outline"
              className="ml-auto"
              onClick={() => router.push(`/purchases/orders/${id}/invoice`)}
            >
              <FileTextIcon className="size-4" />
              Invoice
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-4">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <UniFieldSelect
                label="Supplier"
                required
                value={formData.supplier_id}
                onValueChange={(value) => updateField("supplier_id", value)}
                placeholder="Select Supplier"
                error={errors.supplier_id}
              >
                {supplierOptions.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </UniFieldSelect>
              <UniFieldInput
                label="Purchase Code"
                placeholder="Auto generated if empty"
                value={formData.code}
                onChange={(event) => updateField("code", event.target.value)}
              />
              <UniFieldInput
                label="Order Date"
                required
                type="date"
                value={formData.order_date}
                onChange={(event) =>
                  updateField("order_date", event.target.value)
                }
                error={errors.order_date}
              />
              <UniFieldInput
                label="Expected Date"
                type="date"
                value={formData.expected_date}
                onChange={(event) =>
                  updateField("expected_date", event.target.value)
                }
              />
              <UniFieldSelect
                label="Workflow Status"
                value={formData.workflow_status}
                onValueChange={(value) => updateField("workflow_status", value)}
              >
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </UniFieldSelect>
              <UniFieldInput
                label="Shipping Amount"
                type="number"
                min="0"
                step="0.01"
                prefix="₹"
                placeholder="Enter shipping"
                value={formData.shipping_amount}
                onChange={(event) =>
                  updateField("shipping_amount", event.target.value)
                }
              />
              <UniFieldInput
                label="Discount Amount"
                type="number"
                min="0"
                step="0.01"
                prefix="₹"
                placeholder="Enter discount"
                value={formData.discount_amount}
                onChange={(event) =>
                  updateField("discount_amount", event.target.value)
                }
              />
              <div className="md:col-span-2">
                <UniFieldInput
                  as="textarea"
                  label="Note"
                  placeholder="Enter purchase note"
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
                    Purchase Items
                  </h2>
                  <p className="text-xs font-medium text-gray-500">
                    Add products that you are buying from the supplier.
                  </p>
                </div>
                <Button type="button" onClick={() => setItems([...items, emptyItem()])}>
                  <PlusIcon className="size-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
                  >
                    <UniFieldSelect
                      label={index === 0 ? "Product" : undefined}
                      required
                      value={item.product_id}
                      onValueChange={(value) =>
                        updateItem(item.id, "product_id", value)
                      }
                      placeholder="Select product"
                      error={errors[`product_${index}`]}
                    >
                      {productOptions.map((product: any) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>
                    <UniFieldInput
                      label={index === 0 ? "Qty" : undefined}
                      required
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="Qty"
                      value={item.ordered_quantity}
                      onChange={(event) =>
                        updateItem(item.id, "ordered_quantity", event.target.value)
                      }
                      error={errors[`quantity_${index}`]}
                    />
                    <UniFieldInput
                      label={index === 0 ? "Cost" : undefined}
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      prefix="₹"
                      placeholder="Cost"
                      value={item.cost_price}
                      onChange={(event) =>
                        updateItem(item.id, "cost_price", event.target.value)
                      }
                      error={errors[`cost_${index}`]}
                    />
                    <UniFieldInput
                      label={index === 0 ? "Tax" : undefined}
                      type="number"
                      min="0"
                      step="0.01"
                      prefix="₹"
                      placeholder="Tax"
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
                        onClick={() =>
                          setItems((current) =>
                            current.filter((currentItem) => currentItem.id !== item.id)
                          )
                        }
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2 rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-700 md:ml-auto md:w-80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹{totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-950">
                  <span>Total</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="mb-4 text-base font-bold text-gray-900">
                  Purchase Items
                </h2>
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left font-bold text-gray-700">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Ordered</th>
                        <th className="p-3">Received</th>
                        <th className="p-3">Cost</th>
                        <th className="p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 font-semibold">
                            {item.product__name}
                          </td>
                          <td className="p-3">{item.ordered_quantity}</td>
                          <td className="p-3">{item.received_quantity}</td>
                          <td className="p-3">₹{item.cost_price}</td>
                          <td className="p-3">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="text-base font-bold text-gray-900">
                    Stock In / Receive Purchase
                  </h2>
                  <p className="mb-4 text-xs font-medium text-gray-500">
                    Enter received quantity. This increases product current stock.
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
                              Pending: {pending}
                            </p>
                          </div>
                          <UniFieldInput
                            type="number"
                            min="0"
                            max={pending}
                            step="0.001"
                            placeholder="Receive qty"
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
                    {receivePurchaseOrder.isLoading ? <Spinner /> : "Receive Stock"}
                  </Button>
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="text-base font-bold text-gray-900">
                    Supplier Payment
                  </h2>
                  <p className="mb-4 text-xs font-medium text-gray-500">
                    Record payment against this purchase order.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UniFieldInput
                      label="Amount"
                      type="number"
                      min="0"
                      step="0.01"
                      prefix="₹"
                      placeholder="Enter amount"
                      value={payment.amount}
                      onChange={(event) =>
                        setPayment((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                    />
                    <UniFieldSelect
                      label="Payment Type"
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
                      label="Paid At"
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
                      label="Reference"
                      placeholder="Transaction/reference number"
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
                        label="Payment Note"
                        placeholder="Enter payment note"
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
                    {payPurchaseOrder.isLoading ? <Spinner /> : "Pay Supplier"}
                  </Button>
                </section>
              </div>
            </>
          )}
        </form>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : isEdit ? "Save Purchase" : "Create Purchase"}
          </Button>
        </div>
      </div>
    </div>
  )
}
