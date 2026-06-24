"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { settings } from "@/lib/api/settings"
import { showToast } from "@/lib/toast"

const initialSettings = {
  allow_partial_orders: false,
  enable_customer_rewards: false,
  enable_credit_account: false,
  enable_cash_registers: true,
  allow_decimal_quantities: true,
  quick_product_enabled: true,
  show_quantity: true,
  currency_precision: 2,
  hide_empty_categories: true,
  unit_price_editable: true,
  default_change_payment_type: "cash-payment",
  order_types: ["takeaway", "delivery"],
  store_language: "en",
}

const orderTypeOptions = [
  { value: "takeaway", label: "Take Order" },
  { value: "delivery", label: "Delivery" },
]

function SettingSwitch({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-gray-100 bg-white px-5 py-4">
      <div>
        <div className="text-sm font-semibold text-gray-950">{title}</div>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function OrderTypeMultiSelect({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const selectedLabels = orderTypeOptions
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)

  const toggleValue = (nextValue: string) => {
    const next = value.includes(nextValue)
      ? value.filter((item) => item !== nextValue)
      : [...value, nextValue]
    onChange(next)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between rounded-xl bg-white px-4 text-left font-semibold"
        >
          <span className={selectedLabels.length ? "text-gray-950" : "text-gray-400"}>
            {selectedLabels.length
              ? selectedLabels.join(", ")
              : "Select order type"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        {orderTypeOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={() => toggleValue(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function BusinessSettingsPage() {
  const hasLoadedRef = useRef(false)
  const [businessSettings, setBusinessSettings] = useState(initialSettings)

  const [getBusinessSettings, businessState] = (
    settings as any
  ).useGetBusinessSettingsMutation()
  const [updateBusinessSettings, updateState] = (
    settings as any
  ).useUpdateBusinessSettingsMutation()

  const refreshSettings = async () => {
    const response = await getBusinessSettings().unwrap()
    setBusinessSettings({
      ...initialSettings,
      ...(response?.data?.settings || {}),
    })
  }

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    refreshSettings()
  }, [])

  const updateBusinessField = (
    name: keyof typeof initialSettings,
    value: boolean | number | string | string[]
  ) => {
    setBusinessSettings((current) => ({ ...current, [name]: value }))
  }

  const saveBusinessSettings = async () => {
    if (!businessSettings.order_types.length) {
      showToast.error("Select at least one order type.")
      return
    }
    const response = await updateBusinessSettings({
      payLoad: businessSettings,
    }).unwrap()
    setBusinessSettings({
      ...initialSettings,
      ...(response?.data?.settings || {}),
    })
    showToast.success(response?.message || "Business settings updated.")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-950">
            Business Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure sale behavior, customer account rules, and order types.
          </p>
        </div>

        {businessState.isLoading ? (
          <div className="flex h-48 items-center justify-center gap-3 text-sm font-semibold text-gray-500">
            <Spinner />
            Loading business settings...
          </div>
        ) : (
          <div className="grid gap-6">
            <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-950">
                  Sale Rules
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Control payment, credit, reward and register behavior.
                </p>
              </div>
              <div className="grid gap-3">
                <SettingSwitch
                  title="Allow Partial Orders"
                  description="Allow checkout when customer pays partial amount or zero amount."
                  checked={businessSettings.allow_partial_orders}
                  onCheckedChange={(checked) =>
                    updateBusinessField("allow_partial_orders", checked)
                  }
                />
                <SettingSwitch
                  title="Enable Reward for Customer"
                  description="Enable reward points earning and redemption rules for customers."
                  checked={businessSettings.enable_customer_rewards}
                  onCheckedChange={(checked) =>
                    updateBusinessField("enable_customer_rewards", checked)
                  }
                />
                <SettingSwitch
                  title="Enable Credit & Account"
                  description="Allow due balance, credit ledger, wallet/account settlement."
                  checked={businessSettings.enable_credit_account}
                  onCheckedChange={(checked) =>
                    updateBusinessField("enable_credit_account", checked)
                  }
                />
                <SettingSwitch
                  title="Enable Cash Registers"
                  description="Require cashier shift/register tracking before sale checkout."
                  checked={businessSettings.enable_cash_registers}
                  onCheckedChange={(checked) =>
                    updateBusinessField("enable_cash_registers", checked)
                  }
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-950">
                  POS Defaults
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Default checkout behavior created with every company.
                </p>
              </div>
              <div className="grid gap-3">
                <SettingSwitch
                  title="Allow Decimal Quantities"
                  description="Allow quantities such as 1.5 kg or 0.25 litre."
                  checked={businessSettings.allow_decimal_quantities}
                  onCheckedChange={(checked) =>
                    updateBusinessField("allow_decimal_quantities", checked)
                  }
                />
                <SettingSwitch
                  title="Enable Quick Product"
                  description="Allow faster product selection and quick checkout entry."
                  checked={businessSettings.quick_product_enabled}
                  onCheckedChange={(checked) =>
                    updateBusinessField("quick_product_enabled", checked)
                  }
                />
                <SettingSwitch
                  title="Show Quantity"
                  description="Show product quantity controls during billing."
                  checked={businessSettings.show_quantity}
                  onCheckedChange={(checked) =>
                    updateBusinessField("show_quantity", checked)
                  }
                />
                <SettingSwitch
                  title="Hide Empty Categories"
                  description="Hide categories that do not contain available products."
                  checked={businessSettings.hide_empty_categories}
                  onCheckedChange={(checked) =>
                    updateBusinessField("hide_empty_categories", checked)
                  }
                />
                <SettingSwitch
                  title="Unit Price Editable"
                  description="Allow authorized users to edit the selling price during billing."
                  checked={businessSettings.unit_price_editable}
                  onCheckedChange={(checked) =>
                    updateBusinessField("unit_price_editable", checked)
                  }
                />
                <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
                  <UniFieldInput
                    label="Currency Precision"
                    type="number"
                    min={0}
                    max={6}
                    value={businessSettings.currency_precision}
                    onChange={(event) =>
                      updateBusinessField(
                        "currency_precision",
                        Number(event.target.value)
                      )
                    }
                    containerClassName="max-w-xs"
                  />
                </div>
                <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
                  <UniFieldSelect
                    label="Store Language"
                    value={businessSettings.store_language}
                    onValueChange={(value) =>
                      updateBusinessField("store_language", value)
                    }
                    containerClassName="max-w-xs"
                  >
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </UniFieldSelect>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-950">
                  Order Types
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select which order types are available in sale checkout.
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
                <div className="grid gap-2 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-950">
                      Order Type <span className="text-red-500">*</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose Take Order, Delivery, or both.
                    </p>
                  </div>
                  <OrderTypeMultiSelect
                    value={businessSettings.order_types}
                    onChange={(nextValue) =>
                      updateBusinessField("order_types", nextValue)
                    }
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={saveBusinessSettings}
                disabled={updateState.isLoading}
              >
                {updateState.isLoading ? <Spinner /> : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
