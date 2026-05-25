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
  full_name: string
  email?: string | null
  phone?: string | null
  company_id?: number | null
  branch_id?: number | null
  auth_provider?: string | null
  onboarding_completed?: boolean
  profile_image?: string | null
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export type SendOtpResponse = {
  phone: string
  purpose: string
  expires_at: string
  otp_code: string
  message: string
}

const endpointsConfig = {
  sendOtp: {
    query: (payLoad: any) => ({
      url: "accounts/send-otp",
      method: "POST",
      body: payLoad,
    }),
  },
  verifyOtp: {
    query: (payLoad: any) => ({
      url: "accounts/verify-otp",
      method: "POST",
      body: payLoad,
    }),
  },
  googleLogin: {
    query: (payLoad: any) => ({
      url: "accounts/google-login",
      method: "POST",
      body: payLoad,
    }),
  },
  getSessionData: {
    query: () => ({
      url: "accounts/me",
      method: "GET",
    }),
  },
}

export const auth = createApi({
  reducerPath: "auth",
  baseQuery: createBaseQueryWithInterceptor(""),
  endpoints: (builder) => ({
    sendOtp: builder.mutation<ApiEnvelope<SendOtpResponse>, any>(
      endpointsConfig.sendOtp,
    ),
    verifyOtp: builder.mutation<ApiEnvelope<LoginResponse>, any>(
      endpointsConfig.verifyOtp,
    ),
    googleLogin: builder.mutation<ApiEnvelope<LoginResponse>, any>(
      endpointsConfig.googleLogin,
    ),
    getSessionData: builder.mutation<ApiEnvelope<AuthUser>, void>(
      endpointsConfig.getSessionData,
    ),
  }),
})

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGoogleLoginMutation,
  useGetSessionDataMutation,
} = auth
