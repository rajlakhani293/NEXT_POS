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
  getSuppliersDropdown: { query: () => getMutation("suppliers/dropdown-list") },
  getSuppliersData: { query: postMutation("suppliers/get-transactions") },
  createSupplier: { query: createMutation("suppliers/") },
  editSupplier: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`suppliers/${id}`, payLoad) },
  deleteSupplier: { query: deleteMutation("suppliers/delete") },
  updateSupplierStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("suppliers/status", payLoad) },
  getSupplierById: { query: ({ id }: { id: number }) => getMutation(`suppliers/${id}`) },

  getPurchaseOrdersData: { query: postMutation("orders/get-transactions") },
  getProcurementProductsData: { query: postMutation("products/get-transactions") },
  createPurchaseOrder: { query: createMutation("orders/") },
  editPurchaseOrder: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`orders/${id}`, payLoad) },
  deletePurchaseOrder: { query: deleteMutation("orders/delete") },
  getPurchaseOrderById: { query: ({ id }: { id: number }) => getMutation(`orders/${id}`) },
  receivePurchaseOrder: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`orders/${id}/receive`)(payLoad) },
  payPurchaseOrder: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`orders/${id}/pay`)(payLoad) },
}

export const purchases = createApi({
  reducerPath: "purchases",
  baseQuery: createBaseQueryWithInterceptor("purchases"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
