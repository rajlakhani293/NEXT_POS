import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: number
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
  city_id?: number
  state?: string
  country_id?: number
  company_id?: number
  branch_id?: number
  branch_access?: number[]
  groups?: any[]
  permissions?: string[]
  user_permissions?: any[]
  role?: any
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
    allow_partial_orders: boolean
    enable_customer_rewards: boolean
    enable_credit_account: boolean
    enable_cash_registers: boolean
    allow_decimal_quantities: boolean
    quick_product_enabled: boolean
    show_quantity: boolean
    currency_precision: number
    hide_empty_categories: boolean
    unit_price_editable: boolean
    default_change_payment_type: string
    order_types: string[]
    store_language?: string
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
