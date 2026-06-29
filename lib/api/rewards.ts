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
  getRewardSystemsDropdown: { query: () => getMutation("systems/dropdown-list") },
  getRewardSystemsData: { query: postMutation("systems/get-transactions") },
  createRewardSystem: { query: createMutation("systems/") },
  editRewardSystem: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`systems/${id}`, payLoad) },
  deleteRewardSystem: { query: deleteMutation("systems/delete") },
  updateRewardSystemStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("systems/status", payLoad) },
  getRewardSystemById: { query: ({ id }: { id: number }) => getMutation(`systems/${id}`) },
  getCustomerRewardBalance: { query: ({ id }: { id: number | string }) => getMutation(`customers/${id}/balance`) },
  getCustomerRewardById: { query: ({ customerId, rewardId }: { customerId: number | string; rewardId: number | string }) => getMutation(`customers/${customerId}/rewards/${rewardId}`) },
  editCustomerReward: { query: ({ customerId, rewardId, payLoad }: { customerId: number | string; rewardId: number | string; payLoad: any }) => putMutation(`customers/${customerId}/rewards/${rewardId}`, payLoad) },
  getCustomerRewardBalancesData: { query: postMutation("customers/balances/get-transactions") },
  getCustomerRewardRedemptionsData: { query: postMutation("customers/redemptions/get-transactions") },
  earnCustomerReward: { query: postMutation("customers/earn") },
  earnCustomerRewardFromSale: { query: postMutation("customers/earn-from-sale") },
  redeemCustomerReward: { query: postMutation("customers/redeem") },
}

export const rewards = createApi({
  reducerPath: "rewards",
  baseQuery: createBaseQueryWithInterceptor("rewards"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
