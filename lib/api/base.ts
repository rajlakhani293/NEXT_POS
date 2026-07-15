import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"
import {
  setUnauthorized,
  setServerError,
  setPermissionError,
} from "../redux/sessionSlice"
import { prepareHeadersWithToken } from "./apiUtils"
import { showToast } from "../toast"

interface BackendError {
  success: boolean
  message?: string
  data?: any
}

const firstValidationMessage = (errors: unknown): string | null => {
  if (!errors) return null

  if (Array.isArray(errors)) {
    const value = errors.find((item) => typeof item === "string")
    return value || null
  }

  if (typeof errors === "object") {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        const message = value.find((item) => typeof item === "string")
        if (message) return message
      }

      if (typeof value === "string") return value
    }
  }

  return null
}

const getBackendErrorMessage = (data?: BackendError): string | undefined => {
  return firstValidationMessage(data?.data?.errors) || data?.message
}

const actualBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: prepareHeadersWithToken,
})

const TOAST_THROTTLE_MS = 2500
const recentErrorToasts = new Map<string, number>()

const showErrorToastOnce = (key: string, message?: string) => {
  if (!message) return
  const now = Date.now()
  const lastShownAt = recentErrorToasts.get(key) || 0
  if (now - lastShownAt < TOAST_THROTTLE_MS) return
  recentErrorToasts.set(key, now)
  showToast.error(message)
}

export const createBaseQueryWithInterceptor = (
  reducerPath: string
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  return async (args, api, extraOptions) => {
    let modifiedArgs = args

    if (typeof args === "string") {
      modifiedArgs = args.startsWith("/") ? args.slice(1) : `${reducerPath}/${args}`
    } else if (args && typeof args === "object" && "url" in args) {
      const url = String(args.url)
      modifiedArgs = {
        ...args,
        url: url.startsWith("/") ? url.slice(1) : `${reducerPath}/${url}`,
      }
    }

    const result = await actualBaseQuery(modifiedArgs, api, extraOptions)

    const data = (result.data || result.error?.data) as BackendError
    const isSuccessInBody = data?.success !== false

    if (result.error || !isSuccessInBody) {
      const errorData = result.error || { status: 400, data }
      const status =
        typeof errorData.status === "number" ? errorData.status : 400
      const message = getBackendErrorMessage(data)
      const url =
        typeof modifiedArgs === "string"
          ? modifiedArgs
          : modifiedArgs && typeof modifiedArgs === "object" && "url" in modifiedArgs
            ? String(modifiedArgs.url)
            : ""
      const isSessionCheck = url.includes("accounts/session-data")

      const toastKey = `${status}:${message || ""}`

      if (status === 401) {
        api.dispatch(setUnauthorized(true))
        if (!isSessionCheck) {
          showErrorToastOnce(toastKey, message)
        }
      } else if (status === 403) {
        api.dispatch(
          setPermissionError({
            isError: true,
            message:
              message || "You do not have permission to perform this action.",
          })
        )
        showErrorToastOnce(toastKey, message)
      } else if (message) {
        showErrorToastOnce(toastKey, message)
      }

      if (status >= 500) {
        api.dispatch(
          setServerError({
            isError: true,
            code: status,
            message: message || "Something went wrong on the server.",
          })
        )
      }

      if (!isSuccessInBody && !result.error) {
        return { error: errorData as FetchBaseQueryError }
      }
    }

    return result
  }
}
