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
  getPaymentTypesData: { query: postMutation("types/get-transactions") },
  createPaymentType: { query: createMutation("types/") },
  editPaymentType: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`types/${id}`, payLoad) },
  deletePaymentType: { query: deleteMutation("types/") },
  updatePaymentTypeStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("types/status", payLoad) },
  getPaymentTypeById: { query: ({ id }: { id: number }) => getMutation(`types/${id}`) },
  getPaymentTypesDropdown: { query: () => getMutation("types/dropdown-list") },
}

export const payments = createApi({
  reducerPath: "payments",
  baseQuery: createBaseQueryWithInterceptor("payments"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
