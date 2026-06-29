"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

type SupplierFormValues = {
  first_name: string
  last_name: string
  email: string
  phone: string
  address_1: string
  address_2: string
  description: string
}

const initialValues: SupplierFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_1: "",
  address_2: "",
  description: "",
}

export default function SupplierFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"
  const loadKeyRef = useRef("")
  const { t } = useTranslation()

  const [values, setValues] = useState<SupplierFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createSupplier] = (purchases as any).useCreateSupplierMutation()
  const [editSupplier] = (purchases as any).useEditSupplierMutation()
  const [getSupplierById, supplierState] = (
    purchases as any
  ).useGetSupplierByIdMutation()

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const loadSupplier = async () => {
      if (!isEdit) {
        setValues(initialValues)
        setErrors({})
        return
      }

      const response = await getSupplierById({ id }).unwrap()
      const record = response?.data
      if (!record) return

      setValues({
        first_name: record.first_name || "",
        last_name: record.last_name || "",
        email: record.email || "",
        phone: record.phone || "",
        address_1: record.address_1 || "",
        address_2: record.address_2 || "",
        description: record.description || "",
      })
      setErrors({})
    }

    loadSupplier().catch(() => {
      showToast.error(t("unable_to_load_provider"))
    })
  }, [getSupplierById, id, isEdit, t])

  const updateValue = (field: keyof SupplierFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!values.first_name.trim()) {
      nextErrors.first_name = t("first_name_is_required")
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payLoad = {
        ...values,
        first_name: values.first_name.trim(),
      }

      const response = isEdit
        ? await editSupplier({ id, payLoad }).unwrap()
        : await createSupplier(payLoad).unwrap()

      showToast.success(
        response?.message ||
          (isEdit ? t("provider_updated_successfully") : t("provider_created_successfully"))
      )
      router.push("/purchases/suppliers")
    } catch (error: any) {
      const apiErrors = error?.data?.data?.errors
      if (apiErrors && typeof apiErrors === "object") {
        setErrors(
          Object.fromEntries(
            Object.entries(apiErrors).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? String(messages[0]) : String(messages),
            ])
          )
        )
      }
      showToast.error(error?.data?.message || t("unable_to_save_provider"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PermissionGuard
      permission={isEdit ? PERMISSIONS.purchases.update : PERMISSIONS.purchases.create}
    >
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => router.push("/purchases/suppliers")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-950">
                {isEdit ? t("edit_provider") : t("create_a_provider")}
              </h1>
              <p className="text-sm text-slate-500">{t("providers")}</p>
            </div>
          </div>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
            {t("save")}
          </Button>
        </div>

        {supplierState.isLoading && isEdit ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-3xl space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <UniFieldInput
                  label={t("first_name")}
                  value={values.first_name}
                  onChange={(event) => updateValue("first_name", event.target.value)}
                  error={errors.first_name}
                  required
                />
                <UniFieldInput
                  label={t("last_name")}
                  value={values.last_name}
                  onChange={(event) => updateValue("last_name", event.target.value)}
                  error={errors.last_name}
                />
                <UniFieldInput
                  label={t("email")}
                  type="email"
                  value={values.email}
                  onChange={(event) => updateValue("email", event.target.value)}
                  error={errors.email}
                />
                <UniFieldInput
                  label={t("phone")}
                  value={values.phone}
                  onChange={(event) => updateValue("phone", event.target.value)}
                  error={errors.phone}
                />
                <UniFieldInput
                  label={t("address_1")}
                  value={values.address_1}
                  onChange={(event) => updateValue("address_1", event.target.value)}
                  error={errors.address_1}
                />
                <UniFieldInput
                  label={t("address_2")}
                  value={values.address_2}
                  onChange={(event) => updateValue("address_2", event.target.value)}
                  error={errors.address_2}
                />
              </div>
              <UniFieldInput
                label={t("description")}
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
                error={errors.description}
              />
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
