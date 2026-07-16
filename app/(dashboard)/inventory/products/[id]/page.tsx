"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  Upload,
  WandSparkles,
  X,
} from "lucide-react"

import { CategoryForm } from "@/app/(dashboard)/inventory/categories/createUpdate"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { UnitForm } from "@/app/(dashboard)/inventory/units/createUpdate"
import { UnitGroupForm } from "@/app/(dashboard)/inventory/unit-groups/createUpdate"
import { TaxGroupForm } from "@/app/(dashboard)/settings/tax-groups/createUpdate"
import { Button } from "@/components/ui/button"
import CustomModal from "@/components/ui/customModal"
import { SelectItem, SelectItemText } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { MediaManagerDialog } from "@/components/media-manager"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"

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
}

type ProductUnitQuantityFormValues = {
  id?: number | string
  unit_id: string
  convert_unit_id: string
  barcode: string
  quantity: string
  sale_price: string
  wholesale_price: string
  purchase_price: string
  is_weighable: boolean
  stock_alert_enabled: boolean
  low_quantity: string
  visible: boolean
  preview_url: string
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
}

const initialUnitQuantityValues: ProductUnitQuantityFormValues = {
  unit_id: "",
  convert_unit_id: "",
  barcode: "",
  quantity: "1",
  sale_price: "",
  wholesale_price: "",
  purchase_price: "",
  is_weighable: false,
  stock_alert_enabled: false,
  low_quantity: "",
  visible: true,
  preview_url: "",
  scale_plu: "",
}

type ProductGalleryFormValues = {
  id?: number
  media_id?: number | string
  name?: string
  url: string
  featured: boolean
}

type MediaRecord = {
  id: number | string
  name?: string
  file_name?: string
  url?: string
  path?: string
  full_url?: string
  preview_url?: string
  sizes?: {
    thumb?: string
    original?: string
  }
}

const uniqueBy = <T,>(items: T[] = [], getKey: (item: T) => string) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const toOption = (items: any[] = []) =>
  uniqueBy(items, (item) => String(item?.id || "")).map((item) => ({
    label: item.short_name ? `${item.name} (${item.short_name})` : item.name,
    value: String(item.id),
  }))

const appendIfPresent = (formData: FormData, key: string, value: any) => {
  if (value === undefined || value === null || value === "") return
  formData.append(key, String(value))
}

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return ""
  if (/^(https?:|data:|blob:)/.test(value)) return value
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "")
  const path = value.startsWith("/") ? value : `/${value}`
  return `${base}${path}`
}

const mediaImageUrl = (record?: MediaRecord | null) =>
  resolveAssetUrl(
    record?.sizes?.original ||
    record?.sizes?.thumb ||
    record?.url ||
    record?.full_url ||
    record?.path ||
    record?.preview_url ||
    ""
  )

const productUnitQuantityToForm = (record: any): ProductUnitQuantityFormValues => ({
  id: record.id,
  unit_id: record.unit_id ? String(record.unit_id) : "",
  convert_unit_id: record.convert_unit_id
    ? String(record.convert_unit_id)
    : "",
  barcode: record.barcode || "",
  quantity: record.quantity ? String(record.quantity) : "1",
  sale_price: record.sale_price ? String(record.sale_price) : "",
  wholesale_price: record.wholesale_price ? String(record.wholesale_price) : "",
  purchase_price: record.cogs ? String(record.cogs) : "",
  is_weighable: Boolean(record.is_weighable),
  stock_alert_enabled: Boolean(record.stock_alert_enabled),
  low_quantity: record.low_quantity ? String(record.low_quantity) : "",
  visible: record.visible !== false,
  preview_url: record.preview_url || "",
  scale_plu: record.scale_plu || "",
})

function YesNoToggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="flex h-[66px] items-center justify-between rounded-md border-2 border-input bg-white px-3">
      <div>
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        <div className="text-xs font-medium text-muted-foreground">
          {value ? t("Yes") : t("No")}
        </div>
      </div>
      <Switch checked={value} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
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
      wholesale_price: unit.wholesale_price || "0",
      wholesale_price_edit: unit.wholesale_price || "0",
      cogs: unit.purchase_price || "0",
      stock_alert_enabled: Boolean(unit.stock_alert_enabled),
      low_quantity: unit.low_quantity || "0",
      is_weighable: Boolean(unit.is_weighable),
      scale_plu: unit.scale_plu || "",
      visible: unit.visible !== false,
      preview_url: unit.preview_url || "",
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
        featured: Boolean(image.featured),
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
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)

  const [formData, setFormData] = useState<ProductFormValues>(initialValues)
  type ProductTab = "identification" | "units" | "expiry" | "taxes" | "images"
  const [activeTab, setActiveTab] = useState<ProductTab>("identification")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [gallery, setGallery] = useState<ProductGalleryFormValues[]>([])
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false)
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"gallery" | "unit-preview" | null>(null)

  const [unitQuantityForm, setUnitQuantityForm] =
    useState<ProductUnitQuantityFormValues>(initialUnitQuantityValues)
  const [draftUnitQuantities, setDraftUnitQuantities] = useState<ProductUnitQuantityFormValues[]>([])
  const [showSellingForm, setShowSellingForm] = useState(false)
  const [unitDeleteTarget, setUnitDeleteTarget] = useState<any | null>(null)

  const [unitQuantityErrors, setUnitQuantityErrors] = useState<
    Record<string, string>
  >({})
  const [addFormOpen, setAddFormOpen] = useState<
    "category" | "unit" | "unitGroup" | "taxGroup" | null
  >(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const paginationSentinelRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")
  const draftUnitCounterRef = useRef(0)

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
  // Media endpoints managed via @/components/media-manager

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}:${posOptions.quick_product_default_unit || ""}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      const [, , unitsResponse, unitGroupsResponse] = await Promise.all([
        getCategoriesDropdown(),
        getTaxGroupsDropdown(),
        getUnitsDropdown(),
        getUnitGroupsDropdown(),
      ])

      if (!isEdit) {
        const defaultUnitId = String(posOptions.quick_product_default_unit || "")
        const defaultUnit = (unitsResponse?.data?.data || []).find(
          (unit: any) => String(unit.id) === defaultUnitId
        )
        const defaultGroupId = defaultUnit?.group_id ? String(defaultUnit.group_id) : ""
        setFormData({
          ...initialValues,
          unit_id: defaultUnit?.id ? String(defaultUnit.id) : "",
          unit_group_id: defaultGroupId,
        })
        setDraftUnitQuantities([])
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
      })
      setGallery((record.gallery || []).map((image: any) => ({
        id: image.id,
        media_id: image.media_id,
        name: image.name || "",
        url: resolveAssetUrl(image.url || image.preview_url || ""),
        featured: Boolean(image.featured),
      })))
      const initialUnits = (unitQuantitiesResponse?.data || []).map(productUnitQuantityToForm)
      setDraftUnitQuantities(initialUnits)
      if (primaryUnitQuantity) {
        setUnitQuantityForm(productUnitQuantityToForm(primaryUnitQuantity))
        setUnitQuantityErrors({})
        setShowSellingForm(true)
      } else {
        resetUnitQuantityForm()
      }
    }

    load()
  }, [
    getCategoriesDropdown,
    getProductById,
    getProductUnitQuantities,
    getTaxGroupsDropdown,
    getUnitsDropdown,
    getUnitGroupsDropdown,
    id,
    isEdit,
    posOptions.quick_product_default_unit,
  ])

  const isStockProduct = formData.product_type === "product"
  const isLoading =
    categories.isLoading ||
    taxGroups.isLoading ||
    units.isLoading ||
    unitGroups.isLoading ||
    (isEdit && product.isLoading)
  const categoryOptions = toOption(categories.data?.data)
  const unitRecords = units.data?.data || []
  const unitOptions = toOption(unitRecords)
  const unitGroupOptions = toOption(unitGroups.data?.data)
  const filteredUnitOptions = unitOptions.filter((option) => {
    if (!formData.unit_group_id) return true
    const record = unitRecords.find((unit: any) => String(unit.id) === option.value)
    return String(record?.group_id || "") === String(formData.unit_group_id)
  })
  const taxGroupRecords = uniqueBy(taxGroups.data?.data || [], (group: any) => String(group?.id || ""))
  // Media records retrieved inside MediaManagerDialog
  const selectedUnitGroupName =
    unitGroupOptions.find((option) => option.value === String(formData.unit_group_id))?.label ||
    t("New Group")
  const sellingUnitRows = draftUnitQuantities
  const getSellingUnitLabel = (record: any) =>
    record.unit_short_name ||
    record.unit_name ||
    filteredUnitOptions.find((option) => option.value === String(record.unit_id))?.label ||
    t("Assigned Unit")
  const getUnitRowKey = (record: any) =>
    record?.id !== undefined && record?.id !== null
      ? `id:${String(record.id)}`
      : `unit:${String(record?.unit_id || "")}`
  const getNextDraftUnitId = () => {
    draftUnitCounterRef.current += 1
    return Date.now() * 1000 + draftUnitCounterRef.current
  }

  // Media loading logic encapsulated in MediaManagerDialog

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

  // Media synchronization handled in MediaManagerDialog

  const updateField = (name: keyof ProductFormValues, value: any) => {
    setFormData((current) => {
      const next = { ...current, [name]: value }
      if (name === "unit_group_id") {
        next.unit_id = ""
        setUnitQuantityForm((unitForm) => ({ ...unitForm, unit_id: "", convert_unit_id: "" }))
        setDraftUnitQuantities([])
        setShowSellingForm(false)
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
    const sellingUnits = draftUnitQuantities
    if (!sellingUnits.length) {
      nextErrors.unit_id = t("Selling Unit is required")
    } else {
      const hasInvalidSellingUnit = sellingUnits.some((u: any) => !u.unit_id || !u.quantity || !u.sale_price)
      if (hasInvalidSellingUnit) {
        nextErrors.unit_id = t("Please ensure all selling units have a valid unit, quantity, and sale price.")
      }
    }
    if (showSellingForm && !validateUnitQuantity()) {
      nextErrors.unit_id = t("Please fix the errors in the selling unit form.")
    }
    if (!formData.unit_group_id) nextErrors.unit_group_id = t("Unit Group is required")
    if (!formData.category_id) nextErrors.category_id = t("Category is required")
    if (formData.is_tax_inclusive && !formData.tax_group_id) {
      nextErrors.tax_group_id = t("Tax is required when inclusive of tax")
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.category_id || nextErrors.barcode) {
      setActiveTab("identification")
    } else if (nextErrors.unit_id || nextErrors.unit_group_id) {
      setActiveTab("units")
    } else if (nextErrors.tax_group_id) {
      setActiveTab("taxes")
    }
    return Object.keys(nextErrors).length === 0
  }

  const productTabHasErrors = (tab: ProductTab) => {
    if (tab === "identification") {
      return Boolean(errors.name || errors.category_id || errors.barcode)
    }
    if (tab === "units") return Boolean(errors.unit_id || errors.unit_group_id)
    if (tab === "taxes") return Boolean(errors.tax_group_id)
    return false
  }

  const goBack = () => router.push("/inventory/products")

  const handleAddFormSuccess = async (
    type: "category" | "unit" | "unitGroup" | "taxGroup"
  ) => {
    if (type === "category") await getCategoriesDropdown()
    if (type === "unit") await getUnitsDropdown()
    if (type === "unitGroup") await getUnitGroupsDropdown()
    if (type === "taxGroup") await getTaxGroupsDropdown()
    setAddFormOpen(null)
  }

  const updateUnitQuantityField = (
    name: keyof ProductUnitQuantityFormValues,
    value: any
  ) => {
    setUnitQuantityForm((current) => {
      const next = { ...current, [name]: value }
      if (next.id) {
        setDraftUnitQuantities((rows) =>
          rows.map((row) => (row.id === next.id ? next : row))
        )
      }
      return next
    })
    if (unitQuantityErrors[name]) {
      setUnitQuantityErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const resetUnitQuantityForm = () => {
    setUnitQuantityForm(initialUnitQuantityValues)
    setUnitQuantityErrors({})
    setShowSellingForm(false)
  }

  const openNewUnitQuantityForm = () => {
    if (!formData.unit_group_id) {
      setErrors((current) => ({ ...current, unit_group_id: t("Unit Group is required") }))
      showToast.error(t("Please select a unit group first."))
      return
    }
    if (showSellingForm && !validateUnitQuantity()) {
      showToast.error(t("Please fix the errors in the current selling unit first."))
      return
    }
    const assignedUnitIds = new Set(
      draftUnitQuantities
        .map((record: any) => String(record.unit_id || ""))
        .filter(Boolean)
    )
    const nextUnit = filteredUnitOptions.find((option) => !assignedUnitIds.has(String(option.value)))
    if (!nextUnit) {
      showToast.error(t("No unit is available for this unit group."))
      return
    }
    const nextForm: ProductUnitQuantityFormValues = {
      ...initialUnitQuantityValues,
      id: getNextDraftUnitId(),
      unit_id: String(nextUnit.value),
    }
    setDraftUnitQuantities((current) => [...current, nextForm])
    setUnitQuantityForm(nextForm)
    setUnitQuantityErrors({})
    setShowSellingForm(true)
  }

  const validateUnitQuantity = () => {
    const nextErrors: Record<string, string> = {}
    if (!unitQuantityForm.unit_id) nextErrors.unit_id = t("Unit is required")
    if (!unitQuantityForm.quantity)
      nextErrors.quantity = t("Quantity is required")
    if (!unitQuantityForm.sale_price)
      nextErrors.sale_price = t("Sale Price is required")
    setUnitQuantityErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleDeleteDraftUnitQuantity = (record: ProductUnitQuantityFormValues) => {
    const deleteKey = getUnitRowKey(record)
    setDraftUnitQuantities((current) => {
      const nextRows = current.filter((item) => getUnitRowKey(item) !== deleteKey)
      if (getUnitRowKey(unitQuantityForm) === deleteKey) {
        const nextActive = nextRows[0]
        if (nextActive) {
          setUnitQuantityForm(nextActive)
          setUnitQuantityErrors({})
          setShowSellingForm(true)
        } else {
          resetUnitQuantityForm()
        }
      }
      return nextRows
    })
  }

  const handleEditDraftUnitQuantity = (record: ProductUnitQuantityFormValues) => {
    if (showSellingForm && !validateUnitQuantity()) {
      showToast.error(t("Please fix the errors in the current selling unit first."))
      return
    }
    setUnitQuantityForm(record)
    setUnitQuantityErrors({})
    setShowSellingForm(true)
  }

  const requestDeleteUnitQuantity = (record: any) => {
    setUnitDeleteTarget(record)
  }

  const confirmDeleteUnitQuantity = async () => {
    if (!unitDeleteTarget) return
    handleDeleteDraftUnitQuantity(unitDeleteTarget)
    setUnitDeleteTarget(null)
  }

  const handleAddGalleryImage = () => {
    setGallery((current) => [
      ...current,
      {
        url: "",
        featured: false,
      },
    ])
  }

  const handleChooseGalleryImage = () => {
    const nextIndex = gallery.length
    setGallery((current) => [
      ...current,
      {
        url: "",
        featured: false,
      },
    ])
    setActiveGalleryIndex(nextIndex)
    setMediaPickerTarget("gallery")
    setMediaManagerOpen(true)
  }

  const updateGalleryImage = (
    index: number,
    values: Partial<ProductGalleryFormValues>
  ) => {
    setGallery((current) =>
      current.map((image, currentIndex) => {
        if (currentIndex !== index) return image
        const next = { ...image, ...values }
        if (values.featured) {
          return { ...next, featured: true }
        }
        return next
      }).map((image, currentIndex) =>
        values.featured && currentIndex !== index ? { ...image, featured: false } : image
      )
    )
  }

  const openMediaManager = (index: number) => {
    setActiveGalleryIndex(index)
    setMediaPickerTarget("gallery")
    setMediaManagerOpen(true)
  }

  const openUnitPreviewMediaManager = () => {
    setActiveGalleryIndex(null)
    setMediaPickerTarget("unit-preview")
    setMediaManagerOpen(true)
  }

  const handleSelectMedia = (record: any) => {
    const imageUrl = mediaImageUrl(record)
    if (!imageUrl) {
      showToast.error(t("Selected media has no image URL."))
      return
    }
    if (mediaPickerTarget === "unit-preview") {
      updateUnitQuantityField("preview_url", imageUrl)
      setMediaManagerOpen(false)
      setMediaPickerTarget(null)
      return
    }
    if (activeGalleryIndex === null) return
    updateGalleryImage(activeGalleryIndex, {
      media_id: record.id,
      name: record.name || record.file_name || "",
      url: imageUrl,
    })
    setMediaManagerOpen(false)
    setActiveGalleryIndex(null)
    setMediaPickerTarget(null)
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

  // Media uploads managed via MediaManagerDialog

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payLoad = buildProductFormData(formData, isEdit, units.data?.data || [], draftUnitQuantities, gallery)
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
        <div className="flex-none">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProductTab)}>
            <TabsList variant="line" className="-mb-px w-full justify-start overflow-x-auto">
              {(["identification", "units", "expiry", "taxes", "images"] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  data-invalid={productTabHasErrors(tab) ? true : undefined}
                  aria-invalid={productTabHasErrors(tab) ? true : undefined}
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
                  {productTabHasErrors(tab) ? (
                    <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                      !
                    </span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Main Name Field */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            <div className="bg-white rounded-xl border border-gray-200 p-6">

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
                      {categoryOptions.map((option, index) => (
                        <SelectItem key={`category-${option.value}-${index}`} value={option.value}>
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

                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 border-t border-gray-100 pt-6">
                    <YesNoToggle
                      label={t("Stock Management Enabled")}
                      value={formData.track_stock}
                      onChange={(value) => updateField("track_stock", value)}
                      disabled={formData.product_type !== "product"}
                    />

                    <YesNoToggle
                      label={t("Pin Product")}
                      value={formData.pinned}
                      onChange={(value) => updateField("pinned", value)}
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-4">
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <UniFieldSelect
                        label={t("Unit Group")}
                        required
                        value={formData.unit_group_id}
                        onValueChange={(value) => updateField("unit_group_id", value)}
                        placeholder={t("Select Unit Group")}
                        error={errors.unit_group_id}
                        onAddNew={() => setAddFormOpen("unitGroup")}
                        addNewLabel={t("Add New Unit Group")}
                        hasOptions={Boolean(unitGroupOptions.length)}
                      >
                        {unitGroupOptions.map((option, index) => (
                          <SelectItem key={`unit-group-${option.value}-${index}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>

                      <YesNoToggle
                        label={t("Accurate Tracking")}
                        value={formData.accurate_tracking}
                        onChange={(value) => updateField("accurate_tracking", value)}
                        disabled={formData.product_type !== "product"}
                      />

                      <YesNoToggle
                        label={t("Auto COGS")}
                        value={formData.auto_cogs}
                        onChange={(value) => updateField("auto_cogs", value)}
                        disabled={formData.product_type !== "product"}
                      />
                    </div>

                  </div>

                  <div className="self-start rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{t("Selling Unit")}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{t("Determine the unit for sale.")}</p>
                        {errors.unit_id ? <p className="mt-1 text-xs font-medium text-red-600">{errors.unit_id}</p> : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={openNewUnitQuantityForm}
                      >
                        <Plus className="size-4" />
                        {t("Add")}
                      </Button>
                    </div>

                    {sellingUnitRows.length ? (
                      <div className="mt-4 flex flex-wrap items-end border-b border-gray-200">
                        {sellingUnitRows.map((record: any, index: number) => {
                          const isActive = String(unitQuantityForm.id || "") === String(record.id || "")
                          const openRecord = () => handleEditDraftUnitQuantity(record)
                          return (
                            <button
                              key={`selling-unit-tab-${record.id || record.unit_id || "draft"}-${index}`}
                              type="button"
                              className={`mb-[-1px] flex max-w-full items-center gap-2 rounded-t-md border px-3 py-2 text-sm font-bold transition ${isActive
                                ? "border-gray-200 border-b-white bg-white text-gray-900"
                                : "border-transparent bg-gray-100 text-gray-600"
                                }`}
                              onClick={openRecord}
                            >
                              <span className="truncate">{getSellingUnitLabel(record)}</span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  requestDeleteUnitQuantity(record)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    requestDeleteUnitQuantity(record)
                                  }
                                }}
                                aria-label={t("Remove")}
                              >
                                <X className="size-3.5" />
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : null}

                    {showSellingForm ? (
                      <>
                        <div className="mb-4 border-t pt-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            {unitQuantityForm.id ? t("Edit Selling Unit") : t("Add Selling Unit")}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                            {filteredUnitOptions.map((option, index) => (
                              <SelectItem key={`assigned-unit-${option.value}-${index}`} value={option.value}>
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
                            {filteredUnitOptions.map((option, index) => (
                              <SelectItem key={`convert-unit-${option.value}-${index}`} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </UniFieldSelect>

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

                          <YesNoToggle
                            label={t("Weighable Product")}
                            value={unitQuantityForm.is_weighable}
                            onChange={(value) => updateUnitQuantityField("is_weighable", value)}
                            disabled={!posOptions.scale_barcode_product_length}
                          />

                          <UniFieldInput
                            label={t("PLU Code")}
                            placeholder={t("Enter PLU lookup code")}
                            value={unitQuantityForm.scale_plu}
                            onChange={(e) => updateUnitQuantityField("scale_plu", e.target.value)}
                            disabled={!posOptions.scale_barcode_product_length}
                          />

                          <YesNoToggle
                            label={t("Stock Alert")}
                            value={unitQuantityForm.stock_alert_enabled}
                            onChange={(value) => updateUnitQuantityField("stock_alert_enabled", value)}
                          />

                          <UniFieldInput
                            label={t("Low Quantity")}
                            placeholder={t("Which quantity should be assumed low.")}
                            type="number"
                            min="0"
                            step="0.01"
                            value={unitQuantityForm.low_quantity}
                            onChange={(e) => updateUnitQuantityField("low_quantity", e.target.value)}
                          />

                          <YesNoToggle
                            label={t("Visible")}
                            value={unitQuantityForm.visible}
                            onChange={(value) => updateUnitQuantityField("visible", value)}
                          />

                          <UniFieldInput
                            label={t("Preview Url")}
                            placeholder={t("Provide the preview of the current unit.")}
                            value={unitQuantityForm.preview_url}
                            onChange={(e) => updateUnitQuantityField("preview_url", e.target.value)}
                            addonAfter={
                              <Button type="button" variant="outline" className="h-10" onClick={openUnitPreviewMediaManager}>
                                <Search className="size-4" />
                                {t("Medias Manager")}
                              </Button>
                            }
                            containerClassName="md:col-span-2"
                          />
                        </div>
                        {null}
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {/* 3. Expiry Tab */}
              {activeTab === "expiry" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <YesNoToggle
                      label={t("Product Expires")}
                      value={formData.expires}
                      onChange={(value) => {
                        updateField("expires", value)
                        updateField("expiry_tracking_enabled", value)
                      }}
                    />

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
                      {taxGroupRecords.map((group: any, index: number) => (
                        <SelectItem key={`tax-group-${group.id}-${index}`} value={String(group.id)}>
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
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{t("Product Gallery")}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{t("Manage product images shown to customers.")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={handleChooseGalleryImage}>
                        <Search className="size-4" />
                        {t("Medias Manager")}
                      </Button>
                      <Button type="button" size="sm" onClick={handleAddGalleryImage}>
                        <Plus className="size-4" />
                        {t("Add Image")}
                      </Button>
                    </div>
                  </div>

                  {/* Empty state */}
                  {!gallery.length ? (
                    <button
                      type="button"
                      onClick={handleChooseGalleryImage}
                      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 text-center transition hover:border-gray-400 hover:bg-gray-100"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                        <ImagePlus className="size-4" />
                      </span>
                      <span className="text-xs font-semibold text-gray-600">{t("No image has been added.")}</span>
                      <span className="text-[11px] text-gray-400">{t("Choose an image from Medias Manager")}</span>
                    </button>
                  ) : (
                    /* Image grid */
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                      {gallery.map((img, index) => (
                        <div
                          key={`gallery-image-${img.id || img.media_id || "draft"}-${index}`}
                          className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                            {img.url ? (
                              <img src={img.url} alt={img.name || t("Gallery")} className="h-full w-full object-cover transition group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-300">
                                <ImagePlus className="size-6" />
                              </div>
                            )}

                            {/* Overlay actions */}
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow transition hover:bg-gray-100"
                                onClick={() => openMediaManager(index)}
                                title={t("Medias Manager")}
                              >
                                <Search className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow transition hover:bg-red-50"
                                onClick={() => handleRemoveGalleryImage(index)}
                                title={t("Remove")}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>

                            {/* Primary badge */}
                            {img.featured ? (
                              <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                {t("Primary")}
                              </span>
                            ) : null}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
                            <span className="truncate text-xs text-gray-500">
                              {img.name || img.url || t("No URL")}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openMediaManager(index)}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 transition hover:bg-gray-200"
                              >
                                {t("Choose")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetGalleryPrimary(index, !img.featured)}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${img.featured
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                              >
                                {img.featured ? t("Primary") : t("Set Primary")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
        <UnitGroupForm
          isOpen={addFormOpen === "unitGroup"}
          onClose={() => setAddFormOpen(null)}
          onSuccess={() => handleAddFormSuccess("unitGroup")}
        />
        <TaxGroupForm
          isOpen={addFormOpen === "taxGroup"}
          onClose={() => setAddFormOpen(null)}
          onSuccess={() => handleAddFormSuccess("taxGroup")}
        />
        <CustomModal
          open={Boolean(unitDeleteTarget)}
          onOpenChange={(open) => {
            if (!open) setUnitDeleteTarget(null)
          }}
          title={t("Remove Selling Unit")}
          showFooter
          bodyClassName="border-y-0 py-0"
          footerClassName="gap-2"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUnitDeleteTarget(null)}
              >
                {t("Cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeleteUnitQuantity}
              >
                {t("Remove")}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            {t("Are you sure you want to remove this selling unit?")}
          </p>
        </CustomModal>
        <MediaManagerDialog
          open={mediaManagerOpen}
          onOpenChange={setMediaManagerOpen}
          onSelect={handleSelectMedia}
        />
      </div>
    </DashboardPage>
  )
}
