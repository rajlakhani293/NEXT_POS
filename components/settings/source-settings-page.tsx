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
    { value: "grid", label: "Grid" },
    { value: "list", label: "List" },
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
    { value: "products_vat", label: "Products VAT" },
    { value: "flat_vat", label: "Flat VAT" },
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
  const [getSettingsForm, formState] = (settings as any).useGetSettingsFormMutation()
  const [saveSettingsForm, saveState] = (settings as any).useSaveSettingsFormMutation()
  const [getBusinessSettings] = (settings as any).useGetBusinessSettingsMutation()
  const [resetTenantData, resetState] = (settings as any).useResetTenantDataMutation()

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
          value={selectValue(field.name, value)}
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

    if (field.type === "multiselect" || field.type === "inline-multiselect") {
      const selected = Array.isArray(value) ? value : []
      const optionsList = shortcutFieldNames.has(field.name)
        ? shortcutOptions
        : multiSelectOptions[field.name] || []
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
          <Button type="button" onClick={save} disabled={saveState.isLoading || resetState.isLoading}>
            {saveState.isLoading || resetState.isLoading ? <Spinner /> : null}
            {t("Save Settings")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
