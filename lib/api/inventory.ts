import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import {
  createMutation,
  deleteMutation,
  getMutation,
  patchMutation,
  postMutation,
} from "@/lib/api/apiUtils"

const endpointsConfig = {
  getStockAdjustmentsData: { query: postMutation("adjustments/get-transactions") },
  createStockAdjustment: { query: createMutation("adjustments/") },
  deleteStockAdjustment: { query: deleteMutation("adjustments/delete") },
  updateStockAdjustmentStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("adjustments/status", payLoad) },
  getStockAdjustmentById: { query: ({ id }: { id: number }) => getMutation(`adjustments/${id}`) },
  getStockLedgerData: { query: postMutation("ledger/get-transactions") },
}

export const inventory = createApi({
  reducerPath: "inventory",
  baseQuery: createBaseQueryWithInterceptor("inventory"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
