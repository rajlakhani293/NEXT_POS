"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckIcon,
  ChevronDownIcon,
  Pencil,
  Plus,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react"

import { CategoryForm } from "@/app/(dashboard)/inventory/categories/createUpdate"
import { UnitForm } from "@/app/(dashboard)/inventory/units/createUpdate"
import { TaxGroupForm } from "@/app/(dashboard)/settings/tax-groups/createUpdate"
import { ImageUpload } from "@/components/imageUpload"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SelectItem, SelectItemText } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

function TaxModeDropdown({
  isInclusive,
  onChange,
}: {
  isInclusive: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-28 border-2 bg-muted/30 px-3 text-sm font-semibold text-gray-700 shadow-none"
        >
          {isInclusive ? "with Tax" : "without Tax"}
          <ChevronDownIcon className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuItem
          onClick={() => onChange(true)}
          className={cn(
            isInclusive && "bg-accent font-semibold text-accent-foreground"
          )}
        >
          {isInclusive ? (
            <CheckIcon className="size-4" />
          ) : (
            <span className="size-4" />
          )}
          with Tax
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange(false)}
          className={cn(
            !isInclusive && "bg-accent font-semibold text-accent-foreground"
          )}
        >
          {!isInclusive ? (
            <CheckIcon className="size-4" />
          ) : (
            <span className="size-4" />
          )}
          without Tax
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type ProductFormValues = {
  name: string
  sku: string
  barcode: string
  barcode_type: string
  image: File | null
  weight: string
  category_id: string
  tax_group_id: string
  unit_id: string
  product_type: "product" | "service"
  description: string
  purchase_price: string
  selling_price: string
  mrp: string
  wholesale_price: string
  is_tax_inclusive: boolean
  opening_stock: string
  min_stock: string
  max_stock: string
  track_stock: boolean
  allow_decimal_qty: boolean
  expiry_tracking_enabled: boolean
  pinned: boolean
  accurate_tracking: boolean
  auto_cogs: boolean
  expires: boolean
  on_expiration: string
  status: string
}

type ProductUnitQuantityFormValues = {
  id?: number
  unit_id: string
  convert_unit_id: string
  barcode: string
  quantity: string
  sale_price: string
  purchase_price: string
  is_default: boolean
  scale_plu: string
}

const initialValues: ProductFormValues = {
  name: "",
  sku: "",
  barcode: "",
  barcode_type: "code128",
  image: null,
  weight: "",
  category_id: "",
  tax_group_id: "",
  unit_id: "",
  product_type: "product",
  description: "",
  purchase_price: "",
  selling_price: "",
  mrp: "",
  wholesale_price: "",
  is_tax_inclusive: false,
  opening_stock: "",
  min_stock: "",
  max_stock: "",
  track_stock: true,
  allow_decimal_qty: false,
  expiry_tracking_enabled: false,
  pinned: false,
  accurate_tracking: false,
  auto_cogs: true,
  expires: false,
  on_expiration: "prevent_sales",
  status: "0",
}

const initialUnitQuantityValues: ProductUnitQuantityFormValues = {
  unit_id: "",
  convert_unit_id: "",
  barcode: "",
  quantity: "",
  sale_price: "",
  purchase_price: "",
  is_default: false,
  scale_plu: "",
}

const toOption = (items: any[] = []) =>
  items.map((item) => ({
    label: item.short_name ? `${item.name} (${item.short_name})` : item.name,
    value: String(item.id),
  }))

const appendIfPresent = (formData: FormData, key: string, value: any) => {
  if (value === undefined || value === null || value === "") return
  formData.append(key, String(value))
}

const generateBarcode = () => {
  const base = Date.now().toString().slice(-10)
  const check = Math.floor(Math.random() * 90 + 10).toString()
  return `${base}${check}`
}

function buildDefaultUnitQuantityPayload(values: ProductFormValues) {
  return {
    unit_id: Number(values.unit_id),
    barcode: values.barcode || "",
    quantity:
      values.product_type === "product" ? values.opening_stock || "0" : "0",
    low_quantity:
      values.product_type === "product" ? values.min_stock || "0" : "0",
    sale_price: values.selling_price || "0",
    sale_price_edit: values.selling_price || "0",
    wholesale_price: values.wholesale_price || "0",
    wholesale_price_edit: values.wholesale_price || "0",
    cogs: values.purchase_price || "0",
    stock_alert_enabled: values.product_type === "product",
    visible: true,
  }
}

function buildProductFormData(values: ProductFormValues, isEdit: boolean, unitsList: any[] = []) {
  const formData = new FormData()

  appendIfPresent(formData, "name", values.name)
  appendIfPresent(formData, "sku", values.sku)
  appendIfPresent(formData, "barcode", values.barcode)
  appendIfPresent(formData, "barcode_type", values.barcode_type)
  appendIfPresent(formData, "weight", values.weight || "0")
  appendIfPresent(formData, "category_id", values.category_id)
  appendIfPresent(formData, "tax_group_id", values.tax_group_id)
  appendIfPresent(formData, "unit_id", values.unit_id)
  
  const selectedUnit = (unitsList || []).find((u: any) => String(u.id) === String(values.unit_id))
  if (selectedUnit?.group_id) {
    formData.append("unit_group_id", String(selectedUnit.group_id))
  }

  appendIfPresent(formData, "product_type", "product")
  appendIfPresent(
    formData,
    "type",
    values.product_type === "service" ? "dematerialized" : "materialized"
  )
  appendIfPresent(
    formData,
    "tax_type",
    values.is_tax_inclusive ? "inclusive" : "exclusive"
  )
  appendIfPresent(formData, "description", values.description)
  appendIfPresent(formData, "purchase_price", values.purchase_price || "0")
  appendIfPresent(formData, "selling_price", values.selling_price || "0")
  appendIfPresent(formData, "mrp", values.mrp || "0")
  appendIfPresent(formData, "wholesale_price", values.wholesale_price || "0")

  if (values.product_type === "product") {
    appendIfPresent(formData, "min_stock", values.min_stock || "0")
    appendIfPresent(formData, "max_stock", values.max_stock || "0")
    if (!isEdit) {
      appendIfPresent(formData, "opening_stock", values.opening_stock || "0")
    }
  }

  formData.append("is_tax_inclusive", String(Boolean(values.is_tax_inclusive)))
  formData.append(
    "track_stock",
    String(values.product_type === "product" && Boolean(values.track_stock))
  )
  formData.append(
    "stock_management",
    values.product_type === "product" && values.track_stock
      ? "enabled"
      : "disabled"
  )
  formData.append(
    "allow_decimal_qty",
    String(Boolean(values.allow_decimal_qty))
  )
  formData.append(
    "expiry_tracking_enabled",
    String(
      values.product_type === "product" &&
        Boolean(values.expiry_tracking_enabled)
    )
  )
  formData.append(
    "expires",
    String(
      values.product_type === "product" &&
        Boolean(values.expires)
    )
  )
  appendIfPresent(formData, "on_expiration", values.on_expiration)
  formData.append("pinned", String(Boolean(values.pinned)))
  formData.append("accurate_tracking", String(Boolean(values.accurate_tracking)))
  formData.append("auto_cogs", String(Boolean(values.auto_cogs)))
  formData.append("status", String(values.status))

  if (values.image instanceof File) {
    formData.append("image", values.image)
  }

  return formData
}

export default function ProductFormPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const id = params.id as string
  const isEdit = id !== "create"
  const currencySymbol = posOptions.currency_symbol

  const [formData, setFormData] = useState<ProductFormValues>(initialValues)
  const [activeTab, setActiveTab] = useState<"identification" | "units" | "expiry" | "taxes" | "images">("identification")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [imageError, setImageError] = useState("")
  const [initialImageUrl, setInitialImageUrl] = useState("")
  const [gallery, setGallery] = useState<any[]>([])
  
  const [addProductGalleryImage, { isLoading: isUploadingGallery }] = (
    catalog as any
  ).useAddProductGalleryImageMutation()
  const [deleteProductGalleryImage] = (
    catalog as any
  ).useDeleteProductGalleryImageMutation()

  const handleUploadGalleryImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const formDataPayload = new FormData()
    formDataPayload.append("image", file)
    try {
      const response = await addProductGalleryImage({
        productId: id,
        payLoad: formDataPayload,
      }).unwrap()
      showToast.success(response?.message || t("Gallery image uploaded successfully."))
      // Refetch product data to refresh gallery list
      const result = await getProductById({ id }).unwrap()
      setGallery(result?.data?.gallery || [])
    } catch (err) {
      console.error(err)
      showToast.error(t("Failed to upload gallery image."))
    }
  }

  const handleDeleteGalleryImage = async (galleryId: any) => {
    try {
      const response = await deleteProductGalleryImage({
        productId: id,
        id: galleryId,
      }).unwrap()
      showToast.success(response?.message || t("Gallery image deleted successfully."))
      // Refetch product data to refresh gallery list
      const result = await getProductById({ id }).unwrap()
      setGallery(result?.data?.gallery || [])
    } catch (err) {
      console.error(err)
      showToast.error(t("Failed to delete gallery image."))
    }
  }

  const [unitQuantityForm, setUnitQuantityForm] =
    useState<ProductUnitQuantityFormValues>(initialUnitQuantityValues)

  const [unitQuantityErrors, setUnitQuantityErrors] = useState<
    Record<string, string>
  >({})
  const [isSavingUnitQuantity, setIsSavingUnitQuantity] = useState(false)
  const [addFormOpen, setAddFormOpen] = useState<
    "category" | "unit" | "taxGroup" | null
  >(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const paginationSentinelRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")

  const [createProduct] = (catalog as any).useCreateProductMutation()
  const [editProduct] = (catalog as any).useEditProductMutation()
  const [getProductById, product] = (catalog as any).useGetProductByIdMutation()
  const [getProductUnitQuantities, unitQuantities] = (
    catalog as any
  ).useGetProductUnitQuantitiesMutation()
  const [createProductUnitQuantity] = (
    catalog as any
  ).useCreateProductUnitQuantityMutation()
  const [editProductUnitQuantity] = (
    catalog as any
  ).useEditProductUnitQuantityMutation()
  const [deleteProductUnitQuantity] = (
    catalog as any
  ).useDeleteProductUnitQuantityMutation()
  const [getCategoriesDropdown, categories] = (
    catalog as any
  ).useGetCategoriesDropdownMutation()
  const [getTaxGroupsDropdown, taxGroups] = (
    catalog as any
  ).useGetTaxGroupsDropdownMutation()
  const [getUnitsDropdown, units] = (catalog as any).useGetUnitsDropdownMutation()

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await Promise.all([
        getCategoriesDropdown(),
        getTaxGroupsDropdown(),
        getUnitsDropdown(),
      ])

      if (!isEdit) {
        setFormData(initialValues)
        setInitialImageUrl("")
        setImageError("")
        return
      }

      const result = await getProductById({ id }).unwrap()
      const unitQuantitiesResponse = await getProductUnitQuantities({
        productId: id,
      }).unwrap()
      const record = result?.data
      if (!record) return
      const primaryUnitQuantity = (unitQuantitiesResponse?.data || [])[0]

      setInitialImageUrl(record.image || "")
      setImageError("")
      setFormData({
        ...initialValues,
        ...record,
        image: null,
        product_type: record.type === "dematerialized" ? "service" : "product",
        category_id: record.category_id ? String(record.category_id) : "",
        tax_group_id: record.tax_group_id ? String(record.tax_group_id) : "",
        unit_id: primaryUnitQuantity?.unit_id
          ? String(primaryUnitQuantity.unit_id)
          : "",
        purchase_price: primaryUnitQuantity?.cogs
          ? String(primaryUnitQuantity.cogs)
          : "",
        selling_price: primaryUnitQuantity?.sale_price
          ? String(primaryUnitQuantity.sale_price)
          : "",
        wholesale_price: primaryUnitQuantity?.wholesale_price
          ? String(primaryUnitQuantity.wholesale_price)
          : "",
        min_stock: primaryUnitQuantity?.low_quantity
          ? String(primaryUnitQuantity.low_quantity)
          : "",
        is_tax_inclusive: record.tax_type === "inclusive",
        barcode_type: record.barcode_type || "code128",
        pinned: Boolean(record.pinned),
        accurate_tracking: Boolean(record.accurate_tracking),
        auto_cogs: record.auto_cogs !== false,
        expires: Boolean(record.expires),
        on_expiration: record.on_expiration || "prevent_sales",
        status: record.status !== undefined ? String(record.status) : "0",
      })
      setGallery(record.gallery || [])
    }

    load()
  }, [
    getCategoriesDropdown,
    getProductById,
    getProductUnitQuantities,
    getTaxGroupsDropdown,
    getUnitsDropdown,
    id,
    isEdit,
  ])

  const isStockProduct = formData.product_type === "product"
  const isLoading =
    categories.isLoading ||
    taxGroups.isLoading ||
    units.isLoading ||
    (isEdit && product.isLoading)

  useEffect(() => {
    const sentinel = paginationSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterStuck(!entry.isIntersecting),
      {
        threshold: 0.01,
        rootMargin: "0px 0px -80px 0px",
        root: contentRef.current,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLoading])

  const updateField = (name: keyof ProductFormValues, value: any) => {
    setFormData((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.name.trim()) nextErrors.name = t("Name is required")
    if (!formData.selling_price)
      nextErrors.selling_price = t("Selling price is required")
    if (!formData.unit_id) nextErrors.unit_id = t("Primary unit is required")
    if (imageError) nextErrors.image = imageError
    if (formData.is_tax_inclusive && !formData.tax_group_id) {
      nextErrors.tax_group_id = t("Tax is required when inclusive of tax")
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/inventory/products")

  const handleAddFormSuccess = async (
    type: "category" | "unit" | "taxGroup"
  ) => {
    if (type === "category") await getCategoriesDropdown()
    if (type === "unit") await getUnitsDropdown()
    if (type === "taxGroup") await getTaxGroupsDropdown()
    setAddFormOpen(null)
  }

  const updateUnitQuantityField = (
    name: keyof ProductUnitQuantityFormValues,
    value: any
  ) => {
    setUnitQuantityForm((current) => ({ ...current, [name]: value }))
    if (unitQuantityErrors[name]) {
      setUnitQuantityErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const resetUnitQuantityForm = () => {
    setUnitQuantityForm(initialUnitQuantityValues)
    setUnitQuantityErrors({})
  }

  const validateUnitQuantity = () => {
    const nextErrors: Record<string, string> = {}
    if (!unitQuantityForm.unit_id) nextErrors.unit_id = t("Unit is required")
    if (!unitQuantityForm.quantity)
      nextErrors.quantity = t("Quantity is required")
    setUnitQuantityErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSaveUnitQuantity = async () => {
    if (!validateUnitQuantity()) return

    setIsSavingUnitQuantity(true)
    try {
      const payLoad = {
        unit_id: Number(unitQuantityForm.unit_id),
        convert_unit_id: unitQuantityForm.convert_unit_id
          ? Number(unitQuantityForm.convert_unit_id)
          : null,
        barcode: unitQuantityForm.barcode,
        quantity: unitQuantityForm.quantity || "1",
        sale_price: unitQuantityForm.sale_price || "0",
        cogs: unitQuantityForm.purchase_price || "0",
        is_default: unitQuantityForm.is_default,
        scale_plu: unitQuantityForm.scale_plu,
      }

      if (unitQuantityForm.id) {
        const response = await editProductUnitQuantity({
          productId: id,
          id: unitQuantityForm.id,
          payLoad,
        }).unwrap()
        showToast.success(
          response?.message || t("Product unit quantity updated successfully.")
        )
      } else {
        const response = await createProductUnitQuantity({
          productId: id,
          payLoad,
        }).unwrap()
        showToast.success(
          response?.message || t("Product unit quantity created successfully.")
        )
      }

      resetUnitQuantityForm()
      await getProductUnitQuantities({ productId: id })
    } finally {
      setIsSavingUnitQuantity(false)
    }
  }

  const handleEditUnitQuantity = (record: any) => {
    setUnitQuantityForm({
      id: record.id,
      unit_id: record.unit_id ? String(record.unit_id) : "",
      convert_unit_id: record.convert_unit_id
        ? String(record.convert_unit_id)
        : "",
      barcode: record.barcode || "",
      quantity: record.quantity ? String(record.quantity) : "",
      sale_price: record.sale_price ? String(record.sale_price) : "",
      purchase_price: record.cogs ? String(record.cogs) : "",
      is_default: Boolean(record.is_default),
      scale_plu: record.scale_plu || "",
    })
    setUnitQuantityErrors({})
  }

  const handleDeleteUnitQuantity = async (record: any) => {
    const response = await deleteProductUnitQuantity({
      productId: id,
      id: record.id,
    }).unwrap()
    showToast.success(
      response?.message || t("Product unit quantity deleted successfully.")
    )
    await getProductUnitQuantities({ productId: id })
    if (unitQuantityForm.id === record.id) {
      resetUnitQuantityForm()
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payLoad = buildProductFormData(formData, isEdit, units.data?.data || [])
      if (isEdit) {
        const response = await editProduct({ id, payLoad }).unwrap()
        showToast.success(response?.message || t("Product updated successfully."))
      } else {
        const response = await createProduct(payLoad).unwrap()
        const productId = response?.data?.id
        if (productId && formData.unit_id) {
          await createProductUnitQuantity({
            productId,
            payLoad: buildDefaultUnitQuantityPayload(formData),
          }).unwrap()
        }
        showToast.success(response?.message || t("Product created successfully."))
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading product data...")}
        </div>
      </div>
    )
  }

  return (
    <>
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
                {isEdit ? t("Edit Product") : t("Create Product")}
              </h1>
              <p className="text-xs font-medium text-gray-500">
                {t("Product details, pricing, tax and inventory setup.")}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector Header */}
        <div className="flex-none border-b border-gray-200 bg-gray-50/50 px-4">
          <div className="flex gap-4">
            {(["identification", "units", "expiry", "taxes", "images"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "border-b-2 px-4 py-4 text-sm font-bold capitalize transition-all duration-200 -mb-px",
                  activeTab === tab
                    ? "border-black text-black"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                )}
              >
                {t(tab === "expiry" ? "Expiry" : tab)}
              </button>
            ))}
          </div>
        </div>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <form onSubmit={handleSubmit} noValidate className="max-w-4xl mx-auto space-y-6">
            
            {/* Main Name Field */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <UniFieldInput
                label={t("Name")}
                required
                placeholder={t("Enter Product Name")}
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                error={errors.name}
              />
            </div>

            {/* Tab Content Panel */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              
              {/* 1. Identification Tab */}
              {activeTab === "identification" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <UniFieldSelect
                      label={t("Category")}
                      required
                      value={formData.category_id}
                      onValueChange={(value) => updateField("category_id", value)}
                      placeholder={t("Select Category")}
                      error={errors.category_id}
                      allowClear
                      onAddNew={() => setAddFormOpen("category")}
                      addNewLabel={t("Add New Category")}
                    >
                      {toOption(categories.data?.data).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>

                    <UniFieldSelect
                      label={t("Product Type")}
                      value={formData.product_type}
                      onValueChange={(value) => updateField("product_type", value as any)}
                    >
                      <SelectItem value="product">{t("Materialized Product")}</SelectItem>
                      <SelectItem value="service">{t("Dematerialized Product")}</SelectItem>
                    </UniFieldSelect>

                    <UniFieldInput
                      label={t("SKU")}
                      placeholder={t("Enter SKU")}
                      value={formData.sku}
                      onChange={(event) => updateField("sku", event.target.value)}
                    />

                    <UniFieldSelect
                      label={t("Status")}
                      value={formData.status}
                      onValueChange={(value) => updateField("status", value)}
                    >
                      <SelectItem value="0">{t("On Sale")}</SelectItem>
                      <SelectItem value="1">{t("Hidden")}</SelectItem>
                    </UniFieldSelect>

                    <UniFieldInput
                      label={t("Barcode")}
                      placeholder="2273546838467"
                      value={formData.barcode}
                      onChange={(event) => updateField("barcode", event.target.value)}
                      suffix={
                        <button
                          type="button"
                          onClick={() => updateField("barcode", generateBarcode())}
                          className="flex min-w-32 items-center justify-center gap-1.5 text-xs font-semibold text-gray-800"
                        >
                          <WandSparkles className="size-3.5" />
                          {t("Auto Generate")}
                        </button>
                      }
                    />

                    <UniFieldSelect
                      label={t("Barcode Type")}
                      value={formData.barcode_type}
                      onValueChange={(value) => updateField("barcode_type", value)}
                    >
                      <SelectItem value="ean8">EAN 8</SelectItem>
                      <SelectItem value="ean13">EAN 13</SelectItem>
                      <SelectItem value="codabar">Codabar</SelectItem>
                      <SelectItem value="code128">Code 128</SelectItem>
                      <SelectItem value="code39">Code 39</SelectItem>
                      <SelectItem value="code11">Code 11</SelectItem>
                      <SelectItem value="upca">UPC A</SelectItem>
                      <SelectItem value="upce">UPC E</SelectItem>
                    </UniFieldSelect>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t("Stock Management Enabled")}</div>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Enable stock tracking on this item.")}</p>
                      </div>
                      <Switch
                        checked={Boolean(formData.track_stock)}
                        disabled={formData.product_type !== "product"}
                        onCheckedChange={(checked) => updateField("track_stock", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t("Pin Product")}</div>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Pin this product to show at top of POS grid.")}</p>
                      </div>
                      <Switch
                        checked={Boolean(formData.pinned)}
                        onCheckedChange={(checked) => updateField("pinned", checked)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <UniFieldInput
                      as="textarea"
                      label={t("Description")}
                      placeholder={t("Enter a detailed description...")}
                      value={formData.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* 2. Units Tab */}
              {activeTab === "units" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <UniFieldSelect
                      label={t("Primary Unit")}
                      required
                      value={formData.unit_id}
                      onValueChange={(value) => updateField("unit_id", value)}
                      placeholder={t("Select Unit")}
                      error={errors.unit_id}
                      onAddNew={() => setAddFormOpen("unit")}
                      addNewLabel={t("Add New Unit")}
                    >
                      {toOption(units.data?.data).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t("Accurate Tracking")}</div>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Strictly track every sale and inventory step.")}</p>
                      </div>
                      <Switch
                        checked={Boolean(formData.accurate_tracking)}
                        disabled={formData.product_type !== "product"}
                        onCheckedChange={(checked) => updateField("accurate_tracking", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t("Auto COGS")}</div>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Compute cost of goods sold automatically.")}</p>
                      </div>
                      <Switch
                        checked={Boolean(formData.auto_cogs)}
                        disabled={formData.product_type !== "product"}
                        onCheckedChange={(checked) => updateField("auto_cogs", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t("Allow Decimal Qty")}</div>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Allow fractional stock quantities.")}</p>
                      </div>
                      <Switch
                        checked={Boolean(formData.allow_decimal_qty)}
                        onCheckedChange={(checked) => updateField("allow_decimal_qty", checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-t border-gray-100 pt-6">
                    <UniFieldInput
                      label={t("Sale Price")}
                      required
                      placeholder={t("Enter Sale Price")}
                      type="number"
                      min="0"
                      step="0.01"
                      prefix={currencySymbol}
                      value={formData.selling_price}
                      onChange={(event) => updateField("selling_price", event.target.value)}
                      error={errors.selling_price}
                    />

                    <UniFieldInput
                      label={t("Wholesale Price")}
                      type="number"
                      placeholder={t("Enter Wholesale Price")}
                      min="0"
                      step="0.01"
                      prefix={currencySymbol}
                      value={formData.wholesale_price}
                      onChange={(event) => updateField("wholesale_price", event.target.value)}
                    />

                    <UniFieldInput
                      label={t("COGS")}
                      type="number"
                      placeholder={t("Enter COGS")}
                      min="0"
                      step="0.01"
                      prefix={currencySymbol}
                      value={formData.purchase_price}
                      onChange={(event) => updateField("purchase_price", event.target.value)}
                    />

                    <UniFieldInput
                      label={t("MRP")}
                      type="number"
                      placeholder={t("Enter MRP")}
                      min="0"
                      step="0.01"
                      prefix={currencySymbol}
                      value={formData.mrp}
                      onChange={(event) => updateField("mrp", event.target.value)}
                    />

                    <UniFieldInput
                      label={t("Weight")}
                      type="number"
                      placeholder={t("Enter Weight")}
                      min="0"
                      step="0.001"
                      value={formData.weight}
                      onChange={(event) => updateField("weight", event.target.value)}
                    />
                  </div>

                  {isStockProduct && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 border-t border-gray-100 pt-6">
                      {!isEdit && (
                        <UniFieldInput
                          label={t("Opening Stock")}
                          type="number"
                          placeholder={t("Enter Opening Stock")}
                          min="0"
                          step="0.001"
                          value={formData.opening_stock}
                          onChange={(event) => updateField("opening_stock", event.target.value)}
                        />
                      )}
                      <UniFieldInput
                        label={t("Low Quantity")}
                        type="number"
                        placeholder={t("Enter Low Quantity")}
                        min="0"
                        step="0.001"
                        value={formData.min_stock}
                        onChange={(event) => updateField("min_stock", event.target.value)}
                      />
                      <UniFieldInput
                        label={t("Max Stock")}
                        type="number"
                        placeholder={t("Enter Max Stock")}
                        min="0"
                        step="0.001"
                        value={formData.max_stock}
                        onChange={(event) => updateField("max_stock", event.target.value)}
                      />
                    </div>
                  )}

                  {isEdit && (
                    <div className="border-t border-gray-100 pt-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{t("Selling Units (Alternate Units)")}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Manage conversions and custom unit prices.")}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {(unitQuantities.data?.data || []).map((record: any) => (
                          <div key={record.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">{record.unit_name}</span>
                                {record.is_default && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{t("Default")}</span>}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {Number(record.quantity).toLocaleString()} {record.convert_unit_short_name || t("base unit")} {t("per")} {record.unit_short_name || record.unit_name}
                              </p>
                              <p className="text-xs font-bold text-gray-800 mt-1">
                                {t("Sale")}: {currencySymbol}{Number(record.sale_price).toFixed(2)} · {t("Buy/COGS")}: {currencySymbol}{Number(record.cogs).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => handleEditUnitQuantity(record)}>{t("Edit")}</Button>
                              <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteUnitQuantity(record)}>{t("Delete")}</Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{unitQuantityForm.id ? t("Edit Alternate Unit") : t("Add Alternate Unit")}</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <UniFieldSelect
                            label={t("Assigned Unit")}
                            required
                            value={unitQuantityForm.unit_id}
                            onValueChange={(val) => updateUnitQuantityField("unit_id", val)}
                            placeholder={t("Select Unit")}
                            error={unitQuantityErrors.unit_id}
                          >
                            {toOption(units.data?.data).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </UniFieldSelect>

                          <UniFieldSelect
                            label={t("Convert Unit")}
                            value={unitQuantityForm.convert_unit_id}
                            onValueChange={(val) => updateUnitQuantityField("convert_unit_id", val)}
                            placeholder={t("Select Convert Unit")}
                          >
                            {toOption(units.data?.data).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </UniFieldSelect>

                          <UniFieldInput
                            label={t("Factor")}
                            required
                            placeholder={t("e.g. 12")}
                            value={unitQuantityForm.quantity}
                            onChange={(e) => updateUnitQuantityField("quantity", e.target.value)}
                            error={unitQuantityErrors.quantity}
                          />

                          <UniFieldInput
                            label={t("Sale Price")}
                            required
                            placeholder={t("Enter Sale Price")}
                            type="number"
                            min="0"
                            step="0.01"
                            prefix={currencySymbol}
                            value={unitQuantityForm.sale_price}
                            onChange={(e) => updateUnitQuantityField("sale_price", e.target.value)}
                            error={unitQuantityErrors.sale_price}
                          />

                          <UniFieldInput
                            label={t("COGS")}
                            placeholder={t("Enter Cost Price")}
                            type="number"
                            min="0"
                            step="0.01"
                            prefix={currencySymbol}
                            value={unitQuantityForm.purchase_price}
                            onChange={(e) => updateUnitQuantityField("purchase_price", e.target.value)}
                          />

                          <UniFieldInput
                            label={t("Barcode")}
                            placeholder={t("Enter custom barcode")}
                            value={unitQuantityForm.barcode}
                            onChange={(e) => updateUnitQuantityField("barcode", e.target.value)}
                          />

                          <UniFieldInput
                            label={t("PLU Code")}
                            placeholder={t("Enter PLU lookup code")}
                            value={unitQuantityForm.scale_plu}
                            onChange={(e) => updateUnitQuantityField("scale_plu", e.target.value)}
                          />

                          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{t("Is Default")}</div>
                              <p className="text-xs text-gray-500 mt-0.5">{t("Use as primary unit for calculations.")}</p>
                            </div>
                            <Switch
                              checked={Boolean(unitQuantityForm.is_default)}
                              onCheckedChange={(checked) => updateUnitQuantityField("is_default", checked)}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          {unitQuantityForm.id && (
                            <Button type="button" variant="outline" onClick={resetUnitQuantityForm}>{t("Cancel")}</Button>
                          )}
                          <Button type="button" onClick={handleSaveUnitQuantity} disabled={isSavingUnitQuantity}>
                            {isSavingUnitQuantity ? <Spinner /> : unitQuantityForm.id ? t("Update Selling Unit") : t("Add Selling Unit")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Expiry Tab */}
              {activeTab === "expiry" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t("Product Expires")}</div>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Track expiry date on batches/lots.")}</p>
                      </div>
                      <Switch
                        checked={Boolean(formData.expires)}
                        onCheckedChange={(checked) => {
                          updateField("expires", checked)
                          updateField("expiry_tracking_enabled", checked)
                        }}
                      />
                    </div>

                    {formData.expires && (
                      <UniFieldSelect
                        label={t("On Expiration")}
                        value={formData.on_expiration}
                        onValueChange={(value) => updateField("on_expiration", value)}
                      >
                        <SelectItem value="prevent_sales">{t("Prevent Sales")}</SelectItem>
                        <SelectItem value="allow_sales">{t("Allow Sales")}</SelectItem>
                      </UniFieldSelect>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Taxes Tab */}
              {activeTab === "taxes" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <UniFieldSelect
                      label={t("Tax Group")}
                      value={formData.tax_group_id}
                      onValueChange={(value) => updateField("tax_group_id", value)}
                      placeholder={t("Select Tax")}
                      error={errors.tax_group_id}
                      allowClear
                      onAddNew={() => setAddFormOpen("taxGroup")}
                      addNewLabel={t("Add New Tax Group")}
                    >
                      {(taxGroups.data?.data || []).map((group: any) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          <SelectItemText>
                            <div className="flex w-full items-center justify-between gap-4">
                              <span>{group.name}</span>
                              {group.taxes && group.taxes.length > 0 && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  {group.taxes.map((t: any) => `${t.name} (${t.rate}%)`).join(", ")}
                                </span>
                              )}
                            </div>
                          </SelectItemText>
                        </SelectItem>
                      ))}
                    </UniFieldSelect>

                    <UniFieldSelect
                      label={t("Tax Type")}
                      value={formData.is_tax_inclusive ? "inclusive" : "exclusive"}
                      onValueChange={(value) => updateField("is_tax_inclusive", value === "inclusive")}
                    >
                      <SelectItem value="inclusive">{t("Inclusive")}</SelectItem>
                      <SelectItem value="exclusive">{t("Exclusive")}</SelectItem>
                    </UniFieldSelect>
                  </div>
                </div>
              )}

              {/* 5. Images Tab */}
              {activeTab === "images" && (
                <div className="space-y-6">
                  <div className="max-w-md">
                    <ImageUpload
                      label={t("Product Image")}
                      value={formData.image}
                      initialUrl={initialImageUrl}
                      error={imageError || errors.image}
                      onError={setImageError}
                      onChange={(file) => {
                        updateField("image", file)
                        if (file) {
                          setInitialImageUrl("")
                        }
                      }}
                    />
                  </div>

                  {isEdit && (
                    <div className="border-t border-gray-100 pt-6 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{t("Product Gallery")}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Upload gallery images for showcase.")}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {gallery.map((img: any) => (
                          <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                            <img src={img.url} alt={img.name || t("Gallery")} className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryImage(img.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                            {img.featured && (
                              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[8px] bg-blue-600 text-white rounded font-bold uppercase">{t("Cover")}</span>
                            )}
                          </div>
                        ))}

                        <label className="flex aspect-square flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl cursor-pointer transition bg-gray-50/50 hover:bg-gray-50">
                          {isUploadingGallery ? (
                            <Spinner className="size-5 text-gray-400" />
                          ) : (
                            <>
                              <Plus className="size-6 text-gray-400" />
                              <span className="text-xs text-gray-400 mt-1">{t("Upload")}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadGalleryImage}
                            disabled={isUploadingGallery}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  className="min-w-28 bg-black text-white hover:bg-black/90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      {t("Saving...")}
                    </span>
                  ) : isEdit ? (
                    t("Update Product")
                  ) : (
                    t("Save Product")
                  )}
                </Button>
              </div>
            </footer>
          </form>
        </div>

        <CategoryForm
          isOpen={addFormOpen === "category"}
          onClose={() => setAddFormOpen(null)}
          onSuccess={() => handleAddFormSuccess("category")}
        />
        <UnitForm
          isOpen={addFormOpen === "unit"}
          onClose={() => setAddFormOpen(null)}
          onSuccess={() => handleAddFormSuccess("unit")}
        />
        <TaxGroupForm
          isOpen={addFormOpen === "taxGroup"}
          onClose={() => setAddFormOpen(null)}
          onSuccess={() => handleAddFormSuccess("taxGroup")}
        />
      </div>
    </>
  )
}
