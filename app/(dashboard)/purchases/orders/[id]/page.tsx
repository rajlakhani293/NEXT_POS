"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Settings2Icon, Trash2Icon } from "lucide-react"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import CustomModal from "@/components/ui/customModal"
import { DatePicker } from "@/components/date-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProviderForm } from "@/app/(dashboard)/providers/createUpdate"
import { catalog } from "@/lib/api/catalog"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type PurchaseItemForm = {
  id: string
  purchase_item_id?: number
  product_id: string
  product_name: string
  quantity: string
  purchase_price: string
  tax_group_id: string
  tax_type: "inclusive" | "exclusive"
  tax_value: string
  unit_id: string
  convert_unit_id: string
  convert_unit_label: string
  expiration_date: string
}

type PurchaseFormValues = {
  provider_id: string
  name: string
  invoice_reference: string
  invoice_date: string
  delivery_time: string
  automatic_approval: boolean
  delivery_status: string
  payment_status: string
  description: string
}

const today = () => new Date().toISOString().slice(0, 10)

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

const emptyItem = (): PurchaseItemForm => ({
  id: crypto.randomUUID(),
  product_id: "",
  product_name: "",
  quantity: "1",
  purchase_price: "0",
  tax_group_id: "",
  tax_type: "inclusive",
  tax_value: "0",
  unit_id: "",
  convert_unit_id: "",
  convert_unit_label: "",
  expiration_date: "",
})

const initialValues: PurchaseFormValues = {
  provider_id: "",
  name: "",
  invoice_reference: "",
  invoice_date: today(),
  delivery_time: today(),
  automatic_approval: true,
  delivery_status: "delivered",
  payment_status: "paid",
  description: "",
}

export default function PurchaseOrderFormPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const id = params.id as string
  const isEdit = id !== "create"
  const loadKeyRef = useRef("")
  const contentRef = useRef<HTMLDivElement>(null)

  const formatMoney = (value: string | number | null | undefined) =>
    formatBusinessMoney(value, posOptions)

  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState<PurchaseFormValues>(initialValues)
  const [items, setItems] = useState<PurchaseItemForm[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [unitSiblingOptions, setUnitSiblingOptions] = useState<Record<string, any[]>>({})
  const [productDetailsById, setProductDetailsById] = useState<Record<string, any>>({})
  const [providerFormOpen, setProviderFormOpen] = useState(false)
  const [productSearchId, setProductSearchId] = useState("")
  const [choiceModal, setChoiceModal] = useState<{
    type: "unit" | "convert" | "tax" | "options"
    itemId: string
  } | null>(null)
  const [optionDraft, setOptionDraft] = useState({
    expiration_date: "",
    tax_type: "inclusive" as "inclusive" | "exclusive",
  })

  const [getSuppliersDropdown, suppliers] = (purchases as any).useGetSuppliersDropdownMutation()
  const [searchProductForProcurement, products] = (purchases as any).useSearchProductForProcurementMutation()
  const [getProductById] = (catalog as any).useGetProductByIdMutation()
  const [getTaxGroupsSource, taxGroups] = (catalog as any).useGetTaxGroupsSourceMutation()
  const [getUnitSiblings] = (catalog as any).useGetUnitSiblingsMutation()
  const [getPurchaseOrderById, purchaseOrder] = (purchases as any).useGetPurchaseOrderByIdMutation()
  const [createPurchaseOrder] = (purchases as any).useCreatePurchaseOrderMutation()
  const [editPurchaseOrder] = (purchases as any).useEditPurchaseOrderMutation()
  const [bulkUpdatePurchaseOrderProducts] = (purchases as any).useBulkUpdatePurchaseOrderProductsMutation()
  const [deletePurchaseOrderProduct] = (purchases as any).useDeletePurchaseOrderProductMutation()
  const [refreshPurchaseOrder] = (purchases as any).useRefreshPurchaseOrderMutation()

  const record = purchaseOrder.data?.data
  const productOptions = products.data?.data || []
  const supplierOptions = suppliers.data?.data || []
  const taxGroupOptions = taxGroups.data?.data || []
  const isStocked = record?.delivery_status === "stocked"

  const selectedProductById = useMemo(() => {
    const map = new Map<string, any>()
    productOptions.forEach((product: any) => map.set(String(product.id), product))
    Object.entries(productDetailsById).forEach(([productId, product]) => {
      map.set(productId, { ...(map.get(productId) || {}), ...product })
    })
    return map
  }, [productDetailsById, productOptions])

  const getItemUnitOptions = (item: PurchaseItemForm) => {
    const product = selectedProductById.get(item.product_id)
    return normalizeProductUnitQuantities(product)
  }

  const getUnitName = (item: PurchaseItemForm) => {
    const unitQuantity = getItemUnitOptions(item).find((option: any) => String(option.unit_id || option.unit?.id || option.id) === item.unit_id)
    return unitQuantity?.unit?.name || unitQuantity?.name || item.convert_unit_label || t("N/A")
  }

  const getTaxName = (item: PurchaseItemForm) => {
    const tax = taxGroupOptions.find((option: any) => String(option.id) === item.tax_group_id)
    return tax?.name || t("N/A")
  }

  const getConvertUnitOptions = (item: PurchaseItemForm) => {
    const productUnits = getItemUnitOptions(item)
      .map((unitQuantity: any) => unitQuantity.unit || unitQuantity)
      .filter((unit: any) => unit?.id && String(unit.id) !== item.unit_id)

    if (productUnits.length) return productUnits
    return unitSiblingOptions[item.id] || []
  }

  const getConvertUnitName = (item: PurchaseItemForm) => {
    if (!item.convert_unit_id) return t("N/A")
    const unit = getConvertUnitOptions(item).find((option: any) => String(option.id) === item.convert_unit_id)
    return unit?.name || item.convert_unit_label || t("N/A")
  }

  const normalizeProductUnitQuantities = (product: any) => {
    const unitQuantities = product?.unit_quantities
    if (Array.isArray(unitQuantities) && unitQuantities.length) {
      return unitQuantities
    }

    const purchaseUnits = product?.purchase_units
    if (Array.isArray(purchaseUnits) && purchaseUnits.length) {
      return purchaseUnits.map((unit: any) => ({
        id: unit.id,
        unit_id: unit.id,
        convert_unit_id: unit.convert_unit_id,
        cogs: product.purchase_price || 0,
        last_purchase_price: product.purchase_price || 0,
        unit,
      }))
    }

    return []
  }

  const getTaxRate = (taxGroupId: string) => {
    const group = taxGroupOptions.find((item: any) => String(item.id) === taxGroupId)
    if (!group) return 0
    if (group.rate !== undefined) return money(group.rate)
    return (group.taxes || []).reduce((sum: number, tax: any) => sum + money(tax.rate), 0)
  }

  const computeLine = (item: PurchaseItemForm) => {
    const quantity = money(item.quantity)
    const price = money(item.purchase_price)
    const rate = getTaxRate(item.tax_group_id)
    const unitTax =
      rate > 0
        ? item.tax_type === "inclusive"
          ? price - price / (1 + rate / 100)
          : price * (rate / 100)
        : money(item.tax_value) / Math.max(quantity, 1)
    const taxValue = unitTax * quantity
    const total =
      item.tax_type === "inclusive" ? price * quantity : price * quantity + taxValue
    return { taxValue, total }
  }

  const totals = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        const line = computeLine(item)
        return {
          tax: sum.tax + line.taxValue,
          total: sum.total + line.total,
        }
      },
      { tax: 0, total: 0 }
    )
  }, [items, taxGroupOptions])

  const hydratePurchase = (purchase: any) => {
    setFormData({
      provider_id: purchase.provider_id ? String(purchase.provider_id) : "",
      name: purchase.name || "",
      invoice_reference: purchase.invoice_reference || "",
      invoice_date: purchase.invoice_date ? purchase.invoice_date.slice(0, 10) : today(),
      delivery_time: purchase.delivery_time ? purchase.delivery_time.slice(0, 10) : today(),
      automatic_approval: purchase.automatic_approval !== undefined ? Boolean(purchase.automatic_approval) : true,
      delivery_status: ["pending", "delivered"].includes(purchase.delivery_status) ? purchase.delivery_status : "delivered",
      payment_status: ["unpaid", "paid"].includes(purchase.payment_status) ? purchase.payment_status : "paid",
      description: purchase.description || "",
    })

    setItems(
      (purchase.items || []).map((item: any) => ({
        id: crypto.randomUUID(),
        purchase_item_id: item.id,
        product_id: item.product_id ? String(item.product_id) : "",
        product_name: item.product__name || item.name || "",
        quantity: String(item.quantity || ""),
        purchase_price: String(item.purchase_price || ""),
        tax_group_id: item.tax_group_id ? String(item.tax_group_id) : "",
        tax_type: item.tax_type === "exclusive" ? "exclusive" : "inclusive",
        tax_value: String(item.tax_value || "0"),
        unit_id: item.unit_id ? String(item.unit_id) : "",
        convert_unit_id: item.convert_unit_id ? String(item.convert_unit_id) : "",
        convert_unit_label: item.convert_unit__name || item.convert_unit_name || "",
        expiration_date: item.expiration_date ? String(item.expiration_date).slice(0, 10) : "",
      }))
    )
  }

  const reloadOrder = async () => {
    if (!isEdit) return null
    const response = await getPurchaseOrderById({ id }).unwrap()
    const purchase = response?.data
    if (purchase) hydratePurchase(purchase)
    return purchase
  }

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await Promise.all([
        getSuppliersDropdown(),
        searchProductForProcurement({ search: "", limit: 50 }),
        getTaxGroupsSource(),
      ])
      if (!isEdit) {
        setFormData(initialValues)
        setItems([])
        return
      }
      await reloadOrder()
    }

    load()
  }, [getSuppliersDropdown, getTaxGroupsSource, id, isEdit, searchProductForProcurement])

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
  }, [items.length])

  useEffect(() => {
    items.forEach((item) => {
      if (item.unit_id && !unitSiblingOptions[item.id]) {
        loadConvertUnits(item)
      }
    })
  }, [items, unitSiblingOptions])

  useEffect(() => {
    items.forEach((item) => {
      if (item.product_id && !productDetailsById[item.product_id]) {
        getProductById({ id: Number(item.product_id) })
          .unwrap()
          .then((response: any) => {
            const product = response?.data
            if (product) {
              setProductDetailsById((current) => ({
                ...current,
                [String(product.id)]: product,
              }))
            }
          })
          .catch(() => undefined)
      }
    })
  }, [getProductById, items, productDetailsById])

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
      current.map((item) => {
        if (item.id !== rowId) return item
        const updated = { ...item, [name]: value }
        if (name === "tax_group_id" || name === "tax_type" || name === "purchase_price" || name === "quantity") {
          const line = computeLine(updated)
          updated.tax_value = String(line.taxValue || 0)
        }
        return updated
      })
    )
  }

  const updateProductItemSelection = async (rowId: string, productId: string) => {
    if (!productId) {
      updateItem(rowId, "product_id", "")
      return
    }

    try {
      const loadedProduct = selectedProductById.get(productId)
      let product = loadedProduct
      let unitQuantities = normalizeProductUnitQuantities(product)

      if (!unitQuantities.length) {
        const response = await getProductById({ id: Number(productId) }).unwrap()
        product = response?.data
        unitQuantities = normalizeProductUnitQuantities(product)
      }

      if (!unitQuantities.length) {
        showToast.error(t("Unable to add product which doesn't unit quantities defined."))
        return
      }

      setProductDetailsById((current) => ({
        ...current,
        [String(product.id)]: product,
      }))

      const primaryUnit = unitQuantities[0]
      const unitId = primaryUnit.unit_id || primaryUnit.unit?.id
      const convertUnitId = primaryUnit.convert_unit_id

      setItems((current) =>
        current.map((item) => {
          if (item.id !== rowId) return item
          const nextItem: PurchaseItemForm = {
            ...item,
            product_id: String(product.id),
            product_name: product.name || "",
            unit_id: unitId ? String(unitId) : "",
            purchase_price: String(primaryUnit.last_purchase_price || primaryUnit.cogs || product.purchase_price || item.purchase_price || 0),
            tax_group_id: product.tax_group_id ? String(product.tax_group_id) : "",
            tax_type: product.tax_type === "exclusive" ? "exclusive" : "inclusive",
            convert_unit_id: convertUnitId ? String(convertUnitId) : "",
            convert_unit_label: "",
          }
          const line = computeLine(nextItem)
          return { ...nextItem, tax_value: String(line.taxValue || 0) }
        })
      )
    } catch (error) {
      console.error(error)
      showToast.error(t("Unable to load product."))
    }
  }

  const addSelectedProduct = async (productId: string) => {
    if (!productId) return
    const row = emptyItem()
    setItems((current) => [...current, row])
    setProductSearchId("")
    setActiveTab("products")
    await updateProductItemSelection(row.id, productId)
  }

  const loadConvertUnits = async (item: PurchaseItemForm) => {
    if (!item.unit_id || unitSiblingOptions[item.id]) return
    const response = await getUnitSiblings({ id: Number(item.unit_id) }).unwrap()
    setUnitSiblingOptions((current) => ({
      ...current,
      [item.id]: response?.data || [],
    }))
  }

  const selectUnitForItem = (item: PurchaseItemForm, value: string) => {
    const unitQuantity = getItemUnitOptions(item).find((option: any) => String(option.unit_id || option.unit?.id || option.id) === value)
    const convertUnitId = unitQuantity?.convert_unit_id ? String(unitQuantity.convert_unit_id) : ""

    updateItem(item.id, "unit_id", value)
    updateItem(item.id, "convert_unit_id", convertUnitId)
    updateItem(item.id, "convert_unit_label", "")
    setUnitSiblingOptions((current) => {
      const next = { ...current }
      delete next[item.id]
      return next
    })
  }

  const openOptionsModal = (item: PurchaseItemForm) => {
    setOptionDraft({
      expiration_date: item.expiration_date || "",
      tax_type: item.tax_type,
    })
    setChoiceModal({ type: "options", itemId: item.id })
  }

  const saveOptionsModal = () => {
    if (!choiceModal) return
    updateItem(choiceModal.itemId, "expiration_date", optionDraft.expiration_date)
    updateItem(choiceModal.itemId, "tax_type", optionDraft.tax_type)
    setChoiceModal(null)
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.provider_id) nextErrors.provider_id = t("Provider is required")
    if (!formData.invoice_date) nextErrors.invoice_date = t("Invoice date is required")
    if (!formData.delivery_status) nextErrors.delivery_status = t("Delivery status is required")
    if (!formData.payment_status) nextErrors.payment_status = t("Payment status is required")
    if (!items.length) {
      nextErrors.products = t("Unable to proceed, no product were provided.")
    }
    items.forEach((item, index) => {
      if (!item.product_id) nextErrors[`product_${index}`] = t("Product is required")
      if (!item.unit_id) nextErrors[`unit_${index}`] = t("Unit is required")
      if (!(money(item.quantity) >= 1)) nextErrors[`quantity_${index}`] = t("Quantity is required")
      if (!(money(item.purchase_price) >= 0)) nextErrors[`price_${index}`] = t("Purchase price is required")
    })
    setErrors(nextErrors)
    if (nextErrors.products || Object.keys(nextErrors).some((key) => key.startsWith("product_") || key.startsWith("unit_") || key.startsWith("quantity_") || key.startsWith("price_"))) {
      setActiveTab("products")
    } else if (Object.keys(nextErrors).length) {
      setActiveTab("details")
    }
    return Object.keys(nextErrors).length === 0
  }

  const procurementTabHasErrors = (tab: "details" | "products") => {
    const errorKeys = Object.keys(errors)
    if (tab === "products") {
      return errorKeys.some((key) =>
        key === "products" ||
        key.startsWith("product_") ||
        key.startsWith("unit_") ||
        key.startsWith("quantity_") ||
        key.startsWith("price_")
      )
    }
    return errorKeys.some((key) =>
      ["name", "provider_id", "invoice_date", "delivery_status", "payment_status"].includes(key)
    )
  }

  const goBack = () => router.push("/purchases")

  const buildProductPayload = (item: PurchaseItemForm) => {
    const line = computeLine(item)
    return {
      purchase_item_id: item.purchase_item_id,
      product_id: Number(item.product_id),
      unit_id: Number(item.unit_id),
      purchase_price: item.purchase_price || "0",
      quantity: item.quantity || "0",
      tax_group_id: item.tax_group_id ? Number(item.tax_group_id) : undefined,
      tax_type: item.tax_type,
      tax_value: String(line.taxValue || 0),
      total_purchase_price: String(line.total || 0),
      convert_unit_id: item.convert_unit_id ? Number(item.convert_unit_id) : undefined,
      expiration_date: item.expiration_date || undefined,
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payLoad: any = {
        provider_id: Number(formData.provider_id),
        name: formData.name || undefined,
        invoice_reference: formData.invoice_reference || undefined,
        invoice_date: formData.invoice_date || undefined,
        delivery_time: formData.delivery_time || undefined,
        automatic_approval: formData.automatic_approval,
        delivery_status: formData.delivery_status,
        payment_status: formData.payment_status,
        description: formData.description || undefined,
      }

      if (!isEdit) {
        payLoad.products = items.map(buildProductPayload)
        const response = await createPurchaseOrder(payLoad).unwrap()
        showToast.success(response?.message || t("The procurement has been created successfully."))
      } else {
        const response = await editPurchaseOrder({ id, payLoad }).unwrap()
        await bulkUpdatePurchaseOrderProducts({
          id,
          payLoad: { products: items.map(buildProductPayload) },
        }).unwrap()
        showToast.success(response?.message || t("The procurement has been updated successfully."))
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
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

  const isLoading =
    suppliers.isLoading ||
    products.isLoading ||
    taxGroups.isLoading ||
    (isEdit && purchaseOrder.isLoading)

  if (isLoading) {
    return (
      <DashboardPage padding="none">
        <div className="flex h-full items-center justify-center bg-gray-50">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <Spinner className="h-5 w-5" />
            {t("Loading procurement data...")}
          </div>
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage padding="none">
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
          </div>
        </div>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="flex min-h-full flex-col">
            <div className="flex-1 px-4 pt-4">
              <div className="mb-4">
                <UniFieldInput
                  label={t("Procurement Name")}
                  value={formData.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder={t("Enter procurement name")}
                />
                <p className="text-xs font-medium text-gray-500 mt-1">
                  {t("Provide a name that will help to identify the procurement.")}
                </p>
              </div>

              <div className="flex-none">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList variant="line" className="-mb-px w-full justify-start overflow-x-auto">
                    {(["details", "products"] as const).map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        data-invalid={procurementTabHasErrors(tab) ? true : undefined}
                        aria-invalid={procurementTabHasErrors(tab) ? true : undefined}
                      >
                        {t(tab === "details" ? "Details" : "Products")}
                        {tab === "products" ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1 text-xs font-bold text-gray-700">
                            {items.length}
                          </span>
                        ) : null}
                        {procurementTabHasErrors(tab) ? (
                          <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                            !
                          </span>
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="bg-gray-50/50 p-4">
                {activeTab === "details" && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <UniFieldInput
                        label={t("Invoice Number")}
                        placeholder={t("If the procurement has been issued outside of the POS, please provide a unique reference.")}
                        value={formData.invoice_reference}
                        onChange={(event) => updateField("invoice_reference", event.target.value)}
                      />
                      <DatePicker
                        label={t("Delivery Time")}
                        value={formData.delivery_time ? new Date(formData.delivery_time + "T00:00:00") : undefined}
                        onChange={(date) => updateField("delivery_time", date ? date.toISOString().slice(0, 10) : "")}
                      />
                      <DatePicker
                        label={t("Invoice Date")}
                        required
                        value={formData.invoice_date ? new Date(formData.invoice_date + "T00:00:00") : undefined}
                        onChange={(date) => updateField("invoice_date", date ? date.toISOString().slice(0, 10) : "")}
                        error={errors.invoice_date}
                      />
                      <UniFieldSelect
                        label={t("Automatic Approval")}
                        value={formData.automatic_approval ? "1" : "0"}
                        onValueChange={(value) => updateField("automatic_approval", value === "1")}
                      >
                        <SelectItem value="0">{t("No")}</SelectItem>
                        <SelectItem value="1">{t("Yes")}</SelectItem>
                      </UniFieldSelect>
                      <UniFieldSelect
                        label={t("Delivery Status")}
                        required
                        value={formData.delivery_status}
                        onValueChange={(value) => updateField("delivery_status", value)}
                        error={errors.delivery_status}
                      >
                        <SelectItem value="pending">{t("Pending")}</SelectItem>
                        <SelectItem value="delivered">{t("Delivered")}</SelectItem>
                      </UniFieldSelect>
                      <UniFieldSelect
                        label={t("Payment Status")}
                        required
                        value={formData.payment_status}
                        onValueChange={(value) => updateField("payment_status", value)}
                        error={errors.payment_status}
                      >
                        <SelectItem value="unpaid">{t("Unpaid")}</SelectItem>
                        <SelectItem value="paid">{t("Paid")}</SelectItem>
                      </UniFieldSelect>
                      <UniFieldSelect
                        label={t("Provider")}
                        required
                        value={formData.provider_id}
                        onValueChange={(value) => updateField("provider_id", value)}
                        placeholder={t("Select Provider")}
                        error={errors.provider_id}
                        hasOptions={Boolean(supplierOptions.length)}
                        onAddNew={() => setProviderFormOpen(true)}
                        addNewLabel={t("Add Provider")}
                      >
                        {supplierOptions.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>
                      <div className="md:col-span-3">
                        <UniFieldInput
                          as="textarea"
                          label={t("Description")}
                          placeholder={t("Enter description note")}
                          value={formData.description}
                          onChange={(event) => updateField("description", event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "products" && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="text-sm font-semibold text-gray-700">
                        {errors.products ? (
                          <span className="text-red-600">{errors.products}</span>
                        ) : t("Products")}
                      </div>
                      <div className="flex w-full gap-2 lg:w-[480px]">
                        <UniFieldSelect
                          containerClassName="flex-1"
                          value={productSearchId}
                          onValueChange={(value) => {
                            setProductSearchId(value)
                            addSelectedProduct(value)
                          }}
                          placeholder={t("Search Product")}
                          hasOptions={Boolean(productOptions.length)}
                        >
                          {productOptions.map((product: any) => (
                            <SelectItem key={product.id} value={String(product.id)}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </UniFieldSelect>
                      </div>
                    </div>

                    <div className="">
                      <Table className="w-full">
                        <TableHeader className="">
                          <TableRow className="bg-gray-50 text-left font-semibold text-gray-700">
                            <TableHead className="p-3">{t("Product")}</TableHead>
                            <TableHead className="w-44 p-3">{t("Unit Price")}</TableHead>
                            <TableHead className="w-36 p-3">{t("Tax Value")}</TableHead>
                            <TableHead className="w-36 p-3">{t("Quantity")}</TableHead>
                            <TableHead className="w-36 p-3">{t("Total Price")}</TableHead>
                            <TableHead className="w-24 p-3 text-right">{t("Options")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => {
                            const line = computeLine(item)
                            const hasRowError = errors[`product_${index}`] || errors[`unit_${index}`] || errors[`quantity_${index}`] || errors[`price_${index}`]
                            return (
                              <TableRow
                                key={item.id}
                                className={cn(
                                  "align-top",
                                  hasRowError && "bg-red-50"
                                )}
                              >
                                <TableCell className="p-3">
                                  <div className="space-y-2">
                                    <div>
                                      <div className="font-semibold text-gray-900">
                                        {item.product_name || t("Select product")}
                                      </div>
                                      {errors[`product_${index}`] ? (
                                        <div className="text-xs font-medium text-red-600">{errors[`product_${index}`]}</div>
                                      ) : null}
                                      {errors[`unit_${index}`] ? (
                                        <div className="text-xs font-medium text-red-600">{errors[`unit_${index}`]}</div>
                                      ) : null}
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setChoiceModal({ type: "unit", itemId: item.id })}
                                      >
                                        {t("Unit")}: {getUnitName(item)}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setChoiceModal({ type: "convert", itemId: item.id })}
                                      >
                                        {t("Convert Unit")}: {getConvertUnitName(item)}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setChoiceModal({ type: "tax", itemId: item.id })}
                                      >
                                        {t("Tax")}: {getTaxName(item)}
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="p-3">
                                  <UniFieldInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    prefix={posOptions.currency_symbol}
                                    value={item.purchase_price}
                                    onChange={(event) => updateItem(item.id, "purchase_price", event.target.value)}
                                    error={errors[`price_${index}`]}
                                  />
                                </TableCell>
                                <TableCell className="p-3 font-medium text-gray-700">
                                  {formatMoney(line.taxValue)}
                                </TableCell>
                                <TableCell className="p-3">
                                  <UniFieldInput
                                    type="number"
                                    min="1"
                                    step="0.001"
                                    value={item.quantity}
                                    onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                                    error={errors[`quantity_${index}`]}
                                  />
                                </TableCell>
                                <TableCell className="p-3 font-semibold text-gray-900">
                                  {formatMoney(line.total)}
                                </TableCell>
                                <TableCell className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="size-9"
                                      onClick={() => openOptionsModal(item)}
                                    >
                                      <Settings2Icon className="size-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="size-9 text-red-500 hover:text-red-700"
                                      disabled={isStocked}
                                      onClick={() => handleRemoveItem(item)}
                                    >
                                      <Trash2Icon className="size-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                          {items.length === 0 ? (
                            <TableRow>
                              <TableCell className="p-8 text-center text-sm font-medium text-gray-400" colSpan={6}>
                                {t("No product were provided.")}
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow className="bg-gray-50 font-semibold text-gray-900">
                              <TableCell className="p-3" colSpan={2} />
                              <TableCell className="p-3">{formatMoney(totals.tax)}</TableCell>
                              <TableCell className="p-3" />
                              <TableCell className="p-3">{formatMoney(totals.total)}</TableCell>
                              <TableCell className="p-3" />
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {choiceModal ? (() => {
                  const item = items.find((entry) => entry.id === choiceModal.itemId)
                  if (!item) return null
                  const unitOptions = getItemUnitOptions(item)
                  const convertOptions = getConvertUnitOptions(item)

                  if (choiceModal.type === "unit") {
                    return (
                      <CustomModal
                        open
                        onOpenChange={(open) => !open && setChoiceModal(null)}
                        title={t("{product}: Purchase Unit").replace("{product}", item.product_name || t("Product"))}
                        description={t("The product will be procured on that unit.")}
                        showFooter={false}
                      >
                        <div className="space-y-2">
                          {unitOptions.map((unitQuantity: any) => {
                            const unit = unitQuantity.unit || unitQuantity
                            const value = String(unitQuantity.unit_id || unit.id)
                            return (
                              <Button
                                key={unitQuantity.id || value}
                                type="button"
                                variant={item.unit_id === value ? "default" : "outline"}
                                className="w-full justify-start"
                                onClick={() => {
                                  selectUnitForItem(item, value)
                                  setChoiceModal(null)
                                }}
                              >
                                {unit.name}
                              </Button>
                            )
                          })}
                        </div>
                      </CustomModal>
                    )
                  }

                  if (choiceModal.type === "convert") {
                    return (
                      <CustomModal
                        open
                        onOpenChange={(open) => !open && setChoiceModal(null)}
                        title={t("Convert Unit")}
                        description={t("The unit selected for conversion by default.")}
                        showFooter={false}
                      >
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant={!item.convert_unit_id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => {
                              updateItem(item.id, "convert_unit_id", "")
                              updateItem(item.id, "convert_unit_label", "")
                              setChoiceModal(null)
                            }}
                          >
                            {t("N/A")}
                          </Button>
                          {convertOptions.map((unit: any) => (
                            <Button
                              key={unit.id}
                              type="button"
                              variant={item.convert_unit_id === String(unit.id) ? "default" : "outline"}
                              className="w-full justify-start"
                              onClick={() => {
                                updateItem(item.id, "convert_unit_id", String(unit.id))
                                updateItem(item.id, "convert_unit_label", unit.name || "")
                                setChoiceModal(null)
                              }}
                            >
                              {unit.name}
                            </Button>
                          ))}
                        </div>
                      </CustomModal>
                    )
                  }

                  if (choiceModal.type === "tax") {
                    return (
                      <CustomModal
                        open
                        onOpenChange={(open) => !open && setChoiceModal(null)}
                        title={t("Choose Tax")}
                        description={t("The tax will be assigned to the procured product.")}
                        showFooter={false}
                      >
                        <div className="space-y-2">
                          {taxGroupOptions.map((tax: any) => (
                            <Button
                              key={tax.id}
                              type="button"
                              variant={item.tax_group_id === String(tax.id) ? "default" : "outline"}
                              className="w-full justify-start"
                              onClick={() => {
                                updateItem(item.id, "tax_group_id", String(tax.id))
                                setChoiceModal(null)
                              }}
                            >
                              {tax.name}
                            </Button>
                          ))}
                        </div>
                      </CustomModal>
                    )
                  }

                  return (
                    <CustomModal
                      open
                      onOpenChange={(open) => !open && setChoiceModal(null)}
                      title={t("Options")}
                      onSave={saveOptionsModal}
                    >
                      <div className="space-y-4">
                        <DatePicker
                          label={t("Expiration Date")}
                          value={optionDraft.expiration_date ? new Date(optionDraft.expiration_date + "T00:00:00") : undefined}
                          onChange={(date) => setOptionDraft((current) => ({ ...current, expiration_date: date ? date.toISOString().slice(0, 10) : "" }))}
                        />
                        <UniFieldSelect
                          label={t("Tax Type")}
                          value={optionDraft.tax_type}
                          onValueChange={(value) => setOptionDraft((current) => ({ ...current, tax_type: value === "exclusive" ? "exclusive" : "inclusive" }))}
                        >
                          <SelectItem value="inclusive">{t("Inclusive")}</SelectItem>
                          <SelectItem value="exclusive">{t("Exclusive")}</SelectItem>
                        </UniFieldSelect>
                      </div>
                    </CustomModal>
                  )
                })() : null}

              </div>
            </div>

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
                <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
                  {t("Cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-32 bg-black text-white hover:bg-black/90">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      {t("Saving...")}
                    </span>
                  ) : (
                    t("Save Procurement")
                  )}
                </Button>
              </div>
            </footer>
          </form>
        </div>
      </div>
      <ProviderForm
        isOpen={providerFormOpen}
        onClose={() => setProviderFormOpen(false)}
        onSuccess={async (newProvider: any) => {
          setProviderFormOpen(false)
          await getSuppliersDropdown()
          const newId = newProvider?.data?.id
          if (newId) updateField("provider_id", String(newId))
        }}
      />
    </DashboardPage>
  )
}
