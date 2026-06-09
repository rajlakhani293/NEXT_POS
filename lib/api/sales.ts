import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import {
  createMutation,
  deleteMutation,
  getMutation,
  postMutation,
} from "@/lib/api/apiUtils"

const endpointsConfig = {
  getSalesData: { query: postMutation("get-transactions") },
  createSale: { query: createMutation("") },
  holdSale: { query: createMutation("hold") },
  getHeldSalesData: { query: postMutation("drafts/get-transactions") },
  getHeldSaleById: {
    query: ({ id }: { id: number | string }) => getMutation(`drafts/${id}`),
  },
  deleteHeldSale: {
    query: ({ id }: { id: number | string }) => deleteMutation(`drafts/${id}`)({}),
  },
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
  collectSaleDue: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/collect-due`)(payLoad),
  },
  voidSale: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/void`)(payLoad),
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
