import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: number
  username?: string
  full_name?: string
  email?: string
  phone?: string
  is_superuser?: boolean
  is_staff?: boolean
  is_active?: boolean
  is_verified?: boolean
  last_login?: string
  address?: string
  pincode?: string
  profile_image?: string
  avatar_link?: string
  theme?: string
  language?: string
  city_id?: number
  state?: string
  country_id?: number
  company_id?: number
  branch_id?: number
  branch_access?: number[]
  addresses?: Record<string, any>
  groups?: any[]
  roles?: any[]
  permissions?: string[]
  user_permissions?: any[]
  role?: any
  status?: number
}

interface Company {
  id: number
  name: string
  code: string
  logo?: string
  logo_image?: string
  website_url?: string
  business_type_id?: number
  tax_no?: string
  pan_no?: string
  address?: string
  pincode?: string
  phone?: string
  email?: string
  city_id?: number
  state?: string
  country_id?: number
  owner_id?: number
}

interface Branch {
  id: number
  name: string
  code?: string
  contact_person_name?: string
  phone?: string
  email?: string
  address?: string
  pincode?: string
  city_id?: number
  state?: string
  country_id?: number
  company_id?: number
  status?: number
}

interface BranchListItem {
  id: number
  name: string
  code?: string
  city?: string
  phone?: string
  is_head_office?: boolean
  city__name?: string
  state?: string
}

interface BusinessSettings {
  settings: {
    enable_customer_rewards: boolean
    enable_credit_account: boolean
    pos_quick_product?: boolean | string
    pos_quick_product_default_unit?: string
    cart_discount?: boolean
    products_discount?: boolean
    edit_settings?: boolean
    pos_items_merge?: boolean
    pos_show_quantity?: boolean | string
    pos_allow_decimal_quantities?: boolean | string
    pos_hide_empty_categories?: boolean | string
    pos_hide_exhausted_products?: boolean | string
    pos_allow_wholesale_price?: boolean | string
    pos_force_autofocus?: boolean | string
    pos_enable_pinned_products?: boolean | string
    pos_show_preview_pinned_products?: boolean | string
    pos_registers_enabled?: boolean | string
    pos_layout?: string
    pos_sound_enabled?: boolean | string
    pos_numpad?: string
    pos_idle_counter?: string
    pos_disbursement?: boolean
    pos_action_permission_enabled?: boolean
    pos_action_permission_duration?: string
    pos_action_permission_restricted_features?: string[]
    pos_action_permission_cooldown_features?: string
    pos_keyboard_cancel_order?: string[]
    pos_keyboard_hold_order?: string[]
    pos_keyboard_create_customer?: string[]
    pos_keyboard_payment?: string[]
    pos_keyboard_shipping?: string[]
    pos_keyboard_note?: string[]
    pos_keyboard_order_type?: string[]
    pos_keyboard_fullscreen?: string[]
    pos_keyboard_quick_search?: string[]
    pos_keyboard_toggle_merge?: string[]
    pos_amount_shortcut?: string
    pos_complete_sale_audio?: string
    pos_new_item_audio?: string
    pos_order_sms?: boolean | string
    pos_preferred_price?: string
    currency_symbol?: string
    currency_iso?: string
    currency_position?: string
    currency_preferred?: string
    currency_thousand_separator?: string
    currency_decimal_separator?: string
    currency_precision: number
    pos_unit_price_editable?: boolean | string
    pos_registers_default_change_payment_type?: string
    order_types: string[]
    customers_default?: string | number
    customers_default_group?: string | number
    store_language?: string
    registration_enabled?: boolean | string
    registration_role?: string
    registration_validated?: boolean | string
    recovery_enabled?: boolean | string
    date_format?: string
    datetime_format?: string
    datetime_timezone?: string
    scale_barcode_enabled?: boolean
    scale_barcode_prefix?: string
    scale_barcode_product_length?: number
    scale_barcode_value_length?: number
    scale_barcode_type?: string
    orders_code_type?: string
    orders_allow_unpaid?: boolean
    orders_allow_partial: boolean
    orders_strict_instalments?: boolean
    orders_quotation_expiration?: string
    pos_printing_document?: string
    pos_printing_enabled_for?: string
    pos_printing_gateway?: string
    invoice_receipt_template?: string
    invoice_receipt_logo?: string
    invoice_merge_similar_products?: boolean | string
    invoice_display_tax_breakdown?: boolean | string
    invoice_receipt_footer?: string
    invoice_receipt_column_a?: string
    invoice_receipt_column_b?: string
    pos_tax_group?: string
    pos_tax_type?: string
    pos_vat?: string
    reports_email?: boolean
    pos_enable_reordering?: boolean | string
    accounting_expenses_accounts?: string[] | number[]
    accounting_default_paid_expense_offset_account?: string | number
    accounting_orders_revenues_account?: string | number
    accounting_orders_cash_account?: string | number
    accounting_orders_unpaid_account?: string | number
    accounting_orders_cogs_account?: string | number
  }
  order_types: {
    value: string
    label: string
    enabled: boolean
  }[]
}

interface SessionState {
  isUnauthorized: boolean
  permissionError: {
    isError: boolean
    message: string
  } | null
  sessionUpdateMessage: string | null
  serverError: {
    isError: boolean
    message: string
    code?: number
  } | null
  user: User | null
  company: Company | null
  branch: Branch | null
  branchList: BranchListItem[]
  businessSettings: BusinessSettings | null
  isSessionLoaded: boolean
}

const initialState: SessionState = {
  isUnauthorized: false,
  permissionError: null,
  sessionUpdateMessage: null,
  serverError: null,
  user: null,
  company: null,
  branch: null,
  branchList: [],
  businessSettings: null,
  isSessionLoaded: false,
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setUnauthorized: (state, action: PayloadAction<boolean>) => {
      state.isUnauthorized = action.payload
    },
    setPermissionError: (
      state,
      action: PayloadAction<SessionState["permissionError"]>
    ) => {
      state.permissionError = action.payload
    },
    setSessionUpdate: (state, action: PayloadAction<string | null>) => {
      state.sessionUpdateMessage = action.payload
    },
    setServerError: (
      state,
      action: PayloadAction<{
        isError: boolean
        message: string
        code?: number
      } | null>
    ) => {
      state.serverError = action.payload
    },
    setSessionData: (state, action: PayloadAction<any>) => {
      const data = action.payload
      const sessionData = data.data || data
      if (sessionData.user) state.user = sessionData.user
      if (sessionData.company) state.company = sessionData.company
      if (sessionData.branch) state.branch = sessionData.branch
      if (sessionData.branch_list) state.branchList = sessionData.branch_list
      if (sessionData.business_settings)
        state.businessSettings = sessionData.business_settings
      state.isSessionLoaded = true
    },
    clearSessionData: (state) => {
      state.user = null
      state.company = null
      state.branch = null
      state.branchList = []
      state.businessSettings = null
      state.isSessionLoaded = false
      state.isUnauthorized = false
      state.permissionError = null
      state.sessionUpdateMessage = null
      state.serverError = null
    },
  },
})

export const {
  setUnauthorized,
  setPermissionError,
  setSessionUpdate,
  setServerError,
  setSessionData,
  clearSessionData,
} = sessionSlice.actions

export default sessionSlice.reducer
