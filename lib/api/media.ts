import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import { putMutation } from "@/lib/api/apiUtils"

const endpointsConfig = {
  uploadMedia: { query: createMediaUploadMutation("") },
  getMediaData: { query: createMediaListMutation },
  editMedia: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      putMutation(`${id}`, payLoad),
  },
  deleteMedia: {
    query: (payLoad: { ids: Array<number | string> }) => ({
      url: "bulk-delete",
      method: "POST",
      body: payLoad,
    }),
  },
}

function createMediaUploadMutation(url: string) {
  return (payLoad: FormData) => ({
    url,
    method: "POST",
    body: payLoad,
  })
}

function createMediaListMutation(payLoad: Record<string, any> = {}) {
  const params = new URLSearchParams()
  params.set("page", String(payLoad.page || 1))
  params.set("per_page", String(payLoad.limit || payLoad.per_page || 20))
  if (payLoad.search) params.set("search", String(payLoad.search))
  if (payLoad.user_id) params.set("user_id", String(payLoad.user_id))
  return {
    url: `?${params.toString()}`,
    method: "GET",
  }
}

export const media = createApi({
  reducerPath: "media",
  baseQuery: createBaseQueryWithInterceptor("medias"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
