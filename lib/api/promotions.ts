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
  getCouponsDropdown: { query: () => getMutation("coupons/dropdown-list") },
  getCouponsData: { query: postMutation("coupons/get-transactions") },
  createCoupon: { query: createMutation("coupons/") },
  editCoupon: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`coupons/${id}`, payLoad) },
  deleteCoupon: { query: deleteMutation("coupons/delete") },
  updateCouponStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("coupons/status", payLoad) },
  getCouponById: { query: ({ id }: { id: number }) => getMutation(`coupons/${id}`) },
}

export const promotions = createApi({
  reducerPath: "promotions",
  baseQuery: createBaseQueryWithInterceptor("promotions"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
