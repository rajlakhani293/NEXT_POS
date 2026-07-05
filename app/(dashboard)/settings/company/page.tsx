"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions } from "@/hooks/use-permissions"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { useAppDispatch } from "@/lib/redux/hooks"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const companyFields = [
  {
    name: "name",
    label: "Company",
    placeholder: "Store Name",
    required: true,
  },
  {
    name: "legal_name",
    label: "Legal Name",
    placeholder: "Legal Name",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "Store Email",
    type: "email",
  },
  {
    name: "phone",
    label: "Phone",
    placeholder: "Store Phone",
  },
  {
    name: "gst_number",
    label: "Tax Number",
    placeholder: "Tax Number",
  },
  {
    name: "city_name",
    label: "City",
    placeholder: "City",
  },
  {
    name: "state",
    label: "State",
    placeholder: "State",
  },
  {
    name: "address",
    label: "Address",
    placeholder: "Store Address",
    as: "textarea",
  },
  {
    name: "logo",
    label: "Logo",
    placeholder: "Logo",
  },
]

const initialCompany = companyFields.reduce<Record<string, string>>(
  (current, field) => ({ ...current, [field.name]: "" }),
  {}
)

export default function CompanySettingsPage() {
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const dispatch = useAppDispatch()
  const [getCompany, companyState] = (settings as any).useGetCompanyMutation()
  const [updateCompany, updateState] = (settings as any).useUpdateCompanyMutation()
  const [values, setValues] = useState(initialCompany)

  useEffect(() => {
    getCompany()
  }, [getCompany])

  const company = companyState.data?.data?.company
  const branch = companyState.data?.data?.branch

  useEffect(() => {
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
  }, [company])

  const canSave = useMemo(() => values.name.trim().length > 0, [values.name])
  const canUpdate = hasPermission(PERMISSIONS.settings.update)

  const updateValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSave = async () => {
    if (!canSave) return

    const response = await updateCompany({
      payLoad: {
        company: values,
      },
    }).unwrap()

    if (response?.data) {
      dispatch(setSessionData(response.data))
    }

    showToast.success(response?.message || t("Company updated successfully."))
  }

  return (
    <PermissionGuard permission={PERMISSIONS.settings.view}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t("Company")}</h1>
            <p className="text-sm text-muted-foreground">{t("Store Details")}</p>
          </div>
          {canUpdate ? (
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave || updateState.isLoading}
            >
              {updateState.isLoading ? <Spinner className="mr-2 size-4" /> : null}
              {t("Save")}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 rounded-md border bg-white p-4 md:grid-cols-2">
          {companyState.isLoading ? (
            <div className="col-span-full flex min-h-48 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            companyFields.map((field) => (
              <div
                key={field.name}
                className={field.as === "textarea" ? "md:col-span-2" : ""}
              >
                <UniFieldInput
                  label={t(field.label)}
                  required={field.required}
                  as={field.as === "textarea" ? "textarea" : "input"}
                  type={field.type || "text"}
                  value={values[field.name] || ""}
                  placeholder={t(field.placeholder)}
                  onChange={(event) => updateValue(field.name, event.target.value)}
                />
              </div>
            ))
          )}
        </div>

        {branch ? (
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm font-semibold text-gray-900">{t("Current Branch")}</div>
            <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <span>{branch.name || "-"}</span>
              <span>{branch.code || "-"}</span>
              <span>{branch.phone || "-"}</span>
            </div>
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  )
}
