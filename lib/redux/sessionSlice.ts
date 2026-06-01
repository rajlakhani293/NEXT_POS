import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  last_login?: string;
  address?: string;
  pincode?: string;
  profile_image?: string;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  company_id?: number;
  branch_id?: number;
  branch_access?: number[];
  groups?: any[];
  permissions?: string[];
  user_permissions?: any[];
  role?: any;
}

interface Company {
  id: number;
  name: string;
  code: string;
  logo_image?: string;
  website_url?: string;
  business_type_id?: number;
  tax_no?: string;
  pan_no?: string;
  address?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  owner_id?: number;
}

interface Branch {
  id: number;
  name: string;
  contact_person_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  pincode?: string;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  company_id?: number;
  status?: number;
}

interface BranchListItem {
  id: number;
  name: string;
  city__name?: string;
  state__name?: string;
}

interface SessionState {
  isUnauthorized: boolean;
  permissionError: {
    isError: boolean;
    message: string;
  } | null;
  sessionUpdateMessage: string | null;
  serverError: {
    isError: boolean;
    message: string;
    code?: number;
  } | null;
  user: User | null;
  company: Company | null;
  branch: Branch | null;
  branchList: BranchListItem[];
  isSessionLoaded: boolean;
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
  isSessionLoaded: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setUnauthorized: (state, action: PayloadAction<boolean>) => {
      state.isUnauthorized = action.payload;
    },
    setPermissionError: (state, action: PayloadAction<SessionState['permissionError']>) => { 
      state.permissionError = action.payload; 
    },
    setSessionUpdate: (state, action: PayloadAction<string | null>) => {
      state.sessionUpdateMessage = action.payload;
    },
    setServerError: (state, action: PayloadAction<{ isError: boolean; message: string; code?: number } | null>) => {
      state.serverError = action.payload;
    },
    setSessionData: (state, action: PayloadAction<any>) => {
      const data = action.payload;
      const sessionData = data.data || data;
      if (sessionData.user) state.user = sessionData.user;
      if (sessionData.company) state.company = sessionData.company;
      if (sessionData.branch) state.branch = sessionData.branch;
      if (sessionData.branch_list) state.branchList = sessionData.branch_list;
      state.isSessionLoaded = true;
    },
    clearSessionData: (state) => {
      state.user = null;
      state.company = null;
      state.branch = null;
      state.branchList = [];
      state.isSessionLoaded = false;
      state.isUnauthorized = false;
      state.permissionError = null;
      state.sessionUpdateMessage = null;
      state.serverError = null;
    },
  },
});

export const { 
  setUnauthorized, 
  setPermissionError,
  setSessionUpdate,
  setServerError,
  setSessionData,
  clearSessionData
} = sessionSlice.actions;

export default sessionSlice.reducer;
