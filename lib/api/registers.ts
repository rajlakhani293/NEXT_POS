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
  getRegistersDropdown: { query: () => getMutation("dropdown-list") },
  getRegistersData: { query: postMutation("get-transactions") },
  createRegister: { query: createMutation("") },
  editRegister: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`${id}`, payLoad) },
  deleteRegister: { query: deleteMutation("delete") },
  updateRegisterStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("status", payLoad) },
  getRegisterById: { query: ({ id }: { id: number | string }) => getMutation(`${id}`) },
  getCurrentShift: { query: () => getMutation("shifts/current") },
  openShift: { query: postMutation("shifts/open") },
  closeShift: { query: postMutation("shifts/close") },
  getShiftsData: { query: postMutation("shifts/get-transactions") },
  getShiftById: {
    query: ({ id }: { id: number | string }) => getMutation(`shifts/${id}`),
  },
  getShiftEntriesData: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      postMutation(`shifts/${id}/entries/get-transactions`)(payLoad),
  },
  getShiftZReport: {
    query: ({ id }: { id: number | string }) => getMutation(`shifts/${id}/z-report`),
  },
  refreshShift: {
    query: ({ id }: { id: number | string }) => getMutation(`shifts/${id}/refresh`),
  },
  cashIn: { query: postMutation("shifts/cash-in") },
  cashOut: { query: postMutation("shifts/cash-out") },
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
