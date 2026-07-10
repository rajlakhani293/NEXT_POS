"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { ImageUpload } from "@/components/imageUpload"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { accounting } from "@/lib/api/accounting"
import { media } from "@/lib/api/media"
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
  description?: string
  placeholder?: string
  validation?: string
  value: any
  options?: { value: string; label: string }[] | null
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
  customers_credit_enabled: yesNoOptions,
  orders_code_type: [
    { value: "date_sequential", label: "Sequential" },
    { value: "random_code", label: "Random Code" },
    { value: "number_sequential", label: "Number Sequential" },
  ],
  orders_quotation_expiration: [
    { value: "never", label: "Never" },
    { value: "3", label: "3 Days" },
    { value: "5", label: "5 Days" },
    { value: "10", label: "10 Days" },
    { value: "15", label: "15 Days" },
    { value: "30", label: "30 Days" },
  ],
  pos_registers_enabled: yesNoOptions,
  pos_idle_counter: [
    { value: "disabled", label: "Disabled" },
    { value: "5min", label: "5 Minutes" },
    { value: "10min", label: "10 Minutes" },
    { value: "15min", label: "15 Minutes" },
    { value: "20min", label: "20 Minutes" },
    { value: "30min", label: "30 Minutes" },
  ],
  pos_disbursement: yesNoOptions,
  pos_registers_default_change_payment_type: [
    { value: "cash-payment", label: "Cash" },
    { value: "bank-payment", label: "Bank Payment" },
    { value: "account-payment", label: "Customer Account" },
  ],
  pos_layout: [
    { value: "grocery_shop", label: "Retail Layout" },
    { value: "clothing_shop", label: "Clothing Shop" },
  ],
  pos_printing_document: [
    { value: "invoice", label: "Invoice" },
    { value: "receipt", label: "Receipt" },
  ],
  pos_printing_enabled_for: [
    { value: "disabled", label: "Disabled" },
    { value: "all_orders", label: "All Orders" },
    { value: "partially_paid_orders", label: "From Partially Paid Orders" },
    { value: "only_paid_orders", label: "Only Paid Orders" },
  ],
  pos_printing_gateway: [
    { value: "default", label: "Default Printing (web)" },
  ],
  pos_vat: [
    { value: "disabled", label: "Disabled" },
    { value: "flat_vat", label: "Flat Rate" },
    { value: "variable_vat", label: "Flexible Rate" },
    { value: "products_vat", label: "Products Vat" },
  ],
  pos_tax_type: [
    { value: "inclusive", label: "Inclusive" },
    { value: "exclusive", label: "Exclusive" },
  ],
  pos_prefered_price: [
    { value: "gross_prices", label: "Gross Prices" },
    { value: "net_prices", label: "Net Prices" },
  ],
  pos_numpad: [
    { value: "default", label: "Default" },
    { value: "advanced", label: "Advanced" },
  ],
  pos_action_permission_duration: [
    { value: "1", label: "1 Minute" },
    { value: "5", label: "5 Minutes" },
    { value: "10", label: "10 Minutes" },
  ],
  pos_action_permission_cooldown_features: [
    { value: "0", label: "No Cooldown" },
    { value: "5", label: "5 Minutes" },
    { value: "10", label: "10 Minutes" },
    { value: "15", label: "15 Minutes" },
    { value: "30", label: "30 Minutes" },
    { value: "60", label: "1 Hour" },
  ],
  scale_barcode_type: [
    { value: "weight", label: "Weight" },
    { value: "price", label: "Price" },
  ],
  invoice_receipt_template: [
    { value: "default", label: "Default" },
  ],
  reports_email: yesNoOptions,
  workers_enabled: [
    { value: "no", label: "No" },
    { value: "await_confirm", label: "Test" },
    { value: "yes", label: "Yes" },
  ],
  mode: [
    { value: "wipe_all", label: "Wipe All" },
    { value: "wipe_plus_grocery", label: "Wipe Plus Grocery" },
  ],
}

const multiSelectOptions: Record<string, { value: string; label: string }[]> = {
  pos_order_types: [
    { value: "takeaway", label: "Take Order" },
    { value: "delivery", label: "Delivery" },
  ],
  pos_action_permission_restricted_features: [
    { value: "pos.cart.product-discount", label: "Cart: Change Product Discount" },
    { value: "pos.cart.product-price", label: "Cart: Edit Product Price" },
    { value: "pos.cart.product-wholesale-price", label: "Cart: Use Wholesale Price" },
    { value: "pos.cart.product-delete", label: "Cart: Product Delete" },
    { value: "pos.cart.settings", label: "Cart: Change Settings" },
    { value: "pos.cart.taxes", label: "Cart: Set Taxes" },
    { value: "pos.cart.comments", label: "Cart: Add Comments" },
    { value: "pos.cart.order-type", label: "Cart: Change Order Type" },
    { value: "pos.cart.coupons", label: "Cart: Apply Coupons" },
    { value: "pos.cart.products", label: "Cart: Create Quick Product" },
    { value: "pos.cart.void", label: "Cart: Void Order" },
    { value: "pos.cart.discount", label: "Cart: Apply Discount" },
    { value: "pos.cart.hold", label: "Cart: Hold Order" },
  ],
  pos_keyboard_cancel_order: [],
  pos_keyboard_hold_order: [],
  pos_keyboard_create_customer: [],
  pos_keyboard_payment: [],
  pos_keyboard_shipping: [],
  pos_keyboard_note: [],
  pos_keyboard_order_type: [],
  pos_keyboard_fullscreen: [],
  pos_keyboard_quick_search: [],
  pos_keyboard_toggle_merge: [],
}

const shortcutOptions = [
  "ctrl",
  "shift",
  "alt",
  "space",
  "enter",
  "escape",
  "backspace",
  "tab",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "f10",
  "f11",
  "f12",
].map((value) => ({ value, label: value }))

const shortcutFieldNames = new Set([
  "pos_keyboard_cancel_order",
  "pos_keyboard_hold_order",
  "pos_keyboard_create_customer",
  "pos_keyboard_payment",
  "pos_keyboard_shipping",
  "pos_keyboard_note",
  "pos_keyboard_order_type",
  "pos_keyboard_fullscreen",
  "pos_keyboard_quick_search",
  "pos_keyboard_toggle_merge",
])

const generalCompanyLabels: Record<string, string> = {
  store_name: "Company Name",
  store_address: "Company Address",
  store_city: "Company City",
  store_phone: "Company Phone",
  store_email: "Company Email",
  store_pobox: "Company PO.Box",
  store_fax: "Company Fax",
  store_additional: "Company Additional Information",
  store_square_logo: "Company Square Logo",
  store_rectangle_logo: "Company Rectangle Logo",
}

const generalCompanyDescriptions: Record<string, string> = {
  store_square_logo: "Choose what is the square logo of the company.",
  store_rectangle_logo: "Choose what is the rectangle logo of the company.",
}

const generalCompanyPlaceholders: Record<string, string> = {
  store_name: "Company Name",
  store_address: "Company Address",
  store_city: "Company City",
  store_phone: "Company Phone",
  store_email: "Company Email",
  store_pobox: "Company PO.Box",
  store_fax: "Company Fax",
  store_additional: "Company Additional Information",
}

function normalizeIdentifier(identifier: string) {
  return identifier
}

function sourceSwitchChecked(value: any) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") return ["yes", "true", "1", "enabled"].includes(value.toLowerCase())
  return false
}

function nextSourceSwitchValue(checked: boolean) {
  return checked ? "yes" : "no"
}

function sourceFieldValue(field: SourceSettingField) {
  if (field.value === null || field.value === undefined) {
    if (field.type === "switch") return "no"
    if (field.type === "checkbox") return false
    if (field.type === "multiselect") return []
    return ""
  }
  return field.value
}

function selectValue(fieldName: string, value: any) {
  if (typeof value === "boolean") return value ? "yes" : "no"
  if (value === null || value === undefined) return ""
  return String(value)
}

export function SourceSettingsPage({ identifier }: { identifier: string }) {
  const sourceIdentifier = normalizeIdentifier(identifier)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const hasLoadedRef = useRef("")
  const [activeTab, setActiveTab] = useState("")
  const [values, setValues] = useState<Record<string, any>>({})
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<Record<string, string>>({})
  const [mediaErrors, setMediaErrors] = useState<Record<string, string>>({})
  const [getSettingsForm, formState] = (settings as any).useGetSettingsFormMutation()
  const [saveSettingsForm, saveState] = (settings as any).useSaveSettingsFormMutation()
  const [getBusinessSettings] = (settings as any).useGetBusinessSettingsMutation()
  const [resetTenantData, resetState] = (settings as any).useResetTenantDataMutation()
  const [resetDefaultTransactionAccounts, accountingResetState] = (accounting as any).useResetDefaultTransactionAccountsMutation()
  const [uploadMedia, uploadMediaState] = (media as any).useUploadMediaMutation()

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

  const uploadMediaField = async (field: SourceSettingField, file: File | null) => {
    if (!file) {
      updateValue(field.name, "")
      setMediaPreviewUrls((current) => ({ ...current, [field.name]: "" }))
      setMediaErrors((current) => ({ ...current, [field.name]: "" }))
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await uploadMedia(formData).unwrap()
      const uploaded = response?.data
      updateValue(field.name, uploaded?.id ? String(uploaded.id) : "")
      setMediaPreviewUrls((current) => ({
        ...current,
        [field.name]: uploaded?.sizes?.thumb || uploaded?.sizes?.original || "",
      }))
      setMediaErrors((current) => ({ ...current, [field.name]: "" }))
      showToast.success(response?.message || t("Media uploaded successfully."))
    } catch (error: any) {
      setMediaErrors((current) => ({
        ...current,
        [field.name]: error?.data?.message || t("Unable to upload media."),
      }))
    }
  }

  const renderField = (field: SourceSettingField) => {
    const labelKey =
      sourceIdentifier === "general"
        ? generalCompanyLabels[field.name] || field.label
        : field.label
    const descriptionKey =
      sourceIdentifier === "general"
        ? generalCompanyDescriptions[field.name] || field.description
        : field.description
    const placeholderKey =
      sourceIdentifier === "general"
        ? generalCompanyPlaceholders[field.name] || field.placeholder || labelKey
        : field.placeholder || labelKey
    const label = t(labelKey)
    const description = descriptionKey ? t(descriptionKey) : ""
    const placeholder = t(placeholderKey)
    const value = values[field.name]
    const required = String(field.validation || "").includes("required")
    const fieldOptions = (field.options || []).map((option) => ({
      value: String(option.value),
      label: option.label,
    }))
    const options = fieldOptions.length ? fieldOptions : selectOptions[field.name] || yesNoOptions

    if (field.type === "switch" || field.type === "checkbox") {
      return (
        <div className="flex items-center justify-between gap-4 rounded-md border bg-white px-4 py-3">
          <div className="text-sm font-semibold text-gray-800">
            {label}
            {required ? <span className="text-red-500">*</span> : null}
            {description ? (
              <p className="mt-1 text-xs font-medium text-gray-500">{description}</p>
            ) : null}
          </div>
          {field.type === "checkbox" ? (
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateValue(field.name, checked === true)}
            />
          ) : (
            <Switch
              checked={sourceSwitchChecked(value)}
              onCheckedChange={(checked) => updateValue(field.name, nextSourceSwitchValue(checked))}
            />
          )}
        </div>
      )
    }

    if (field.type === "media") {
      const previewUrl =
        mediaPreviewUrls[field.name] ||
        (typeof value === "string" && value.startsWith("http") ? value : "")
      return (
        <div className="rounded-md border bg-white px-4 py-3">
          <ImageUpload
            label={label}
            initialUrl={previewUrl}
            value={null}
            onChange={(file) => uploadMediaField(field, file)}
            onError={(message) =>
              setMediaErrors((current) => ({ ...current, [field.name]: message }))
            }
            error={mediaErrors[field.name]}
          />
          {description ? (
            <p className="mt-2 text-xs font-medium text-gray-500">{description}</p>
          ) : null}
          {uploadMediaState.isLoading ? (
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Spinner />
              {t("Uploading...")}
            </div>
          ) : null}
        </div>
      )
    }

    if (field.type === "select" || field.type === "search-select") {
      const emptyOption = options.find((option) => option.value === "")
      const visibleOptions = options.filter((option) => option.value !== "")
      const selectPlaceholder = required
        ? t("Select an option")
        : emptyOption?.label
          ? t(emptyOption.label)
          : t("Choose option")
      return (
        <div className="grid gap-1">
          <UniFieldSelect
            label={label}
            required={required}
            value={selectValue(field.name, value)}
            onValueChange={(nextValue) => updateValue(field.name, nextValue)}
            placeholder={selectPlaceholder}
            allowClear={!required}
            hasOptions={visibleOptions.length > 0}
            emptyLabel="No records found"
          >
            {visibleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.label)}
              </SelectItem>
            ))}
          </UniFieldSelect>
          {description ? (
            <p className="text-xs font-medium text-gray-500">{description}</p>
          ) : null}
        </div>
      )
    }

    if (field.type === "multiselect" || field.type === "inline-multiselect") {
      const selected = Array.isArray(value) ? value.map(String) : []
      const optionsList = shortcutFieldNames.has(field.name)
        ? shortcutOptions
        : fieldOptions.length
          ? fieldOptions
          : multiSelectOptions[field.name] || []
      return (
        <div className="rounded-md border bg-white px-4 py-3">
          <div className="mb-3 text-sm font-semibold text-gray-800">{label}</div>
          {description ? (
            <p className="mb-3 text-xs font-medium text-gray-500">{description}</p>
          ) : null}
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
      <div className="grid gap-1">
        <UniFieldInput
          label={label}
          required={required}
          as={field.type === "textarea" ? "textarea" : "input"}
          type={field.type === "number" ? "number" : "text"}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(event) => updateValue(field.name, event.target.value)}
        />
        {description ? (
          <p className="text-xs font-medium text-gray-500">{description}</p>
        ) : null}
      </div>
    )
  }

  const renderShortcutField = (field: SourceSettingField) => {
    const selected = Array.isArray(values[field.name])
      ? values[field.name].map(String)
      : []
    return (
      <div
        key={field.name}
        className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gray-100 py-3 last:border-0"
      >
        <span className="w-44 shrink-0 text-sm font-medium text-gray-700">
          {t(field.label)}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {shortcutOptions.map((option) => {
            const isSelected = selected.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  updateValue(
                    field.name,
                    isSelected
                      ? selected.filter((s: string) => s !== option.value)
                      : [...selected, option.value]
                  )
                }
                className={`rounded-md border px-2.5 py-1 font-mono text-xs font-semibold transition-all ${isSelected
                  ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-800"
                  }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const save = async () => {
    if (sourceIdentifier === "reset") {
      const confirmed = window.confirm(
        t("The database will be cleared and all data erased. Only users and roles are kept. Would you like to proceed ?")
      )
      if (!confirmed) return
      const response = await resetTenantData({ payLoad: values }).unwrap()
      showToast.success(response?.message || t("The database has been successfully seeded."))
      return
    }

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

  const resetAccountingDefaults = async () => {
    const confirmed = window.confirm(
      t("This will clear all records and accounts. It's ideal if you want to start from scratch. Are you sure you want to reset default settings for accounting?")
    )
    if (!confirmed) return
    const response = await resetDefaultTransactionAccounts().unwrap()
    showToast.success(response?.message || t("The default accounting accounts has been created."))
    getSettingsForm({ identifier: sourceIdentifier })
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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Page header */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t(form.title)}</h1>
          <p className="mt-1 text-sm text-gray-500">{t(form.description)}</p>
        </div>
        {tabs.length ? (
          <div className="flex shrink-0 items-center gap-2">
            {sourceIdentifier === "accounting" ? (
              <Button
                type="button"
                variant="outline"
                onClick={resetAccountingDefaults}
                disabled={accountingResetState.isLoading}
              >
                {accountingResetState.isLoading ? <Spinner /> : null}
                {t("Reset Default")}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={save}
              disabled={saveState.isLoading || resetState.isLoading}
            >
              {saveState.isLoading || resetState.isLoading ? <Spinner /> : null}
              {t("Save Settings")}
            </Button>
          </div>
        ) : null}
      </div>

      {tabs.length ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Underline tab bar */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.identifier
                return (
                  <button
                    key={tab.identifier}
                    type="button"
                    onClick={() => setActiveTab(tab.identifier)}
                    className={`shrink-0 border-b-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                  >
                    {t(tab.label)}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Fields area */}
          <div className="min-h-0 flex-1 overflow-y-auto py-6 px-1">
            {(() => {
              const shortcutFields = activeFields.filter(
                (f) => shortcutFieldNames.has(f.name)
              )
              const regularFields = activeFields.filter(
                (f) => !shortcutFieldNames.has(f.name)
              )
              return (
                <div className="space-y-6">
                  {shortcutFields.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-x-6 border-b border-gray-100 px-5 py-2.5">
                        <span className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {t("Action")}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {t("Keys")}
                        </span>
                      </div>
                      {/* Rows */}
                      <div className="px-5">
                        {shortcutFields.map((field) => renderShortcutField(field))}
                      </div>
                    </div>
                  )}
                  {regularFields.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {regularFields.map((field) => (
                        <div key={field.name}>{renderField(field)}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>


        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          {t("There is nothing to display here.")}
        </div>
      )}
    </div>
  )
}
