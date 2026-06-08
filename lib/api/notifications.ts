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
  getNotificationsData: { query: postMutation("get-transactions") },
  createNotification: { query: createMutation("") },
  getUnreadCount: { query: () => getMutation("unread-count") },
  markNotificationsRead: {
    query: ({ payLoad }: { payLoad: any }) => patchMutation("mark-read", payLoad),
  },
  deleteNotification: { query: deleteMutation("delete") },
}

export const notifications = createApi({
  reducerPath: "notifications",
  baseQuery: createBaseQueryWithInterceptor("notifications"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
