"use client"

import { useEffect } from "react"

import DynamicForm from "@/components/DynamicForm"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type CatalogMasterFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
  entityName: string
  fields: any[]
  initialValues: Record<string, any>
  createHook: any
  editHook: any
  getByIdHook: any
  formWidth?: string
  nestedDrawer?: boolean
  buildPayload?: (values: Record<string, any>) => Record<string, any>
}

export function CatalogMasterForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
  entityName,
  fields,
  initialValues,
  createHook,
  editHook,
  getByIdHook,
  formWidth = "w-[520px]",
  nestedDrawer,
  buildPayload,
}: CatalogMasterFormProps) {
  const [createRecord] = createHook()
  const [editRecord] = editHook()
  const [getRecordById, { data, isLoading }] = getByIdHook()
  const { t } = useTranslation()

  useEffect(() => {
    if (isOpen && editId) {
      getRecordById({ id: editId })
    }
  }, [editId, getRecordById, isOpen])

  const record = data?.data
  const normalizeValues = (values: Record<string, any>) => {
    return fields.reduce(
      (current, field) => {
        if (
          field.name === "active" &&
          Object.prototype.hasOwnProperty.call(current, "status")
        ) {
          current.active = Number(current.status) === 0
        }
        if (field.type === "select" && field.multiple && Array.isArray(current[field.name])) {
          current[field.name] = current[field.name].map((item: any) => {
            if (item && typeof item === "object") {
              return item.id ?? item.value ?? ""
            }
            return item
          }).filter((item: any) => item !== "")
        }
        if (
          field.type === "select" &&
          !field.multiple &&
          current[field.name] !== undefined &&
          current[field.name] !== null
        ) {
          current[field.name] = String(current[field.name])
        }
        return current
      },
      { ...values }
    )
  }

  const formValues = normalizeValues(
    editId && record ? { ...initialValues, ...record } : initialValues
  )
  const translatedFields = fields.map((field) => ({
    ...field,
    label: field.label ? t(field.label) : field.label,
    placeholder: field.placeholder ? t(field.placeholder) : field.placeholder,
    description: field.description ? t(field.description) : field.description,
  }))

  const handleSubmit = async (values: Record<string, any>) => {
    const payLoad = buildPayload ? buildPayload(values) : values

    if (editId) {
      const response = await editRecord({ id: editId, payLoad }).unwrap()
      showToast.success(
        response?.message || t(`${entityName} updated successfully.`)
      )
    } else {
      const response = await createRecord(payLoad).unwrap()
      showToast.success(
        response?.message || t(`${entityName} created successfully.`)
      )
    }

    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      key={editId || `create-${entityName}`}
      fields={translatedFields}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? t(`Edit ${entityName}`) : t(`Create ${entityName}`)}
      isOpen={isOpen}
      formWidth={formWidth}
      nestedDrawer={nestedDrawer}
      isLoading={Boolean(editId) && isLoading}
    />
  )
}
