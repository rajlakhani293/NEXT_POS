import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import { createMutation, getMutation, postMutation } from "@/lib/api/apiUtils"

const endpointsConfig = {
  getSalesData: { query: postMutation("get-transactions") },
  createSale: { query: createMutation("") },
  getSaleById: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}`),
  },
  getSaleReceipt: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}/receipt`),
  },
  createSaleReturn: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/refund`)(payLoad),
  },
  getSaleRefunds: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}/refunds`),
  },
  getSaleRefundedItems: {
    query: ({ id }: { id: number | string }) =>
      getMutation(`${id}/products/refunded`),
  },
}

export const sales = createApi({
  reducerPath: "sales",
  baseQuery: createBaseQueryWithInterceptor("sales"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
