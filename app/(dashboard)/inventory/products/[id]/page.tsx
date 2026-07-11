"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash2,
  WandSparkles,
} from "lucide-react"

import { CategoryForm } from "@/app/(dashboard)/inventory/categories/createUpdate"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { UnitForm } from "@/app/(dashboard)/inventory/units/createUpdate"
import { TaxGroupForm } from "@/app/(dashboard)/settings/tax-groups/createUpdate"
import { Button } from "@/components/ui/button"
import { SelectItem, SelectItemText } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { catalog } from "@/lib/api/catalog"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type ProductFormValues = {
  name: string
  sku: string
  barcode: string
  barcode_type: string
  image: File | null
  weight: string
  category_id: string
  tax_group_id: string
  unit_group_id: string
  unit_id: string
  product_type: "product" | "service" | "grouped"
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
  unit_group_id: "",
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

type ProductGalleryFormValues = {
  id?: number
  media_id?: number | string
  name?: string
  url: string
  featured: boolean
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

function buildProductFormData(
  values: ProductFormValues,
  isEdit: boolean,
  unitsList: any[] = [],
  sellingUnits: ProductUnitQuantityFormValues[] = [],
  images: ProductGalleryFormValues[] = []
) {
  const formData = new FormData()

  appendIfPresent(formData, "name", values.name)
  appendIfPresent(formData, "sku", values.sku)
  appendIfPresent(formData, "barcode", values.barcode)
  appendIfPresent(formData, "barcode_type", values.barcode_type)
  appendIfPresent(formData, "weight", values.weight || "0")
  appendIfPresent(formData, "category_id", values.category_id)
  appendIfPresent(formData, "tax_group_id", values.tax_group_id)
  appendIfPresent(formData, "unit_id", values.unit_id)
  appendIfPresent(formData, "unit_group_id", values.unit_group_id)

  const selectedUnit = (unitsList || []).find((u: any) => String(u.id) === String(values.unit_id))
  if (!values.unit_group_id && selectedUnit?.group_id) {
    formData.append("unit_group_id", String(selectedUnit.group_id))
  }

  appendIfPresent(formData, "product_type", "product")
  appendIfPresent(
    formData,
    "type",
    values.product_type === "service"
      ? "dematerialized"
      : values.product_type === "grouped"
        ? "grouped"
        : "materialized"
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

  formData.append("units_json", JSON.stringify({
    unit_group: values.unit_group_id || selectedUnit?.group_id || null,
    selling_group: sellingUnits.map((unit) => ({
      id: unit.id,
      unit_id: unit.unit_id ? Number(unit.unit_id) : null,
      convert_unit_id: unit.convert_unit_id ? Number(unit.convert_unit_id) : null,
      barcode: unit.barcode || "",
      quantity: unit.quantity || "1",
      sale_price: unit.sale_price || "0",
      sale_price_edit: unit.sale_price || "0",
      wholesale_price: "0",
      wholesale_price_edit: "0",
      cogs: unit.purchase_price || "0",
      stock_alert_enabled: values.product_type === "product",
      low_quantity: values.min_stock || "0",
      is_weighable: false,
      scale_plu: unit.scale_plu || "",
      visible: true,
    })),
  }))
  formData.append("images_json", JSON.stringify(
    images
      .filter((image) => image.url)
      .map((image, index) => ({
        id: image.id,
        media_id: image.media_id || null,
        name: image.name || "",
        url: image.url,
        featured: image.featured || index === 0,
      }))
  ))

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
  const currencyIndicator =
    posOptions.currency_preferred === "iso"
      ? posOptions.currency_iso
      : posOptions.currency_symbol
  const formatMoney = (value: any) => {
    const amount = Number(value || 0).toFixed(posOptions.currency_precision)
    return posOptions.currency_position === "after"
      ? `${amount}${currencyIndicator}`
      : `${currencyIndicator}${amount}`
  }

  const [formData, setFormData] = useState<ProductFormValues>(initialValues)
  const [activeTab, setActiveTab] = useState<"identification" | "units" | "expiry" | "taxes" | "images">("identification")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [gallery, setGallery] = useState<ProductGalleryFormValues[]>([])
  const [mediaSearch, setMediaSearch] = useState("")
  const [selectedMediaId, setSelectedMediaId] = useState("")
  const [selectedMediaPrimary, setSelectedMediaPrimary] = useState(false)

  const [unitQuantityForm, setUnitQuantityForm] =
    useState<ProductUnitQuantityFormValues>(initialUnitQuantityValues)
  const [draftUnitQuantities, setDraftUnitQuantities] = useState<ProductUnitQuantityFormValues[]>([])

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
  const [getUnitGroupsDropdown, unitGroups] = (
    catalog as any
  ).useGetUnitGroupsDropdownMutation()
  const [getMediaData, mediaState] = (media as any).useGetMediaDataMutation()

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      const [categoriesResponse, , unitsResponse, unitGroupsResponse] = await Promise.all([
        getCategoriesDropdown(),
        getTaxGroupsDropdown(),
        getUnitsDropdown(),
        getUnitGroupsDropdown(),
        getMediaData({ page: 1, per_page: 50 }),
      ])

      if (!isEdit) {
        const firstCategory = categoriesResponse?.data?.data?.[0]
        const firstUnit = unitsResponse?.data?.data?.[0]
        setFormData({
          ...initialValues,
          category_id: firstCategory?.id ? String(firstCategory.id) : "",
          unit_id: firstUnit?.id ? String(firstUnit.id) : "",
          unit_group_id: firstUnit?.group_id
            ? String(firstUnit.group_id)
            : unitGroupsResponse?.data?.data?.[0]?.id
              ? String(unitGroupsResponse.data.data[0].id)
              : "",
        })
        return
      }

      const result = await getProductById({ id }).unwrap()
      const unitQuantitiesResponse = await getProductUnitQuantities({
        productId: id,
      }).unwrap()
      const record = result?.data
      if (!record) return
      const primaryUnitQuantity = (unitQuantitiesResponse?.data || [])[0]

      setFormData({
        ...initialValues,
        ...record,
        image: null,
        product_type: record.type === "dematerialized" ? "service" : record.type === "grouped" ? "grouped" : "product",
        category_id: record.category_id ? String(record.category_id) : "",
        tax_group_id: record.tax_group_id ? String(record.tax_group_id) : "",
        unit_group_id: record.unit_group_id ? String(record.unit_group_id) : "",
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
      setGallery((record.gallery || []).map((image: any) => ({
        id: image.id,
        media_id: image.media_id,
        name: image.name || "",
        url: image.url || "",
        featured: Boolean(image.featured),
      })))
    }

    load()
  }, [
    getCategoriesDropdown,
    getProductById,
    getProductUnitQuantities,
    getTaxGroupsDropdown,
    getUnitsDropdown,
    getUnitGroupsDropdown,
    getMediaData,
    id,
    isEdit,
  ])

  const isStockProduct = formData.product_type === "product"
  const isLoading =
    categories.isLoading ||
    taxGroups.isLoading ||
    units.isLoading ||
    unitGroups.isLoading ||
    (isEdit && product.isLoading)
  const categoryOptions = toOption(categories.data?.data)
  const unitOptions = toOption(units.data?.data)
  const unitGroupOptions = toOption(unitGroups.data?.data)
  const filteredUnitOptions = unitOptions.filter((option) => {
    if (!formData.unit_group_id) return true
    const record = (units.data?.data || []).find((unit: any) => String(unit.id) === option.value)
    return String(record?.group_id || "") === String(formData.unit_group_id)
  })
  const taxGroupRecords = taxGroups.data?.data || []
  const mediaRecords = mediaState.data?.data?.items || mediaState.data?.data?.data || mediaState.data?.data || []

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      getMediaData({ page: 1, per_page: 50, search: mediaSearch })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [getMediaData, mediaSearch])

  const updateField = (name: keyof ProductFormValues, value: any) => {
    setFormData((current) => {
      const next = { ...current, [name]: value }
      if (name === "unit_group_id") {
        next.unit_id = ""
        setUnitQuantityForm((unitForm) => ({ ...unitForm, unit_id: "", convert_unit_id: "" }))
      }
      return next
    })
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const validateBarcodeByType = (barcode: string, barcodeType: string) => {
    if (!barcode) return ""
    const numericOnly = /^\d+$/
    const alphaNumeric = /^[0-9A-Za-z\-. $/+%]+$/
    const rules: Record<string, { pattern: RegExp; lengths?: number[]; message: string }> = {
      ean8: { pattern: numericOnly, lengths: [8], message: "EAN 8 barcode must contain exactly 8 digits." },
      ean13: { pattern: numericOnly, lengths: [13], message: "EAN 13 barcode must contain exactly 13 digits." },
      upca: { pattern: numericOnly, lengths: [12], message: "UPC A barcode must contain exactly 12 digits." },
      upce: { pattern: numericOnly, lengths: [6, 8], message: "UPC E barcode must contain 6 or 8 digits." },
      code11: { pattern: /^[0-9-]+$/, message: "Code 11 barcode can only contain digits and dashes." },
      code39: { pattern: alphaNumeric, message: "Code 39 barcode contains unsupported characters." },
      codabar: { pattern: /^[A-Da-d][0-9$:/.+\-]+[A-Da-d]$/, message: "Codabar barcode must start and end with A, B, C, or D." },
      code128: { pattern: /^[\x20-\x7E]+$/, message: "Code 128 barcode contains unsupported characters." },
    }
    const rule = rules[barcodeType]
    if (!rule) return ""
    if (!rule.pattern.test(barcode)) return t(rule.message)
    if (rule.lengths && !rule.lengths.includes(barcode.length)) return t(rule.message)
    return ""
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.name.trim()) nextErrors.name = t("Name is required")
    const barcodeError = validateBarcodeByType(formData.barcode, formData.barcode_type)
    if (barcodeError) nextErrors.barcode = barcodeError
    const sellingUnits = isEdit
      ? (unitQuantities.data?.data || []).map((record: any) => ({
          id: record.id,
          unit_id: record.unit_id ? String(record.unit_id) : "",
          convert_unit_id: record.convert_unit_id ? String(record.convert_unit_id) : "",
          barcode: record.barcode || "",
          quantity: record.quantity ? String(record.quantity) : "",
          sale_price: record.sale_price ? String(record.sale_price) : "",
          purchase_price: record.cogs ? String(record.cogs) : "",
          is_default: Boolean(record.is_default),
          scale_plu: record.scale_plu || "",
        }))
      : draftUnitQuantities
    if (!sellingUnits.length) nextErrors.unit_id = t("Selling Unit is required")
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

    if (!isEdit) {
      const nextUnit = {
        ...unitQuantityForm,
        id: unitQuantityForm.id || Date.now(),
      }
      setDraftUnitQuantities((current) => {
        const withoutCurrent = current.filter((item) => item.id !== nextUnit.id)
        return [...withoutCurrent, nextUnit]
      })
      resetUnitQuantityForm()
      return
    }

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

  const handleDeleteDraftUnitQuantity = (record: ProductUnitQuantityFormValues) => {
    setDraftUnitQuantities((current) => current.filter((item) => item.id !== record.id))
    if (unitQuantityForm.id === record.id) resetUnitQuantityForm()
  }

  const handleEditDraftUnitQuantity = (record: ProductUnitQuantityFormValues) => {
    setUnitQuantityForm(record)
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

  const selectedMedia = mediaRecords.find((record: any) => String(record.id) === selectedMediaId)

  const handleAddGalleryMedia = () => {
    if (!selectedMedia) {
      showToast.error(t("Select an image from Medias Manager."))
      return
    }
    const imageUrl = selectedMedia.url || selectedMedia.path || selectedMedia.full_url || selectedMedia.preview_url
    if (!imageUrl) {
      showToast.error(t("Selected media has no image URL."))
      return
    }
    setGallery((current) => {
      const next = [
        ...current.map((image) => selectedMediaPrimary ? { ...image, featured: false } : image),
        {
          media_id: selectedMedia.id,
          name: selectedMedia.name || selectedMedia.file_name || "",
          url: imageUrl,
          featured: selectedMediaPrimary || current.length === 0,
        },
      ]
      return next
    })
    setSelectedMediaId("")
    setSelectedMediaPrimary(false)
  }

  const handleRemoveGalleryImage = (index: number) => {
    setGallery((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSetGalleryPrimary = (index: number, value: boolean) => {
    setGallery((current) =>
      current.map((image, currentIndex) => ({
        ...image,
        featured: value ? currentIndex === index : currentIndex === index ? false : image.featured,
      }))
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const savedSellingUnits = (unitQuantities.data?.data || []).map((record: any) => ({
        id: record.id,
        unit_id: record.unit_id ? String(record.unit_id) : "",
        convert_unit_id: record.convert_unit_id ? String(record.convert_unit_id) : "",
        barcode: record.barcode || "",
        quantity: record.quantity ? String(record.quantity) : "1",
        sale_price: record.sale_price ? String(record.sale_price) : "0",
        purchase_price: record.cogs ? String(record.cogs) : "0",
        is_default: Boolean(record.is_default),
        scale_plu: record.scale_plu || "",
      }))
      const sellingUnits = isEdit ? savedSellingUnits : draftUnitQuantities
      const payLoad = buildProductFormData(formData, isEdit, units.data?.data || [], sellingUnits, gallery)
      if (isEdit) {
        const response = await editProduct({ id, payLoad }).unwrap()
        showToast.success(response?.message || t("Product updated successfully."))
      } else {
        const response = await createProduct(payLoad).unwrap()
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
    <DashboardPage padding="none">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center justify-between gap-3">
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
            <Button
              type="submit"
              form="product-form"
              disabled={isSubmitting}
              className="min-w-28 shrink-0 bg-black text-white hover:bg-black/90"
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
        </div>

        {/* Tab Selector Header */}
        <div className="flex-none border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto">
            {(["identification", "units", "expiry", "taxes", "images"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-5 py-3 text-sm font-medium whitespace-nowrap capitalize transition-colors ${activeTab === tab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
              >
                {t(
                  tab === "identification"
                    ? "Identification"
                    : tab === "units"
                      ? "Units"
                      : tab === "expiry"
                        ? "Expiry"
                        : tab === "taxes"
                          ? "Taxes"
                          : "Images"
                )}
              </button>
            ))}
          </nav>
        </div>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-6">

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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                      hasOptions={Boolean(categoryOptions.length)}
                    >
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>

                    <UniFieldInput
                      label={t("Barcode")}
                      placeholder="2273546838467"
                      value={formData.barcode}
                      onChange={(event) => updateField("barcode", event.target.value)}
                      error={errors.barcode}
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

                    <UniFieldInput
                      label={t("SKU")}
                      placeholder={t("Enter SKU")}
                      value={formData.sku}
                      onChange={(event) => updateField("sku", event.target.value)}
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

                    <UniFieldSelect
                      label={t("Product Type")}
                      value={formData.product_type}
                      onValueChange={(value) => updateField("product_type", value as any)}
                    >
                      <SelectItem value="product">{t("Materialized Product")}</SelectItem>
                      <SelectItem value="service">{t("Dematerialized Product")}</SelectItem>
                      <SelectItem value="grouped">{t("Grouped Product")}</SelectItem>
                    </UniFieldSelect>

                    <UniFieldSelect
                      label={t("Status")}
                      value={formData.status}
                      onValueChange={(value) => updateField("status", value)}
                    >
                      <SelectItem value="0">{t("On Sale")}</SelectItem>
                      <SelectItem value="1">{t("Hidden")}</SelectItem>
                    </UniFieldSelect>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 border-t border-gray-100 pt-6">
                    <UniFieldSelect
                      label={t("Stock Management Enabled")}
                      value={formData.track_stock ? "enabled" : "disabled"}
                      onValueChange={(value) => updateField("track_stock", value === "enabled")}
                      disabled={formData.product_type !== "product"}
                    >
                      <SelectItem value="enabled">{t("Yes")}</SelectItem>
                      <SelectItem value="disabled">{t("No")}</SelectItem>
                    </UniFieldSelect>

                    <UniFieldSelect
                      label={t("Pin Product")}
                      value={formData.pinned ? "1" : "0"}
                      onValueChange={(value) => updateField("pinned", value === "1")}
                    >
                      <SelectItem value="0">{t("No")}</SelectItem>
                      <SelectItem value="1">{t("Yes")}</SelectItem>
                    </UniFieldSelect>
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <UniFieldSelect
                      label={t("Unit Group")}
                      required
                      value={formData.unit_group_id}
                      onValueChange={(value) => updateField("unit_group_id", value)}
                      placeholder={t("Select Unit Group")}
                      error={errors.unit_id}
                      hasOptions={Boolean(unitGroupOptions.length)}
                    >
                      {unitGroupOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>

                    <UniFieldSelect
                      label={t("Accurate Tracking")}
                      value={formData.accurate_tracking ? "1" : "0"}
                      onValueChange={(value) => updateField("accurate_tracking", value === "1")}
                      disabled={formData.product_type !== "product"}
                    >
                      <SelectItem value="0">{t("No")}</SelectItem>
                      <SelectItem value="1">{t("Yes")}</SelectItem>
                    </UniFieldSelect>

                    <UniFieldSelect
                      label={t("Auto COGS")}
                      value={formData.auto_cogs ? "1" : "0"}
                      onValueChange={(value) => updateField("auto_cogs", value === "1")}
                      disabled={formData.product_type !== "product"}
                    >
                      <SelectItem value="0">{t("No")}</SelectItem>
                      <SelectItem value="1">{t("Yes")}</SelectItem>
                    </UniFieldSelect>
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{t("Selling Unit")}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{t("Determine the unit for sale.")}</p>
                      {errors.unit_id ? <p className="mt-1 text-xs font-medium text-red-600">{errors.unit_id}</p> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {(isEdit ? (unitQuantities.data?.data || []) : draftUnitQuantities).map((record: any) => (
                        <div key={record.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                {record.unit_name || filteredUnitOptions.find((option) => option.value === String(record.unit_id))?.label || t("Assigned Unit")}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Number(record.quantity || 0).toLocaleString()} {t("per")} {record.unit_short_name || record.unit_name || t("unit")}
                            </p>
                            <p className="text-xs font-bold text-gray-800 mt-1">
                              {t("Sale")}: {formatMoney(record.sale_price)} · {t("COGS")}: {formatMoney(record.cogs || record.purchase_price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => isEdit ? handleEditUnitQuantity(record) : handleEditDraftUnitQuantity(record)}>{t("Edit")}</Button>
                            <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => isEdit ? handleDeleteUnitQuantity(record) : handleDeleteDraftUnitQuantity(record)}>{t("Delete")}</Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{unitQuantityForm.id ? t("Edit Selling Unit") : t("Add Selling Unit")}</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <UniFieldSelect
                            label={t("Assigned Unit")}
                            required
                            value={unitQuantityForm.unit_id}
                            onValueChange={(val) => updateUnitQuantityField("unit_id", val)}
                            placeholder={t("Select Unit")}
                            error={unitQuantityErrors.unit_id}
                            onAddNew={() => setAddFormOpen("unit")}
                            addNewLabel={t("Add New Unit")}
                            hasOptions={Boolean(filteredUnitOptions.length)}
                          >
                            {filteredUnitOptions.map((option) => (
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
                            hasOptions={Boolean(filteredUnitOptions.length)}
                          >
                            {filteredUnitOptions.map((option) => (
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
                            prefix={currencyIndicator}
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
                            prefix={currencyIndicator}
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

                          <UniFieldSelect
                            label={t("Visible")}
                            value={unitQuantityForm.is_default ? "1" : "0"}
                            onValueChange={(value) => updateUnitQuantityField("is_default", value === "1")}
                          >
                            <SelectItem value="0">{t("No")}</SelectItem>
                            <SelectItem value="1">{t("Yes")}</SelectItem>
                          </UniFieldSelect>
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
                </div>
              )}

              {/* 3. Expiry Tab */}
              {activeTab === "expiry" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <UniFieldSelect
                      label={t("Product Expires")}
                      value={formData.expires ? "1" : "0"}
                      onValueChange={(value) => {
                        updateField("expires", value === "1")
                        updateField("expiry_tracking_enabled", value === "1")
                      }}
                    >
                      <SelectItem value="0">{t("No")}</SelectItem>
                      <SelectItem value="1">{t("Yes")}</SelectItem>
                    </UniFieldSelect>

                    <UniFieldSelect
                      label={t("On Expiration")}
                      value={formData.on_expiration}
                      onValueChange={(value) => updateField("on_expiration", value)}
                    >
                      <SelectItem value="prevent_sales">{t("Prevent Sales")}</SelectItem>
                      <SelectItem value="allow_sales">{t("Allow Sales")}</SelectItem>
                    </UniFieldSelect>
                  </div>
                </div>
              )}

              {/* 4. Taxes Tab */}
              {activeTab === "taxes" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <UniFieldSelect
                      label={t("Tax Group")}
                      value={formData.tax_group_id}
                      onValueChange={(value) => updateField("tax_group_id", value)}
                      placeholder={t("Select Tax")}
                      error={errors.tax_group_id}
                      allowClear
                      onAddNew={() => setAddFormOpen("taxGroup")}
                      addNewLabel={t("Add New Tax Group")}
                      hasOptions={Boolean(taxGroupRecords.length)}
                    >
                      {taxGroupRecords.map((group: any) => (
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <UniFieldInput
                      label={t("Medias Manager")}
                      placeholder={t("Search Medias")}
                      value={mediaSearch}
                      onChange={(event) => setMediaSearch(event.target.value)}
                    />
                    <UniFieldSelect
                      label={t("Image")}
                      value={selectedMediaId}
                      onValueChange={setSelectedMediaId}
                      placeholder={t("Choose an image")}
                      hasOptions={Boolean(mediaRecords.length)}
                    >
                      {mediaRecords.map((record: any) => (
                        <SelectItem key={record.id} value={String(record.id)}>
                          {record.name || record.file_name || record.url}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>
                    <UniFieldSelect
                      label={t("Is Primary")}
                      value={selectedMediaPrimary ? "1" : "0"}
                      onValueChange={(value) => setSelectedMediaPrimary(value === "1")}
                    >
                      <SelectItem value="0">{t("No")}</SelectItem>
                      <SelectItem value="1">{t("Yes")}</SelectItem>
                    </UniFieldSelect>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleAddGalleryMedia}>
                      <Plus className="size-4" />
                      {t("Add Image")}
                    </Button>
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{t("Product Gallery")}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{t("Choose an image to add on the product gallery")}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {gallery.map((img, index) => (
                        <div key={`${img.id || img.media_id || img.url}-${index}`} className="relative rounded-xl border border-gray-200 bg-gray-50 p-2">
                          <div className="aspect-square overflow-hidden rounded-lg bg-white">
                            <img src={img.url} alt={img.name || t("Gallery")} className="h-full w-full object-cover" />
                          </div>
                          <div className="mt-2 space-y-2">
                            <UniFieldSelect
                              label={t("Is Primary")}
                              value={img.featured ? "1" : "0"}
                              onValueChange={(value) => handleSetGalleryPrimary(index, value === "1")}
                            >
                              <SelectItem value="0">{t("No")}</SelectItem>
                              <SelectItem value="1">{t("Yes")}</SelectItem>
                            </UniFieldSelect>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveGalleryImage(index)}
                            >
                              <Trash2 className="size-3.5" />
                              {t("Delete")}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!gallery.length ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm font-medium text-gray-500 md:col-span-4">
                          {t("No image has been added.")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

            </div>

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
    </DashboardPage>
  )
}
