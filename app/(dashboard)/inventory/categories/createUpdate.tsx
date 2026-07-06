"use client"

import { useEffect } from "react"

import DynamicForm from "@/components/DynamicForm"
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
  description: string
}

const initialValues: CategoryFormValues = {
  name: "",
  parent_id: "",
  displays_on_pos: true,
  preview_url: "",
  description: "",
}

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

  useEffect(() => {
    if (isOpen) {
      void getCategoriesDropdown()
      if (editId) {
        void getCategoryById({ id: editId })
      }
    }
  }, [editId, getCategoryById, getCategoriesDropdown, isOpen])

  const categoryOptions = [
    { label: t("No Parent"), value: "" },
    ...(categories.data?.data || [])
      .filter((c: any) => String(c.id) !== String(editId))
      .map((c: any) => ({
        label: c.name,
        value: String(c.id),
      })),
  ]

  const record = data?.data
  const formValues: CategoryFormValues =
    editId && record
      ? {
          name: record.name || "",
          parent_id: record.parent_id ? String(record.parent_id) : "",
          displays_on_pos: record.displays_on_pos !== false,
          preview_url: record.preview_url || "",
          description: record.description || "",
        }
      : initialValues

  const handleSubmit = async (values: CategoryFormValues) => {
    const payLoad = {
      name: values.name,
      parent_id: values.parent_id ? Number(values.parent_id) : null,
      displays_on_pos: values.displays_on_pos,
      preview_url: values.preview_url || null,
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
      name: "parent_id",
      label: t("Parent Category"),
      type: "select",
      options: categoryOptions,
      placeholder: t("Select parent category"),
    },
    {
      name: "displays_on_pos",
      label: t("Displays On POS"),
      type: "switch",
      required: true,
    },
    {
      name: "preview_url",
      label: t("Preview URL"),
      type: "text",
      placeholder: t("Enter preview URL"),
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
  )
}
