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
  getCustomersDropdown: { query: () => getMutation("dropdown-list") },
  getCustomerGroupsDropdown: { query: () => getMutation("groups/dropdown-list") },
  getCustomersData: { query: postMutation("get-transactions") },
  createCustomer: { query: createMutation("") },
  editCustomer: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`${id}`, payLoad) },
  deleteCustomer: { query: deleteMutation("delete") },
  updateCustomerStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("status", payLoad) },
  getCustomerById: { query: ({ id }: { id: number }) => getMutation(`${id}`) },
  searchCustomers: { query: postMutation("search") },
  getRecentlyActiveCustomers: { query: ({ limit = 10 }: { limit?: number } = {}) => getMutation("recently-active", { limit }) },
  getCustomerAddresses: { query: ({ id }: { id: any }) => getMutation(`${id}/addresses`) },
  getCustomerGroup: { query: ({ id }: { id: any }) => getMutation(`${id}/group`) },
  getCustomerCoupons: { query: ({ id }: { id: any }) => getMutation(`${id}/coupons`) },
  loadCustomerCouponForPos: {
    query: ({ code, payLoad }: { code: string; payLoad: any }) =>
      postMutation(`coupons/${encodeURIComponent(code)}`)(payLoad),
  },
  getCustomerRewards: { query: ({ id }: { id: any }) => getMutation(`${id}/rewards`) },
  adjustCustomerCredit: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`${id}/credit-adjustment`)(payLoad) },
  getCustomerCreditLedger: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`${id}/credit-ledger`)(payLoad) },
  getCustomerAccountHistory: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`${id}/account-history/get-transactions`)(payLoad) },
  recordCustomerAccountHistory: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`${id}/crud/account-history`)(payLoad) },
  getCustomerOrderHistory: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`${id}/orders`)(payLoad) },


  // Customer Groups
  getCustomerGroupsData: { query: postMutation("groups/get-transactions") },
  createCustomerGroup: { query: createMutation("groups/") },
  editCustomerGroup: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`groups/${id}`, payLoad) },
  deleteCustomerGroup: { query: deleteMutation("groups/delete") },
  updateCustomerGroupStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("groups/status", payLoad) },
  getCustomerGroupById: { query: ({ id }: { id: number }) => getMutation(`groups/${id}`) },
  getCustomerGroupCustomers: { query: ({ id }: { id: number }) => getMutation(`groups/${id}/customers`) },
  transferCustomerGroupCustomers: { query: postMutation("groups/transfer-customers") },
}

export const customers = createApi({
  reducerPath: "customers",
  baseQuery: createBaseQueryWithInterceptor("customers"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
