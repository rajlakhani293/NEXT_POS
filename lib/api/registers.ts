import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import { getMutation, postMutation } from "@/lib/api/apiUtils"

const endpointsConfig = {
  getRegistersDropdown: { query: () => getMutation("dropdown-list") },
  getCurrentShift: { query: () => getMutation("shifts/current") },
  openShift: { query: postMutation("shifts/open") },
  closeShift: { query: postMutation("shifts/close") },
  getShiftsData: { query: postMutation("shifts/get-transactions") },
}

export const registers = createApi({
  reducerPath: "registers",
  baseQuery: createBaseQueryWithInterceptor("registers"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
