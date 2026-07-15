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
  quick_product_default_unit: "",
  cart_discount: true,
  products_discount: true,
  edit_settings: true,
  show_quantity: true,
  items_merge: true,
  force_autofocus: false,
  enable_pinned_products: false,
  show_preview_pinned_products: false,
  hide_exhausted_products: false,
  allow_wholesale_price: false,
  pos_numpad: "default",
  pos_idle_counter: "disabled",
  pos_disbursement: false,
  pos_action_permission_enabled: false,
  pos_action_permission_duration: "5",
  pos_action_permission_restricted_features: [],
  pos_action_permission_cooldown_features: "5",
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
  pos_amount_shortcut: "",
  preferred_price: "net_prices",
  pos_preferred_price: "net_prices",
  pos_vat: "disabled",
  currency_symbol: "₹",
  currency_iso: "INR",
  currency_position: "before",
  currency_preferred: "symbol",
  currency_thousand_separator: ",",
  currency_decimal_separator: ".",
  currency_precision: 2,
  hide_empty_categories: true,
  unit_price_editable: true,
  default_change_payment_type: "cash-payment",
  order_types: ["takeaway", "delivery"],
  store_language: "en",
  registration_enabled: false,
  registration_role: "",
  registration_validated: false,
  recovery_enabled: true,
  date_format: "Y-m-d",
  datetime_format: "Y-m-d H:i",
  datetime_timezone: "UTC",
  scale_barcode_enabled: false,
  scale_barcode_prefix: "2",
  scale_barcode_product_length: 5,
  scale_barcode_value_length: 5,
  scale_barcode_type: "weight",
  orders_code_type: "date_sequential",
  orders_allow_unpaid: false,
  orders_allow_partial: false,
  orders_strict_instalments: false,
  orders_quotation_expiration: "never",
  printing_document: "receipt",
  printing_enabled_for: "only_paid_orders",
  printing_gateway: "default",
  pos_tax_group: "",
  pos_tax_type: "exclusive",
  reports_email: false,
  accounting_expenses_accounts: [],
  accounting_default_paid_expense_offset_account: "",
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

function normalizeListOption(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }
  if (value === null || value === undefined) return []
  return [value]
}

export function usePosOptions() {
  const settings = useAppSelector((state) => state.session.businessSettings?.settings)

  return useMemo(() => {
    const options = { ...defaultOptions, ...(settings || {}) }
    const optionMap = options as OptionMap
    return {
      ...options,
      allow_partial_orders: normalizeBoolOption(options.allow_partial_orders),
      enable_customer_rewards: normalizeBoolOption(options.enable_customer_rewards, true),
      enable_credit_account: normalizeBoolOption(options.enable_credit_account, true),
      enable_cash_registers: normalizeBoolOption(options.enable_cash_registers, true),
      allow_decimal_quantities: normalizeBoolOption(options.allow_decimal_quantities, true),
      quick_product_enabled: normalizeBoolOption(options.quick_product_enabled, true),
      quick_product_default_unit: String(
        optionMap.quick_product_default_unit ||
          optionMap.pos_quick_product_default_unit ||
          ""
      ),
      cart_discount: normalizeBoolOption(options.cart_discount, true),
      products_discount: normalizeBoolOption(options.products_discount, true),
      edit_settings: normalizeBoolOption(options.edit_settings, true),
      show_quantity: normalizeBoolOption(options.show_quantity, true),
      items_merge: normalizeBoolOption(options.items_merge, true),
      force_autofocus: normalizeBoolOption(options.force_autofocus),
      enable_pinned_products: normalizeBoolOption(options.enable_pinned_products),
      show_preview_pinned_products: normalizeBoolOption(options.show_preview_pinned_products),
      hide_exhausted_products: normalizeBoolOption(options.hide_exhausted_products),
      allow_wholesale_price: normalizeBoolOption(options.allow_wholesale_price),
      pos_disbursement: normalizeBoolOption(options.pos_disbursement),
      pos_action_permission_enabled: normalizeBoolOption(options.pos_action_permission_enabled),
      pos_action_permission_duration: String(options.pos_action_permission_duration || "5"),
      pos_action_permission_restricted_features: Array.isArray(options.pos_action_permission_restricted_features)
        ? options.pos_action_permission_restricted_features
        : [],
      pos_action_permission_cooldown_features: String(
        options.pos_action_permission_cooldown_features || "5"
      ),
      pos_keyboard_cancel_order: Array.isArray(options.pos_keyboard_cancel_order) ? options.pos_keyboard_cancel_order : [],
      pos_keyboard_hold_order: Array.isArray(options.pos_keyboard_hold_order) ? options.pos_keyboard_hold_order : [],
      pos_keyboard_create_customer: Array.isArray(options.pos_keyboard_create_customer) ? options.pos_keyboard_create_customer : [],
      pos_keyboard_payment: Array.isArray(options.pos_keyboard_payment) ? options.pos_keyboard_payment : [],
      pos_keyboard_shipping: Array.isArray(options.pos_keyboard_shipping) ? options.pos_keyboard_shipping : [],
      pos_keyboard_note: Array.isArray(options.pos_keyboard_note) ? options.pos_keyboard_note : [],
      pos_keyboard_order_type: Array.isArray(options.pos_keyboard_order_type) ? options.pos_keyboard_order_type : [],
      pos_keyboard_fullscreen: Array.isArray(options.pos_keyboard_fullscreen) ? options.pos_keyboard_fullscreen : [],
      pos_keyboard_quick_search: Array.isArray(options.pos_keyboard_quick_search) ? options.pos_keyboard_quick_search : [],
      pos_keyboard_toggle_merge: Array.isArray(options.pos_keyboard_toggle_merge) ? options.pos_keyboard_toggle_merge : [],
      pos_amount_shortcut: String(options.pos_amount_shortcut || ""),
      hide_empty_categories: normalizeBoolOption(options.hide_empty_categories, true),
      unit_price_editable: normalizeBoolOption(options.unit_price_editable, true),
      scale_barcode_enabled: normalizeBoolOption(options.scale_barcode_enabled),
      registration_enabled: normalizeBoolOption(options.registration_enabled),
      registration_role: String(options.registration_role || ""),
      registration_validated: normalizeBoolOption(options.registration_validated),
      recovery_enabled: normalizeBoolOption(options.recovery_enabled, true),
      orders_allow_unpaid: normalizeBoolOption(options.orders_allow_unpaid),
      orders_allow_partial: normalizeBoolOption(options.orders_allow_partial),
      orders_strict_instalments: normalizeBoolOption(options.orders_strict_instalments),
      currency_symbol: String(options.currency_symbol || "₹"),
      currency_iso: String(options.currency_iso || "INR"),
      currency_position: String(options.currency_position || "before"),
      currency_preferred: String(options.currency_preferred || "symbol"),
      currency_thousand_separator: String(options.currency_thousand_separator || ","),
      currency_decimal_separator: String(options.currency_decimal_separator || "."),
      currency_precision: Number(options.currency_precision ?? 2),
      date_format: String(options.date_format || "Y-m-d"),
      datetime_format: String(options.datetime_format || "Y-m-d H:i"),
      datetime_timezone: String(options.datetime_timezone || "UTC"),
      scale_barcode_product_length: Number(options.scale_barcode_product_length ?? 5),
      scale_barcode_value_length: Number(options.scale_barcode_value_length ?? 5),
      scale_barcode_type: String(options.scale_barcode_type || "weight"),
      order_types: Array.isArray(options.order_types) ? options.order_types : ["takeaway", "delivery"],
      preferred_price: String(options.preferred_price || options.pos_preferred_price || "net_prices"),
      pos_preferred_price: String(options.pos_preferred_price || options.preferred_price || "net_prices"),
      pos_numpad: String(options.pos_numpad || "default"),
      pos_idle_counter: String(options.pos_idle_counter || "disabled"),
      pos_vat: String(options.pos_vat || "disabled"),
      printing_document: String(options.printing_document || "receipt"),
      printing_enabled_for: String(options.printing_enabled_for || "only_paid_orders"),
      printing_gateway: String(options.printing_gateway || "default"),
      pos_tax_group: String(options.pos_tax_group || ""),
      pos_tax_type: String(options.pos_tax_type || "exclusive"),
      reports_email: normalizeBoolOption(options.reports_email),
      accounting_expenses_accounts: normalizeListOption(
        optionMap.accounting_expenses_accounts || optionMap.accounting_expense_accounts
      ),
      accounting_default_paid_expense_offset_account: String(
        optionMap.accounting_default_paid_expense_offset_account || ""
      ),
    }
  }, [settings])
}
