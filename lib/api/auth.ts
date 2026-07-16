import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"

export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  meta: unknown
}

export type AuthUser = {
  id: number
  username: string
  full_name: string
  email?: string | null
  phone?: string | null
  theme?: string
  language?: string
  company_id?: number | null
  branch_id?: number | null
  profile_image?: string | null
  avatar_link?: string | null
  permissions?: string[]
  addresses?: Record<string, any>
  role?: unknown
  is_superuser?: boolean
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export type AccessTokenRecord = {
  id: number
  name?: string | null
  token?: string | null
  created_at?: string | null
  last_used_at?: string | null
  expires_at?: string | null
  expired?: boolean
  current?: boolean
}

const endpointsConfig = {
  login: {
    query: (payLoad: any) => ({
      url: "auth/sign-in",
      method: "POST",
      body: payLoad,
    }),
  },
  register: {
    query: (payLoad: any) => ({
      url: "auth/sign-up",
      method: "POST",
      body: payLoad,
    }),
  },
  getSessionData: {
    query: () => ({
      url: "accounts/session-data",
      method: "GET",
    }),
  },
  logout: {
    query: () => ({
      url: "accounts/logout",
      method: "POST",
    }),
  },
  switchBranch: {
    query: (payLoad: { branch_id: number }) => ({
      url: "accounts/switch-branch",
      method: "POST",
      body: payLoad,
    }),
  },
  passwordLost: {
    query: (payLoad: { email: string }) => ({
      url: "auth/password-lost",
      method: "POST",
      body: payLoad,
    }),
  },
  newPassword: {
    query: (payLoad: { user_id: string | number; token: string; password: string; password_confirm: string }) => ({
      url: `auth/new-password/${payLoad.user_id}/${payLoad.token}`,
      method: "POST",
      body: {
        password: payLoad.password,
        password_confirm: payLoad.password_confirm,
      },
    }),
  },
  activateAccount: {
    query: (payLoad: { user_id: string | number; token: string }) => ({
      url: `auth/activate/${payLoad.user_id}/${payLoad.token}`,
      method: "GET",
    }),
  },
  updateProfile: {
    query: (payLoad: any) => ({
      url: "users/profile",
      method: "POST",
      body: payLoad,
    }),
  },
  getTokens: {
    query: () => ({
      url: "users/tokens",
      method: "GET",
    }),
  },
  createToken: {
    query: (payLoad: { name: string }) => ({
      url: "users/create-token",
      method: "POST",
      body: payLoad,
    }),
  },
  deleteToken: {
    query: (tokenId: number) => ({
      url: `users/tokens/${tokenId}`,
      method: "DELETE",
    }),
  },
}

export const auth = createApi({
  reducerPath: "auth",
  baseQuery: createBaseQueryWithInterceptor(""),
  endpoints: (builder) => ({
    login: builder.mutation<ApiEnvelope<LoginResponse>, any>(
      endpointsConfig.login
    ),
    register: builder.mutation<ApiEnvelope<LoginResponse>, any>(
      endpointsConfig.register
    ),
    getSessionData: builder.query<ApiEnvelope<any>, void>(
      endpointsConfig.getSessionData
    ),
    logout: builder.mutation<ApiEnvelope<any>, void>(endpointsConfig.logout),
    switchBranch: builder.mutation<ApiEnvelope<any>, { branch_id: number }>(
      endpointsConfig.switchBranch
    ),
    passwordLost: builder.mutation<ApiEnvelope<any>, { email: string }>(
      endpointsConfig.passwordLost
    ),
    newPassword: builder.mutation<
      ApiEnvelope<any>,
      { user_id: string | number; token: string; password: string; password_confirm: string }
    >(endpointsConfig.newPassword),
    activateAccount: builder.query<
      ApiEnvelope<any>,
      { user_id: string | number; token: string }
    >(endpointsConfig.activateAccount),
    updateProfile: builder.mutation<ApiEnvelope<AuthUser>, any>(
      endpointsConfig.updateProfile
    ),
    getTokens: builder.query<ApiEnvelope<AccessTokenRecord[]>, void>(
      endpointsConfig.getTokens
    ),
    createToken: builder.mutation<ApiEnvelope<any>, { name: string }>(
      endpointsConfig.createToken
    ),
    deleteToken: builder.mutation<ApiEnvelope<any>, number>(
      endpointsConfig.deleteToken
    ),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetSessionDataQuery,
  useLazyGetSessionDataQuery,
  useLogoutMutation,
  useSwitchBranchMutation,
  usePasswordLostMutation,
  useNewPasswordMutation,
  useActivateAccountQuery,
  useUpdateProfileMutation,
  useGetTokensQuery,
  useCreateTokenMutation,
  useDeleteTokenMutation,
} = auth
