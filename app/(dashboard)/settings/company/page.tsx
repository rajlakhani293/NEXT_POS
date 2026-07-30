"use client"

import { useEffect, useRef, useState } from "react"

import { ImageUpload } from "@/components/imageUpload"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { useAppDispatch } from "@/lib/redux/hooks"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { showToast } from "@/lib/toast"

type CompanyFormValues = {
  name: string
  legal_name: string
  email: string
  phone: string
  gst_number: string
  city_name: string
  state: string
  address: string
  logo: string
}

const initialValues: CompanyFormValues = {
  name: "",
  legal_name: "",
  email: "",
  phone: "",
  gst_number: "",
  city_name: "",
  state: "",
  address: "",
  logo: "",
}

/** Horizontal form row: label on left, content on right */
function FormRow({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-2 first:pt-0 last:pb-0">
      {/* Left: label */}
      <div className="sm:w-56 sm:shrink-0">
        <p className="text-sm font-medium text-slate-800 leading-tight">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </p>
      </div>
      {/* Right: input */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function CompanySettingsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [values, setValues] = useState<CompanyFormValues>(initialValues)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState("")
  const [getCompany, companyState] = (settings as any).useGetCompanyMutation()
  const [updateCompany, updateState] = (settings as any).useUpdateCompanyMutation()
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    getCompany({})
  }, [getCompany])

  useEffect(() => {
    const company = companyState.data?.data?.company
    if (!company) return
    setValues({
      name: company.name || "",
      legal_name: company.legal_name || "",
      email: company.email || "",
      phone: company.phone || "",
      gst_number: company.gst_number || "",
      city_name: company.city_name || "",
      state: company.state || "",
      address: company.address || "",
      logo: company.logo || "",
    })
  }, [companyState.data])

  const updateValue = (name: keyof CompanyFormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const save = async () => {
    const payload = {
      company: values,
      branch: null,
    }

    let response
    if (logoFile) {
      const formData = new FormData()
      formData.append("payload", JSON.stringify(payload))
      formData.append("logo", logoFile)
      response = await updateCompany({ payLoad: formData }).unwrap()
    } else {
      response = await updateCompany({ payLoad: payload }).unwrap()
    }

    if (response?.data) {
      dispatch(setSessionData(response.data))
      if (response.data.company?.logo) {
        setValues((current) => ({ ...current, logo: response.data.company.logo }))
      }
    }
    setLogoFile(null)
    showToast.success(response?.message || t("Organization updated successfully."))
  }

  if (companyState.isLoading && !companyState.data) {
    return (
      <div className="flex h-48 items-center justify-center gap-3 text-sm font-semibold text-gray-500">
        <Spinner />
        {t("Loading settings...")}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Page header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("Company Settings")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("Configure company profile information.")}</p>
        </div>
        <Button type="button" onClick={save} disabled={updateState.isLoading} className="shrink-0">
          {updateState.isLoading ? <Spinner /> : null}
          {t("Save Settings")}
        </Button>
      </div>

      {/* Form body */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* Identity */}
        <FormRow label={t("Company Name")} required>
          <UniFieldInput
            placeholder={t("Company Name")}
            value={values.name}
            onChange={(e) => updateValue("name", e.target.value)}
          />
        </FormRow>

        <FormRow label={t("Legal Name")}>
          <UniFieldInput
            placeholder={t("Legal Name")}
            value={values.legal_name}
            onChange={(e) => updateValue("legal_name", e.target.value)}
          />
        </FormRow>

        <FormRow label={t("Tax Number")}>
          <UniFieldInput
            placeholder={t("e.g. 29ABCDE1234F1Z5")}
            value={values.gst_number}
            onChange={(e) => updateValue("gst_number", e.target.value)}
          />
        </FormRow>

        {/* Contact */}
        <FormRow label={t("Company Email")}>
          <UniFieldInput
            placeholder={t("hello@company.com")}
            value={values.email}
            onChange={(e) => updateValue("email", e.target.value)}
          />
        </FormRow>

        <FormRow label={t("Company Phone")}>
          <UniFieldInput
            placeholder={t("+91 98765 43210")}
            value={values.phone}
            onChange={(e) => updateValue("phone", e.target.value)}
          />
        </FormRow>

        {/* Location */}
        <FormRow label={t("City")}>
          <UniFieldInput
            placeholder={t("City")}
            value={values.city_name}
            onChange={(e) => updateValue("city_name", e.target.value)}
          />
        </FormRow>

        <FormRow label={t("State")}>
          <UniFieldInput
            placeholder={t("State")}
            value={values.state}
            onChange={(e) => updateValue("state", e.target.value)}
          />
        </FormRow>

        <FormRow label={t("Address")}>
          <UniFieldInput
            placeholder={t("Street, area, pincode…")}
            as="textarea"
            rows={3}
            value={values.address}
            onChange={(e) => updateValue("address", e.target.value)}
          />
        </FormRow>

        {/* Branding */}
        <FormRow label={t("Company Logo")}>
          <ImageUpload
            value={logoFile}
            initialUrl={values.logo}
            onChange={(file) => {
              setLogoFile(file)
              if (!file) {
                updateValue("logo", "")
              }
            }}
            onError={setLogoError}
            error={logoError}
          />
        </FormRow>

      </div>
    </div>
  )
}
