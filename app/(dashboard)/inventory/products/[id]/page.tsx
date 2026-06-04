"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckIcon,
  ChevronDownIcon,
  WandSparkles,
} from "lucide-react"

import { BrandForm } from "@/app/(dashboard)/inventory/brands/createUpdate"
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
  image: File | null
  weight: string
  category_id: string
  brand_id: string
  tax_group_id: string
  unit_id: string
  product_type: "stock" | "service"
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
}

const initialValues: ProductFormValues = {
  name: "",
  sku: "",
  barcode: "",
  image: null,
  weight: "",
  category_id: "",
  brand_id: "",
  tax_group_id: "",
  unit_id: "",
  product_type: "stock",
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

function buildProductFormData(values: ProductFormValues, isEdit: boolean) {
  const formData = new FormData()

  appendIfPresent(formData, "name", values.name)
  appendIfPresent(formData, "sku", values.sku)
  appendIfPresent(formData, "barcode", values.barcode)
  appendIfPresent(formData, "weight", values.weight || "0")
  appendIfPresent(formData, "category_id", values.category_id)
  appendIfPresent(formData, "brand_id", values.brand_id)
  appendIfPresent(formData, "tax_group_id", values.tax_group_id)
  appendIfPresent(formData, "unit_id", values.unit_id)
  appendIfPresent(formData, "product_type", values.product_type || "stock")
  appendIfPresent(formData, "description", values.description)
  appendIfPresent(formData, "purchase_price", values.purchase_price || "0")
  appendIfPresent(formData, "selling_price", values.selling_price || "0")
  appendIfPresent(formData, "mrp", values.mrp || "0")
  appendIfPresent(formData, "wholesale_price", values.wholesale_price || "0")

  if (values.product_type === "stock") {
    appendIfPresent(formData, "min_stock", values.min_stock || "0")
    appendIfPresent(formData, "max_stock", values.max_stock || "0")
    if (!isEdit) {
      appendIfPresent(formData, "opening_stock", values.opening_stock || "0")
    }
  }

  formData.append("is_tax_inclusive", String(Boolean(values.is_tax_inclusive)))
  formData.append(
    "track_stock",
    String(values.product_type === "stock" && Boolean(values.track_stock))
  )
  formData.append(
    "allow_decimal_qty",
    String(Boolean(values.allow_decimal_qty))
  )
  formData.append(
    "expiry_tracking_enabled",
    String(
      values.product_type === "stock" && Boolean(values.expiry_tracking_enabled)
    )
  )

  if (values.image instanceof File) {
    formData.append("image", values.image)
  }

  return formData
}

export default function ProductFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"

  const [formData, setFormData] = useState<ProductFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [imageError, setImageError] = useState("")
  const [initialImageUrl, setInitialImageUrl] = useState("")
  const [addFormOpen, setAddFormOpen] = useState<
    "category" | "brand" | "unit" | "taxGroup" | null
  >(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const paginationSentinelRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")

  const [createProduct] = (catalog as any).useCreateProductMutation()
  const [editProduct] = (catalog as any).useEditProductMutation()
  const [getProductById, product] = (catalog as any).useGetProductByIdMutation()
  const [getCategoriesDropdown, categories] = (
    catalog as any
  ).useGetCategoriesDropdownMutation()
  const [getBrandsDropdown, brands] = (
    catalog as any
  ).useGetBrandsDropdownMutation()
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
        getBrandsDropdown(),
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
      const record = result?.data
      if (!record) return

      setInitialImageUrl(record.image || "")
      setImageError("")
      setFormData({
        ...initialValues,
        ...record,
        image: null,
        product_type: record.product_type || "stock",
        category_id: record.category_id ? String(record.category_id) : "",
        brand_id: record.brand_id ? String(record.brand_id) : "",
        tax_group_id: record.tax_group_id ? String(record.tax_group_id) : "",
        unit_id: record.unit_id ? String(record.unit_id) : "",
        is_tax_inclusive: Boolean(record.is_tax_inclusive),
      })
    }

    load()
  }, [
    getBrandsDropdown,
    getCategoriesDropdown,
    getProductById,
    getTaxGroupsDropdown,
    getUnitsDropdown,
    id,
    isEdit,
  ])

  const isStockProduct = formData.product_type === "stock"
  const isLoading =
    categories.isLoading ||
    brands.isLoading ||
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
    if (!formData.name.trim()) nextErrors.name = "Name is required"
    if (!formData.selling_price)
      nextErrors.selling_price = "Selling price is required"
    if (!formData.unit_id) nextErrors.unit_id = "Primary unit is required"
    if (imageError) nextErrors.image = imageError
    if (formData.is_tax_inclusive && !formData.tax_group_id) {
      nextErrors.tax_group_id = "Tax is required when inclusive of tax"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/inventory/products")

  const handleAddFormSuccess = async (
    type: "category" | "brand" | "unit" | "taxGroup"
  ) => {
    if (type === "category") await getCategoriesDropdown()
    if (type === "brand") await getBrandsDropdown()
    if (type === "unit") await getUnitsDropdown()
    if (type === "taxGroup") await getTaxGroupsDropdown()
    setAddFormOpen(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payLoad = buildProductFormData(formData, isEdit)
      if (isEdit) {
        const response = await editProduct({ id, payLoad }).unwrap()
        showToast.success(response?.message || "Product updated successfully.")
      } else {
        const response = await createProduct(payLoad).unwrap()
        showToast.success(response?.message || "Product created successfully.")
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
          Loading product data...
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
                {isEdit ? "Edit Product" : "Create Product"}
              </h1>
              <p className="text-xs font-medium text-gray-500">
                Product details, pricing, tax and inventory setup.
              </p>
            </div>
          </div>
        </div>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="flex flex-col gap-5 px-4 pt-4 xl:flex-row">
              <div className="w-full space-y-5 xl:w-[70%]">
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <ButtonGroup className="mb-4 overflow-hidden rounded-md border bg-white">
                    {[
                      { label: "Product", value: "stock" },
                      { label: "Service", value: "service" },
                    ].map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant="ghost"
                        onClick={() => updateField("product_type", item.value)}
                        className={cn(
                          "min-w-24 border-0 text-sm font-semibold shadow-none hover:bg-gray-50",
                          formData.product_type === item.value &&
                            "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
                        )}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </ButtonGroup>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <UniFieldInput
                        label="Product Name"
                        required
                        placeholder="Enter Item Name"
                        value={formData.name}
                        onChange={(event) =>
                          updateField("name", event.target.value)
                        }
                        error={errors.name}
                      />
                    </div>

                    <div className="space-y-1">
                      <UniFieldInput
                        label="Selling Price"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        prefix="₹"
                        addonAfter={
                          <TaxModeDropdown
                            isInclusive={formData.is_tax_inclusive}
                            onChange={(value) =>
                              updateField("is_tax_inclusive", value)
                            }
                          />
                        }
                        placeholder="Enter Selling Price"
                        value={formData.selling_price}
                        onChange={(event) =>
                          updateField("selling_price", event.target.value)
                        }
                        error={errors.selling_price}
                      />
                      <p className="text-xs font-semibold text-gray-500">
                        {formData.is_tax_inclusive
                          ? "Inclusive of Taxes"
                          : "Exclusive of Taxes"}
                      </p>
                    </div>

                    <UniFieldSelect
                      label="Tax %"
                      required={formData.is_tax_inclusive}
                      value={formData.tax_group_id}
                      onValueChange={(value) =>
                        updateField("tax_group_id", value)
                      }
                      placeholder="Select Tax"
                      error={errors.tax_group_id}
                      allowClear
                      onAddNew={() => setAddFormOpen("taxGroup")}
                      addNewLabel="Add New Tax Group"
                    >
                      {(taxGroups.data?.data || []).map((group: any) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          <SelectItemText>
                            <div className="flex w-full items-center justify-between gap-4">
                              <span>{group.name}</span>
                              {group.taxes && group.taxes.length > 0 && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  {group.taxes
                                    .map((t: any) => `${t.name} (${t.rate}%)`)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                          </SelectItemText>
                        </SelectItem>
                      ))}
                    </UniFieldSelect>

                    <UniFieldSelect
                      label="Primary Unit"
                      required
                      value={formData.unit_id}
                      onValueChange={(value) => updateField("unit_id", value)}
                      placeholder="Select Unit"
                      error={errors.unit_id}
                      onAddNew={() => setAddFormOpen("unit")}
                      addNewLabel="Add New Unit"
                    >
                      {toOption(units.data?.data).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>

                    <UniFieldSelect
                      label="Category"
                      value={formData.category_id}
                      onValueChange={(value) =>
                        updateField("category_id", value)
                      }
                      placeholder="Select Category"
                      allowClear
                      onAddNew={() => setAddFormOpen("category")}
                      addNewLabel="Add New Category"
                    >
                      {toOption(categories.data?.data).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>
                  </div>
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900">
                      Additional Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UniFieldInput
                      label="SKU"
                      placeholder="Enter SKU"
                      value={formData.sku}
                      onChange={(event) =>
                        updateField("sku", event.target.value)
                      }
                    />
                    <UniFieldInput
                      label="Purchase Price"
                      placeholder="Enter Purchase Price"
                      type="number"
                      min="0"
                      step="0.01"
                      prefix="₹"
                      value={formData.purchase_price}
                      onChange={(event) =>
                        updateField("purchase_price", event.target.value)
                      }
                    />
                    <UniFieldInput
                      label="Barcode"
                      placeholder="2273546838467"
                      value={formData.barcode}
                      onChange={(event) =>
                        updateField("barcode", event.target.value)
                      }
                      suffix={
                        <button
                          type="button"
                          onClick={() =>
                            updateField("barcode", generateBarcode())
                          }
                          className="flex min-w-32 items-center justify-center gap-1.5 text-xs font-semibold text-gray-800"
                        >
                          <WandSparkles className="size-3.5" />
                          Auto Generate
                        </button>
                      }
                    />
                    <UniFieldSelect
                      label="Brand"
                      value={formData.brand_id}
                      onValueChange={(value) => updateField("brand_id", value)}
                      placeholder="Select Brand"
                      allowClear
                      onAddNew={() => setAddFormOpen("brand")}
                      addNewLabel="Add New Brand"
                    >
                      {toOption(brands.data?.data).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>
                    <UniFieldInput
                      label="MRP"
                      type="number"
                      placeholder="Enter MRP"
                      min="0"
                      step="0.01"
                      prefix="₹"
                      value={formData.mrp}
                      onChange={(event) =>
                        updateField("mrp", event.target.value)
                      }
                    />
                    <UniFieldInput
                      label="Wholesale Price"
                      type="number"
                      placeholder="Enter Wholesale Price"
                      min="0"
                      step="0.01"
                      prefix="₹"
                      value={formData.wholesale_price}
                      onChange={(event) =>
                        updateField("wholesale_price", event.target.value)
                      }
                    />
                    <UniFieldInput
                      label="Weight"
                      type="number"
                      placeholder="Enter Weight"
                      min="0"
                      step="0.001"
                      value={formData.weight}
                      onChange={(event) =>
                        updateField("weight", event.target.value)
                      }
                    />
                    <div className="md:col-span-2">
                      <UniFieldInput
                        as="textarea"
                        label="Description"
                        placeholder="Enter a detailed description..."
                        value={formData.description}
                        onChange={(event) =>
                          updateField("description", event.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </section>
              </div>

              <aside className="w-full space-y-5 xl:w-[30%]">
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <ImageUpload
                    label="Product Image"
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
                </section>

                {isStockProduct ? (
                  <section className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold text-gray-900">
                        Inventory
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {!isEdit ? (
                        <UniFieldInput
                          label="Opening Stock"
                          type="number"
                          placeholder="Enter Opening Stock"
                          min="0"
                          step="0.001"
                          value={formData.opening_stock}
                          onChange={(event) =>
                            updateField("opening_stock", event.target.value)
                          }
                        />
                      ) : null}
                      <UniFieldInput
                        label="Min Stock"
                        type="number"
                        placeholder="Enter Min Stock"
                        min="0"
                        step="0.001"
                        value={formData.min_stock}
                        onChange={(event) =>
                          updateField("min_stock", event.target.value)
                        }
                      />
                      <UniFieldInput
                        label="Max Stock"
                        type="number"
                        placeholder="Enter Max Stock"
                        min="0"
                        step="0.001"
                        value={formData.max_stock}
                        onChange={(event) =>
                          updateField("max_stock", event.target.value)
                        }
                      />
                    </div>
                  </section>
                ) : null}

                <section className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="mb-4 text-base font-semibold text-gray-900">
                    Preferences
                  </h2>
                  <div className="space-y-3">
                    {[
                      ["track_stock", "Track Stock"],
                      ["allow_decimal_qty", "Allow Decimal Qty"],
                      ["expiry_tracking_enabled", "Expiry Tracking"],
                    ].map(([name, label]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {label}
                        </span>
                        <Switch
                          checked={Boolean(
                            formData[name as keyof ProductFormValues]
                          )}
                          disabled={
                            !isStockProduct && name !== "allow_decimal_qty"
                          }
                          onCheckedChange={(checked) =>
                            updateField(
                              name as keyof ProductFormValues,
                              checked
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-28 bg-black text-white hover:bg-black/90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Saving...
                    </span>
                  ) : isEdit ? (
                    "Update Product"
                  ) : (
                    "Save Product"
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
        <BrandForm
          isOpen={addFormOpen === "brand"}
          onClose={() => setAddFormOpen(null)}
          onSuccess={() => handleAddFormSuccess("brand")}
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
