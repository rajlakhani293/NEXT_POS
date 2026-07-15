"use client"

import { Search } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import { Button } from "@/components/ui/button"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { MediaManagerDialog, mediaImageUrl } from "@/components/media-manager"
import { showToast } from "@/lib/toast"
import { catalog } from "@/lib/api/catalog"
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

import { useEffect, useState } from "react"

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

      <MediaManagerDialog
        open={mediaManagerOpen}
        onOpenChange={setMediaManagerOpen}
        onSelect={(record) => {
          const selectedUrl = mediaImageUrl(record)
          if (!selectedUrl) {
            showToast.error(t("Selected media has no image URL."))
            return
          }
          handleChange("preview_url", selectedUrl)
        }}
      />
    </div>
  )
}
