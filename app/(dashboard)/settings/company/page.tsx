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
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("Company Settings")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("Configure company profile information.")}</p>
        </div>
        <Button type="button" onClick={save} disabled={updateState.isLoading}>
          {updateState.isLoading ? <Spinner /> : null}
          {t("Save Settings")}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-6 px-1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <UniFieldInput
            label={t("Company Name")}
            placeholder={t("Company Name")}
            required
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
          />
          <UniFieldInput
            label={t("Legal Name")}
            placeholder={t("Legal Name")}
            value={values.legal_name}
            onChange={(event) => updateValue("legal_name", event.target.value)}
          />
          <UniFieldInput
            label={t("Company Email")}
            placeholder={t("Company Email")}
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
          />
          <UniFieldInput
            label={t("Company Phone")}
            placeholder={t("Company Phone")}
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
          />
          <UniFieldInput
            label={t("Tax Number")}
            placeholder={t("Tax Number")}
            value={values.gst_number}
            onChange={(event) => updateValue("gst_number", event.target.value)}
          />
          <UniFieldInput
            label={t("Company City")}
            placeholder={t("Company City")}
            value={values.city_name}
            onChange={(event) => updateValue("city_name", event.target.value)}
          />
          <UniFieldInput
            label={t("State")}
            placeholder={t("State")}
            value={values.state}
            onChange={(event) => updateValue("state", event.target.value)}
          />
          <div className="md:col-span-2">
            <UniFieldInput
              label={t("Company Address")}
              placeholder={t("Company Address")}
              as="textarea"
              rows={3}
              value={values.address}
              onChange={(event) => updateValue("address", event.target.value)}
            />
          </div>
          <div className="rounded-md border bg-white px-4 py-3">
            <ImageUpload
              label={t("Company Logo")}
              value={logoFile}
              initialUrl={values.logo}
              onChange={setLogoFile}
              onError={setLogoError}
              error={logoError}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
