import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import { deleteMutation, postMutation, putMutation } from "@/lib/api/apiUtils"

const endpointsConfig = {
  uploadMedia: { query: createMediaUploadMutation("upload") },
  getMediaData: { query: postMutation("get-transactions") },
  editMedia: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      putMutation(`${id}`, payLoad),
  },
  deleteMedia: { query: deleteMutation("delete") },
}

function createMediaUploadMutation(url: string) {
  return (payLoad: FormData) => ({
    url,
    method: "POST",
    body: payLoad,
  })
}

export const media = createApi({
  reducerPath: "media",
  baseQuery: createBaseQueryWithInterceptor("media"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
