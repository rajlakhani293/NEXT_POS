import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import {
  createMutation,
  deleteMutation,
  getMutation,
  patchMutation,
  postMutation,
  putMutation,
} from "@/lib/api/apiUtils"

const endpointsConfig = {
  getAccountsDropdown: { query: () => getMutation("accounts/dropdown-list") },
  getAccountsData: { query: postMutation("accounts/get-transactions") },
  createAccount: { query: createMutation("accounts/") },
  editAccount: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      putMutation(`accounts/${id}`, payLoad),
  },
  deleteAccount: { query: deleteMutation("accounts/delete") },
  updateAccountStatus: {
    query: ({ payLoad }: { payLoad: any }) =>
      patchMutation("accounts/status", payLoad),
  },
  getAccountById: {
    query: ({ id }: { id: number }) => getMutation(`accounts/${id}`),
  },

  createManualTransaction: { query: createMutation("transactions/") },
  getTransactionsData: { query: postMutation("transactions/get-transactions") },
  getTransactionHistoryData: { query: postMutation("history/get-transactions") },
  bootstrapAccounting: { query: () => postMutation("bootstrap")({}) },
}

export const accounting = createApi({
  reducerPath: "accounting",
  baseQuery: createBaseQueryWithInterceptor("accounting"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
