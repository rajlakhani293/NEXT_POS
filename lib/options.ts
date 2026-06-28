"use client"

import { useMemo } from "react"

import { useAppSelector } from "@/lib/redux/hooks"

type OptionMap = Record<string, unknown>

const defaultOptions: OptionMap = {
  allow_partial_orders: false,
  enable_customer_rewards: true,
  enable_credit_account: true,
  enable_cash_registers: true,
  allow_decimal_quantities: true,
  quick_product_enabled: true,
  cart_discount: true,
  products_discount: true,
  edit_settings: true,
  show_quantity: true,
  currency_symbol: "₹",
  currency_iso: "INR",
  currency_position: "before",
  currency_preferred: "symbol",
  currency_precision: 2,
  hide_empty_categories: true,
  unit_price_editable: true,
  default_change_payment_type: "cash-payment",
  order_types: ["takeaway", "delivery"],
  store_language: "en",
  registration_enabled: "yes",
  scale_barcode_enabled: false,
  scale_barcode_prefix: "2",
  scale_barcode_product_length: 4,
  orders_code_type: "sequential",
  orders_allow_unpaid: false,
  orders_strict_instalments: false,
  orders_quotation_expiration: "7",
  pos_tax_group: "",
  pos_tax_type: "exclusive",
}

export function normalizeBoolOption(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") {
    if (["yes", "true", "1", "enabled"].includes(value.toLowerCase())) return true
    if (["no", "false", "0", "disabled"].includes(value.toLowerCase())) return false
  }
  return fallback
}

export function usePosOptions() {
  const settings = useAppSelector((state) => state.session.businessSettings?.settings)

  return useMemo(() => {
    const options = { ...defaultOptions, ...(settings || {}) }
    return {
      ...options,
      allow_partial_orders: normalizeBoolOption(options.allow_partial_orders),
      enable_customer_rewards: normalizeBoolOption(options.enable_customer_rewards, true),
      enable_credit_account: normalizeBoolOption(options.enable_credit_account, true),
      enable_cash_registers: normalizeBoolOption(options.enable_cash_registers, true),
      allow_decimal_quantities: normalizeBoolOption(options.allow_decimal_quantities, true),
      quick_product_enabled: normalizeBoolOption(options.quick_product_enabled, true),
      cart_discount: normalizeBoolOption(options.cart_discount, true),
      products_discount: normalizeBoolOption(options.products_discount, true),
      edit_settings: normalizeBoolOption(options.edit_settings, true),
      show_quantity: normalizeBoolOption(options.show_quantity, true),
      hide_empty_categories: normalizeBoolOption(options.hide_empty_categories, true),
      unit_price_editable: normalizeBoolOption(options.unit_price_editable, true),
      scale_barcode_enabled: normalizeBoolOption(options.scale_barcode_enabled),
      orders_allow_unpaid: normalizeBoolOption(options.orders_allow_unpaid),
      orders_strict_instalments: normalizeBoolOption(options.orders_strict_instalments),
      currency_symbol: String(options.currency_symbol || "₹"),
      currency_iso: String(options.currency_iso || "INR"),
      currency_position: String(options.currency_position || "before"),
      currency_preferred: String(options.currency_preferred || "symbol"),
      currency_precision: Number(options.currency_precision ?? 2),
      scale_barcode_product_length: Number(options.scale_barcode_product_length ?? 4),
      order_types: Array.isArray(options.order_types) ? options.order_types : ["takeaway", "delivery"],
    }
  }, [settings])
}
