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
  getAccountsDropdown: {
    type: "query",
    query: () => getMutation("accounts/dropdown-list"),
  },
  resetDefaultTransactionAccounts: {
    query: () => getMutation("accounts/reset-defaults"),
  },
  getTransactionAccountsFromCategory: {
    query: ({ payLoad }: { payLoad: any }) =>
      postMutation("../transactions-accounts/category-identifier")(payLoad),
  },
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

  createManualTransaction: { query: createMutation("/transactions/") },
  editTransaction: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      putMutation(`/transactions/${id}`, payLoad),
  },
  getTransactionById: {
    query: ({ id }: { id: number | string }) => getMutation(`/transactions/${id}`),
  },
  deleteTransaction: {
    query: ({ ids }: { ids: Array<number | string> }) => ({
      url: `/transactions/${ids[0]}`,
      method: "DELETE",
    }),
  },
  getTransactionsData: { query: postMutation("transactions/get-transactions") },
  getTransactionHistoryData: { query: postMutation("history/get-transactions") },
  deleteTransactionHistory: {
    query: ({ ids }: { ids: Array<number | string> }) => ({
      url: `history/${ids[0]}`,
      method: "DELETE",
    }),
  },
  triggerTransaction: {
    query: ({ id }: { id: number | string }) =>
      getMutation(`/transactions/trigger/${id}`),
  },
  bootstrapAccounting: { query: () => postMutation("bootstrap")({}) },
  getAccountingActions: {
    type: "query",
    query: () => getMutation("rules/actions"),
  },
  getAccountingRules: {
    type: "query",
    query: () => getMutation("rules"),
  },
  createAccountingRule: { query: createMutation("rules/") },
  editAccountingRule: {
    query: ({ id, payLoad }: { id: number; payLoad: any }) =>
      putMutation(`rules/${id}`, payLoad),
  },
  deleteAccountingRule: { query: deleteMutation("rules/delete") },
  getAccountingSettings: {
    type: "query",
    query: () => getMutation("settings"),
  },
  updateAccountingSettings: {
    query: ({ payLoad }: { payLoad: any }) =>
      putMutation("settings", payLoad),
  },
}

export const accounting = createApi({
  reducerPath: "accounting",
  baseQuery: createBaseQueryWithInterceptor("accounting"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] =
        (config as any).type === "query"
          ? builder.query(config as any)
          : builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
