"use client"

import { useEffect, useState } from "react"
import { ImagePlus, Search } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { showToast } from "@/lib/toast"
import { catalog } from "@/lib/api/catalog"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"

type CategoryFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
}

type CategoryFormValues = {
  name: string
  parent_id: string
  displays_on_pos: boolean
  preview_url: string
  scale_range_id: string
  description: string
}

const initialValues: CategoryFormValues = {
  name: "",
  parent_id: "",
  displays_on_pos: true,
  preview_url: "",
  scale_range_id: "",
  description: "",
}

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return ""
  if (/^(https?:|data:|blob:)/.test(value)) return value
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "")
  const path = value.startsWith("/") ? value : `/${value}`
  return `${base}${path}`
}

const mediaImageUrl = (record?: any) =>
  resolveAssetUrl(
    record?.sizes?.original ||
    record?.sizes?.thumb ||
    record?.url ||
    record?.full_url ||
    record?.path ||
    record?.preview_url ||
    ""
  )

export function CategoryForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
}: CategoryFormProps) {
  const { t } = useTranslation()
  const [createCategory] = (catalog as any).useCreateCategoryMutation()
  const [editCategory] = (catalog as any).useEditCategoryMutation()
  const [getCategoryById, { data, isLoading }] = (
    catalog as any
  ).useGetCategoryByIdMutation()
  const [getCategoriesDropdown, categories] = (
    catalog as any
  ).useGetCategoriesDropdownMutation()
  const [getScaleRangesDropdown, scaleRanges] = (
    catalog as any
  ).useGetScaleRangesDropdownMutation()

  useEffect(() => {
    if (isOpen) {
      void getCategoriesDropdown()
      void getScaleRangesDropdown()
      if (editId) {
        void getCategoryById({ id: editId })
      }
    }
  }, [editId, getCategoryById, getCategoriesDropdown, getScaleRangesDropdown, isOpen])

  const categoryOptions = (categories.data?.data || [])
    .filter((c: any) => String(c.id) !== String(editId))
    .map((c: any) => ({
      label: c.name,
      value: String(c.id),
    }))
  const scaleRangeOptions = (scaleRanges.data?.data || []).map((range: any) => ({
    label: range.range_start || range.range_end
      ? `${range.name} (${range.range_start || "-"}-${range.range_end || "-"})`
      : range.name,
    value: String(range.id),
  }))

  const record = data?.data
  const formValues: CategoryFormValues =
    editId && record
      ? {
        name: record.name || "",
        parent_id: record.parent_id ? String(record.parent_id) : "",
        displays_on_pos: record.displays_on_pos !== false,
        preview_url: record.preview_url || "",
        scale_range_id: record.scale_range_id ? String(record.scale_range_id) : "",
        description: record.description || "",
      }
      : initialValues

  const handleSubmit = async (values: CategoryFormValues) => {
    const payLoad = {
      name: values.name,
      parent_id: values.parent_id ? Number(values.parent_id) : null,
      displays_on_pos: values.displays_on_pos,
      preview_url: values.preview_url || null,
      scale_range_id: values.scale_range_id ? Number(values.scale_range_id) : null,
      description: values.description || "",
    }

    if (editId) {
      const response = await editCategory({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || t("Category updated successfully."))
    } else {
      const response = await createCategory(payLoad).unwrap()
      showToast.success(response?.message || t("Category created successfully."))
    }

    onSuccess()
    onClose()
  }

  const fields = [
    {
      name: "name",
      label: t("Name"),
      type: "text",
      placeholder: t("Enter category name"),
      required: true,
    },
    {
      name: "preview_url",
      label: t("Preview"),
      custom: ({ formData, handleChange }: any) => (
        <CategoryPreviewPicker formData={formData} handleChange={handleChange} />
      ),
    },
    {
      name: "parent_id",
      label: t("Parent Category"),
      type: "select",
      options: categoryOptions,
      placeholder: t("Select parent category"),
      allowClear: true,
    },
    {
      name: "displays_on_pos",
      label: t("Displays On POS"),
      type: "switch",
      required: true,
    },
    {
      name: "scale_range_id",
      label: t("PLU Range"),
      type: "select",
      options: scaleRangeOptions,
      placeholder: t("Select PLU Range"),
      allowClear: true,
      note: t("Select a PLU range to automatically assign PLU codes to weighable products in this category."),
    },
    {
      name: "description",
      label: t("Description"),
      type: "textarea",
      placeholder: t("Enter description"),
      rows: 3,
    },
  ]

  return (
    <>
      <DynamicForm
        key={editId || "create-category"}
        fields={fields as any}
        initialValues={formValues}
        onSubmit={handleSubmit}
        onClose={onClose}
        onSuccess={onSuccess}
        title={editId ? t("Edit Category") : t("Create Category")}
        isOpen={isOpen}
        formWidth="w-[520px]"
        isLoading={Boolean(editId) && isLoading}
      />
    </>
  )
}

function CategoryPreviewPicker({
  formData,
  handleChange,
}: {
  formData: CategoryFormValues
  handleChange: (name: keyof CategoryFormValues, value: any) => void
}) {
  const { t } = useTranslation()
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false)
  const [mediaSearch, setMediaSearch] = useState("")
  const [getMediaData, mediaState] = (media as any).useGetMediaDataMutation()
  const mediaRecords = mediaState.data?.data?.items || mediaState.data?.data?.data || mediaState.data?.data || []

  useEffect(() => {
    if (!mediaManagerOpen) return
    const timeout = window.setTimeout(() => {
      void getMediaData({ page: 1, per_page: 50, search: mediaSearch })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [getMediaData, mediaManagerOpen, mediaSearch])

  return (
    <div className="space-y-2">
      <UniFieldInput
        label={t("Preview")}
        placeholder={t("Choose an image from Medias Manager")}
        value={formData.preview_url || ""}
        onChange={(event) => handleChange("preview_url", event.target.value)}
        allowClear
        onClear={() => handleChange("preview_url", "")}
        addonAfter={
          <Button type="button" variant="outline" className="h-10" onClick={() => setMediaManagerOpen(true)}>
            <Search className="size-4" />
            {t("Medias Manager")}
          </Button>
        }
      />
      <p className="text-sm text-gray-500">{t("Provide a preview url to the category.")}</p>

      <Dialog open={mediaManagerOpen} onOpenChange={setMediaManagerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Medias Manager")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <UniFieldInput
              label={t("Search")}
              placeholder={t("Search Medias")}
              value={mediaSearch}
              onChange={(event) => setMediaSearch(event.target.value)}
            />
            <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-4">
              {mediaRecords.map((record: any, index: number) => {
                const imageUrl = mediaImageUrl(record)
                return (
                  <button
                    key={`category-media-${record.id || imageUrl || index}`}
                    type="button"
                    className="rounded-lg border bg-white p-2 text-left hover:border-gray-900"
                    onClick={() => {
                      const selectedUrl = mediaImageUrl(record)
                      if (!selectedUrl) {
                        showToast.error(t("Selected media has no image URL."))
                        return
                      }
                      handleChange("preview_url", selectedUrl)
                      setMediaManagerOpen(false)
                    }}
                  >
                    <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                      {imageUrl ? (
                        <img src={imageUrl} alt={record.name || record.file_name || t("Image")} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImagePlus className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 truncate text-xs font-semibold text-gray-700">
                      {record.name || record.file_name || record.url || t("Image")}
                    </div>
                  </button>
                )
              })}
              {!mediaRecords.length ? (
                <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm font-medium text-muted-foreground">
                  {t("No record found")}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
