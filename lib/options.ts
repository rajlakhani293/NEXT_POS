"use client"

import { useMemo } from "react"

import { useAppSelector } from "@/lib/redux/hooks"

type OptionMap = Record<string, unknown>

const defaultOptions: OptionMap = {
  enable_customer_rewards: true,
  enable_credit_account: true,
  enable_cash_registers: true,
  allow_decimal_quantities: true,
  quick_product_enabled: true,
  pos_quick_product: true,
  pos_quick_product_default_unit: "",
  cart_discount: true,
  products_discount: true,
  edit_settings: true,
  show_quantity: true,
  items_merge: true,
  pos_items_merge: true,
  force_autofocus: false,
  enable_pinned_products: false,
  show_preview_pinned_products: false,
  hide_exhausted_products: false,
  allow_wholesale_price: false,
  pos_layout: "grocery_shop",
  pos_sound_enabled: true,
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
  pos_complete_sale_audio: "",
  pos_new_item_audio: "",
  pos_order_sms: false,
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
  pos_unit_price_editable: true,
  pos_registers_default_change_payment_type: "",
  order_types: ["takeaway", "delivery"],
  customers_default: "",
  customers_default_group: "",
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
  pos_printing_document: "receipt",
  pos_printing_enabled_for: "only_paid_orders",
  pos_printing_gateway: "default",
  invoice_receipt_template: "default",
  invoice_receipt_logo: "",
  invoice_merge_similar_products: false,
  invoice_display_tax_breakdown: false,
  invoice_receipt_footer: "",
  invoice_receipt_column_a: "",
  invoice_receipt_column_b: "",
  pos_tax_group: "",
  pos_tax_type: "exclusive",
  reports_email: false,
  pos_enable_reordering: false,
  accounting_expenses_accounts: [],
  accounting_default_paid_expense_offset_account: "",
  accounting_orders_revenues_account: "",
  accounting_orders_cash_account: "",
  accounting_orders_unpaid_account: "",
  accounting_orders_cogs_account: "",
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

function normalizeBoolAlias(fallback: boolean, ...values: unknown[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return normalizeBoolOption(value, fallback)
    }
  }
  return fallback
}

export function usePosOptions() {
  const settings = useAppSelector((state) => state.session.businessSettings?.settings)

  return useMemo(() => {
    const options = { ...defaultOptions, ...(settings || {}) }
    const optionMap = options as OptionMap
    const allowPartialOrders = normalizeBoolAlias(
      false,
      optionMap.orders_allow_partial
    )
    const allowUnpaidOrders = normalizeBoolAlias(
      false,
      optionMap.orders_allow_unpaid
    )
    const normalized = {
      ...options,
      enable_customer_rewards: normalizeBoolOption(options.enable_customer_rewards, true),
      enable_credit_account: normalizeBoolOption(options.enable_credit_account, true),
      pos_registers_enabled: normalizeBoolAlias(true, optionMap.pos_registers_enabled, optionMap.enable_cash_registers),
      pos_allow_decimal_quantities: normalizeBoolAlias(true, optionMap.pos_allow_decimal_quantities, optionMap.allow_decimal_quantities),
      pos_quick_product: normalizeBoolAlias(true, optionMap.pos_quick_product, optionMap.quick_product_enabled),
      pos_quick_product_default_unit: String(
        optionMap.pos_quick_product_default_unit ||
          optionMap.quick_product_default_unit ||
          ""
      ),
      cart_discount: normalizeBoolOption(options.cart_discount, true),
      products_discount: normalizeBoolOption(options.products_discount, true),
      edit_settings: normalizeBoolOption(options.edit_settings, true),
      pos_show_quantity: normalizeBoolAlias(true, optionMap.pos_show_quantity, optionMap.show_quantity),
      pos_items_merge: normalizeBoolAlias(true, optionMap.pos_items_merge, optionMap.items_merge),
      pos_force_autofocus: normalizeBoolAlias(false, optionMap.pos_force_autofocus, optionMap.force_autofocus),
      pos_enable_pinned_products: normalizeBoolAlias(false, optionMap.pos_enable_pinned_products, optionMap.enable_pinned_products),
      pos_show_preview_pinned_products: normalizeBoolAlias(false, optionMap.pos_show_preview_pinned_products, optionMap.show_preview_pinned_products),
      pos_hide_exhausted_products: normalizeBoolAlias(false, optionMap.pos_hide_exhausted_products, optionMap.hide_exhausted_products),
      pos_hide_empty_categories: normalizeBoolAlias(true, optionMap.pos_hide_empty_categories, optionMap.hide_empty_categories),
      pos_allow_wholesale_price: normalizeBoolAlias(false, optionMap.pos_allow_wholesale_price, optionMap.allow_wholesale_price),
      pos_layout: String(optionMap.pos_layout || "grocery_shop"),
      pos_sound_enabled: normalizeBoolOption(optionMap.pos_sound_enabled, true),
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
      pos_complete_sale_audio: String(options.pos_complete_sale_audio || ""),
      pos_new_item_audio: String(options.pos_new_item_audio || ""),
      pos_order_sms: normalizeBoolOption(optionMap.pos_order_sms),
      pos_unit_price_editable: normalizeBoolAlias(true, optionMap.pos_unit_price_editable, optionMap.unit_price_editable),
      scale_barcode_enabled: normalizeBoolOption(options.scale_barcode_enabled),
      registration_enabled: normalizeBoolOption(options.registration_enabled),
      registration_role: String(options.registration_role || ""),
      registration_validated: normalizeBoolOption(options.registration_validated),
      recovery_enabled: normalizeBoolOption(options.recovery_enabled, true),
      orders_allow_unpaid: allowUnpaidOrders,
      orders_allow_partial: allowPartialOrders,
      orders_strict_instalments: normalizeBoolAlias(
        false,
        optionMap.orders_strict_instalments
      ),
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
      pos_preferred_price: String(optionMap.pos_preferred_price || optionMap.preferred_price || "net_prices"),
      pos_numpad: String(options.pos_numpad || "default"),
      pos_idle_counter: String(options.pos_idle_counter || "disabled"),
      pos_vat: String(options.pos_vat || "disabled"),
      pos_printing_document: String(optionMap.pos_printing_document || optionMap.printing_document || "receipt"),
      pos_printing_enabled_for: String(optionMap.pos_printing_enabled_for || optionMap.printing_enabled_for || "only_paid_orders"),
      pos_printing_gateway: String(optionMap.pos_printing_gateway || optionMap.printing_gateway || "default"),
      invoice_receipt_template: String(optionMap.invoice_receipt_template || "default"),
      invoice_receipt_logo: String(optionMap.invoice_receipt_logo || ""),
      invoice_merge_similar_products: normalizeBoolOption(optionMap.invoice_merge_similar_products),
      invoice_display_tax_breakdown: normalizeBoolOption(optionMap.invoice_display_tax_breakdown),
      invoice_receipt_footer: String(optionMap.invoice_receipt_footer || ""),
      invoice_receipt_column_a: String(optionMap.invoice_receipt_column_a || ""),
      invoice_receipt_column_b: String(optionMap.invoice_receipt_column_b || ""),
      pos_tax_group: String(options.pos_tax_group || ""),
      pos_tax_type: String(options.pos_tax_type || "exclusive"),
      reports_email: normalizeBoolOption(options.reports_email),
      pos_enable_reordering: normalizeBoolOption(optionMap.pos_enable_reordering),
      customers_default: String(optionMap.customers_default || ""),
      customers_default_group: String(optionMap.customers_default_group || ""),
      pos_registers_default_change_payment_type: String(
        optionMap.pos_registers_default_change_payment_type ||
          optionMap.default_change_payment_type ||
          ""
      ),
      accounting_expenses_accounts: normalizeListOption(
        optionMap.accounting_expenses_accounts || optionMap.accounting_expense_accounts
      ),
      accounting_default_paid_expense_offset_account: String(
        optionMap.accounting_default_paid_expense_offset_account || ""
      ),
      accounting_orders_revenues_account: String(optionMap.accounting_orders_revenues_account || ""),
      accounting_orders_cash_account: String(optionMap.accounting_orders_cash_account || ""),
      accounting_orders_unpaid_account: String(optionMap.accounting_orders_unpaid_account || ""),
      accounting_orders_cogs_account: String(optionMap.accounting_orders_cogs_account || ""),
    }
    const rawAliasKeys = [
      "enable_cash_registers",
      "allow_decimal_quantities",
      "quick_product_enabled",
      "quick_product_default_unit",
      "show_quantity",
      "items_merge",
      "force_autofocus",
      "enable_pinned_products",
      "show_preview_pinned_products",
      "hide_exhausted_products",
      "hide_empty_categories",
      "allow_wholesale_price",
      "preferred_price",
      "unit_price_editable",
      "default_change_payment_type",
      "printing_document",
      "printing_enabled_for",
      "printing_gateway",
      "allow_partial_orders",
    ]
    rawAliasKeys.forEach((key) => {
      delete (normalized as OptionMap)[key]
    })
    return normalized
  }, [settings])
}
