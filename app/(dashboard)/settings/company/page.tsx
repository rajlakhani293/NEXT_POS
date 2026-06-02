"use client"

import { useEffect, useState } from "react"

import { ImageUpload } from "@/components/imageUpload"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { settings } from "@/lib/api/settings"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const initialValues = {
  name: "",
  legal_name: "",
  email: "",
  phone: "",
  gst_number: "",
  city_name: "",
  state_id: "",
  address: "",
  logo: "",
}

function ProfileField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2 py-3 last:border-b-0 md:grid-cols-[280px_minmax(0,1fr)] md:items-start md:gap-x-16">
      <div className="pt-2 text-sm font-semibold text-gray-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function StateSelect({
  value,
  onValueChange,
  placeholder,
  options,
}: {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: { label: string; value: string }[]
}) {
  return (
    <UniFieldSelect
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      allowClear
    >
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </UniFieldSelect>
  )
}

export default function CompanySettingsPage() {
  const [values, setValues] = useState(initialValues)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState("")
  const company = (settings as any).useGetCompanyQuery()
  const states = (settings as any).useGetStatesDropdownQuery()
  const [updateCompany, updateState] = (
    settings as any
  ).useUpdateCompanyMutation()

  useEffect(() => {
    const data = company.data?.data
    if (data) {
      setValues({ ...initialValues, ...(data.company || {}) })
      setLogoFile(null)
      setLogoError("")
    }
  }, [company.data])

  const updateField = (name: string, value: string) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (logoError) return

    const payLoad = {
      company: {
        ...values,
        state_id: values.state_id ? Number(values.state_id) : null,
      },
    }
    let requestBody: typeof payLoad | FormData = payLoad
    if (logoFile) {
      requestBody = new FormData()
      requestBody.append("payload", JSON.stringify(payLoad))
      requestBody.append("logo", logoFile)
    }
    const response = await updateCompany({ payLoad: requestBody }).unwrap()
    const logo = response?.data?.company?.logo || values.logo
    setValues((current) => ({ ...current, logo }))
    setLogoFile(null)
    showToast.success(
      response?.message || "Company profile updated successfully."
    )
  }

  const stateOptions = (states.data?.data || []).map((state: any) => ({
    label: state.name,
    value: String(state.id),
  }))

  return (
    <PermissionGuard permission={PERMISSIONS.settings.view}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            <section className="px-10 py-5">
              <h2 className="mb-4 text-2xl font-bold">Company Details</h2>
              <div>
                <ProfileField label="Company Logo">
                  <ImageUpload
                    value={logoFile}
                    initialUrl={values.logo}
                    error={logoError}
                    onError={setLogoError}
                    onChange={(file) => {
                      setLogoFile(file)
                      if (!file) {
                        updateField("logo", "")
                      }
                    }}
                  />
                </ProfileField>
                <ProfileField label="Company Name" required>
                  <UniFieldInput
                    placeholder="Enter company name"
                    required
                    value={values.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </ProfileField>
                <ProfileField label="Legal Name">
                  <UniFieldInput
                    placeholder="Enter legal business name"
                    value={values.legal_name}
                    onChange={(e) => updateField("legal_name", e.target.value)}
                  />
                </ProfileField>
                <ProfileField label="Email">
                  <UniFieldInput
                    placeholder="Enter company email"
                    type="email"
                    value={values.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </ProfileField>
                <ProfileField label="Phone">
                  <UniFieldInput
                    placeholder="Enter company phone"
                    value={values.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </ProfileField>
                <ProfileField label="GST Number">
                  <UniFieldInput
                    placeholder="Enter GST number"
                    value={values.gst_number}
                    onChange={(e) => updateField("gst_number", e.target.value)}
                  />
                </ProfileField>
                <ProfileField label="City Name">
                  <UniFieldInput
                    placeholder="Enter company city"
                    value={values.city_name}
                    onChange={(e) => updateField("city_name", e.target.value)}
                  />
                </ProfileField>
                <ProfileField label="State">
                  <StateSelect
                    placeholder="Select company state"
                    value={values.state_id ? String(values.state_id) : ""}
                    onValueChange={(value) => updateField("state_id", value)}
                    options={stateOptions}
                  />
                </ProfileField>
                <ProfileField label="Address">
                  <UniFieldInput
                    as="textarea"
                    placeholder="Enter company address"
                    value={values.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </ProfileField>
              </div>
            </section>
          </div>

          <div className="flex flex-none justify-end border-t bg-white px-6 py-2">
            <Button type="submit" disabled={updateState.isLoading}>
              {updateState.isLoading ? <Spinner /> : "Save Profile"}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  )
}
