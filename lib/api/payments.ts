import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import { getMutation } from "@/lib/api/apiUtils"

const endpointsConfig = {
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
