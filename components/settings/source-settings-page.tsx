"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { supportedLanguages } from "@/lib/i18n/languages"
import { useAppDispatch } from "@/lib/redux/hooks"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { showToast } from "@/lib/toast"

type SourceSettingField = {
  name: string
  type: string
  label: string
  validation?: string
  value: any
}

type SourceSettingTab = {
  identifier: string
  label: string
  fields: SourceSettingField[]
}

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

const selectOptions: Record<string, { value: string; label: string }[]> = {
  store_language: supportedLanguages.map((language) => ({
    value: language.code,
    label: language.label,
  })),
  default_theme: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "phosphor", label: "Phosphor" },
  ],
  currency_position: [
    { value: "before", label: "Before Amount" },
    { value: "after", label: "After Amount" },
  ],
  currency_prefered: [
    { value: "iso", label: "ISO Code" },
    { value: "symbol", label: "Symbol" },
  ],
  currency_precision: ["0", "1", "2", "3", "4", "5", "6"].map((value) => ({
    value,
    label: value,
  })),
  registration_enabled: yesNoOptions,
  registration_validated: yesNoOptions,
  customers_rewards_enabled: yesNoOptions,
  customers_force_valid_email: yesNoOptions,
  customers_force_unique_phone: yesNoOptions,
  customers_credit_enabled: yesNoOptions,
  orders_code_type: [
    { value: "sequential", label: "Sequential" },
    { value: "random", label: "Random" },
  ],
  orders_quotation_expiration: [
    { value: "never", label: "Never" },
    { value: "1", label: "1 Day" },
    { value: "7", label: "7 Days" },
    { value: "15", label: "15 Days" },
    { value: "30", label: "30 Days" },
  ],
  pos_layout: [
    { value: "grid", label: "Grid" },
    { value: "list", label: "List" },
  ],
  pos_printing_gateway: [
    { value: "browser", label: "Browser" },
    { value: "qz-tray", label: "QZ Tray" },
  ],
  pos_vat: [
    { value: "disabled", label: "Disabled" },
    { value: "products_vat", label: "Products VAT" },
    { value: "flat_vat", label: "Flat VAT" },
  ],
  pos_tax_type: [
    { value: "inclusive", label: "Inclusive" },
    { value: "exclusive", label: "Exclusive" },
  ],
  pos_prefered_price: [
    { value: "sale_price", label: "Sale Price" },
    { value: "net_prices", label: "Net Price" },
    { value: "wholesale_price", label: "Wholesale Price" },
  ],
  scale_barcode_type: [
    { value: "weight", label: "Weight" },
    { value: "price", label: "Price" },
  ],
  invoice_receipt_template: [
    { value: "default", label: "Default" },
  ],
  workers_enabled: yesNoOptions,
  mode: [
    { value: "soft", label: "Soft" },
    { value: "hard", label: "Hard" },
  ],
}

const multiSelectOptions: Record<string, { value: string; label: string }[]> = {
  pos_order_types: [
    { value: "takeaway", label: "Take Order" },
    { value: "delivery", label: "Delivery" },
  ],
}

function normalizeIdentifier(identifier: string) {
  if (identifier === "invoices") return "invoice"
  return identifier
}

function sourceFieldValue(field: SourceSettingField) {
  if (field.value === null || field.value === undefined) {
    if (field.type === "switch" || field.type === "checkbox") return false
    if (field.type === "multiselect") return []
    return ""
  }
  return field.value
}

export function SourceSettingsPage({ identifier }: { identifier: string }) {
  const sourceIdentifier = normalizeIdentifier(identifier)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const hasLoadedRef = useRef("")
  const [activeTab, setActiveTab] = useState("")
  const [values, setValues] = useState<Record<string, any>>({})
  const [getSettingsForm, formState] = (settings as any).useGetSettingsFormMutation()
  const [saveSettingsForm, saveState] = (settings as any).useSaveSettingsFormMutation()
  const [getBusinessSettings] = (settings as any).useGetBusinessSettingsMutation()

  useEffect(() => {
    if (hasLoadedRef.current === sourceIdentifier) return
    hasLoadedRef.current = sourceIdentifier
    getSettingsForm({ identifier: sourceIdentifier })
  }, [getSettingsForm, sourceIdentifier])

  const form = formState.data?.data
  const tabs: SourceSettingTab[] = useMemo(
    () => Object.values(form?.tabs || {}) as SourceSettingTab[],
    [form?.tabs]
  )

  useEffect(() => {
    if (!tabs.length) return
    setActiveTab((current) => current || tabs[0].identifier)
    const nextValues = tabs.reduce<Record<string, any>>((current, tab) => {
      tab.fields.forEach((field) => {
        current[field.name] = sourceFieldValue(field)
      })
      return current
    }, {})
    setValues(nextValues)
  }, [tabs])

  const updateValue = (name: string, value: any) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const renderField = (field: SourceSettingField) => {
    const label = t(field.label)
    const value = values[field.name]
    const required = String(field.validation || "").includes("required")
    const options = selectOptions[field.name] || yesNoOptions

    if (field.type === "switch" || field.type === "checkbox") {
      return (
        <div className="flex items-center justify-between gap-4 rounded-md border bg-white px-4 py-3">
          <div className="text-sm font-semibold text-gray-800">
            {label}
            {required ? <span className="text-red-500">*</span> : null}
          </div>
          {field.type === "checkbox" ? (
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateValue(field.name, checked === true)}
            />
          ) : (
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateValue(field.name, checked)}
            />
          )}
        </div>
      )
    }

    if (field.type === "select") {
      return (
        <UniFieldSelect
          label={label}
          required={required}
          value={String(value ?? "")}
          onValueChange={(nextValue) => updateValue(field.name, nextValue)}
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.label)}
            </SelectItem>
          ))}
        </UniFieldSelect>
      )
    }

    if (field.type === "multiselect") {
      const selected = Array.isArray(value) ? value : []
      const optionsList = multiSelectOptions[field.name] || []
      return (
        <div className="rounded-md border bg-white px-4 py-3">
          <div className="mb-3 text-sm font-semibold text-gray-800">{label}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {optionsList.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={(checked) => {
                    updateValue(
                      field.name,
                      checked
                        ? Array.from(new Set([...selected, option.value]))
                        : selected.filter((item: string) => item !== option.value)
                    )
                  }}
                />
                {t(option.label)}
              </label>
            ))}
          </div>
        </div>
      )
    }

    return (
      <UniFieldInput
        label={label}
        required={required}
        as={field.type === "textarea" ? "textarea" : "input"}
        type={field.type === "number" ? "number" : "text"}
        value={value ?? ""}
        onChange={(event) => updateValue(field.name, event.target.value)}
      />
    )
  }

  const save = async () => {
    const response = await saveSettingsForm({
      identifier: sourceIdentifier,
      payLoad: values,
    }).unwrap()
    const sessionSettings = await getBusinessSettings().unwrap()
    if (sessionSettings?.data) {
      dispatch(setSessionData({ business_settings: sessionSettings.data }))
    }
    showToast.success(response?.message || t("The form has been successfully saved."))
  }

  if (formState.isLoading || !form) {
    return (
      <div className="flex h-48 items-center justify-center gap-3 text-sm font-semibold text-gray-500">
        <Spinner />
        {t("Loading settings...")}
      </div>
    )
  }

  const activeFields = tabs.find((tab) => tab.identifier === activeTab)?.fields || []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">{t(form.title)}</h1>
        <p className="mt-1 text-sm text-gray-500">{t(form.description)}</p>
      </div>

      {tabs.length ? (
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.identifier}
              type="button"
              variant={activeTab === tab.identifier ? "default" : "outline"}
              onClick={() => setActiveTab(tab.identifier)}
            >
              {t(tab.label)}
            </Button>
          ))}
        </div>
      ) : null}

      {tabs.length ? (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border bg-white p-5">
          <div className="grid max-w-3xl gap-4">
            {activeFields.map((field) => (
              <div key={field.name}>{renderField(field)}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border bg-white p-5 text-sm text-gray-500">
          {t("There is nothing to display here.")}
        </div>
      )}

      {tabs.length ? (
        <div className="flex justify-end border-t bg-white pt-4">
          <Button type="button" onClick={save} disabled={saveState.isLoading}>
            {saveState.isLoading ? <Spinner /> : null}
            {t("Save Settings")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
