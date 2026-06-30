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
  getProvidersData: { query: postMutation("../providers/get-transactions") },
  createProvider: { query: createMutation("../providers/") },
  editProvider: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`../providers/${id}`, payLoad) },
  deleteProvider: {
    query: ({ id, ids }: { id?: any; ids?: any[] }) =>
      deleteMutation(`../providers/${id || ids?.[0]}`)({}),
  },
  updateProviderStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("../providers/status", payLoad) },
  getProviderById: { query: ({ id }: { id: number | string }) => getMutation(`../providers/${id}`) },
  getProviderProcurements: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      postMutation(`../providers/${id}/procurements/get-transactions`)(payLoad),
  },
  getProviderProducts: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      postMutation(`../providers/${id}/products/get-transactions`)(payLoad),
  },

  getPurchaseOrdersData: { query: postMutation("orders/get-transactions") },
  getProcurementProductsData: { query: postMutation("products/get-transactions") },
  createPurchaseOrder: { query: createMutation("orders/") },
  editPurchaseOrder: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`orders/${id}`, payLoad) },
  deletePurchaseOrder: { query: deleteMutation("orders/delete") },
  getPurchaseOrderById: { query: ({ id }: { id: number }) => getMutation(`orders/${id}`) },
  getPurchaseOrderProducts: { query: ({ id }: { id: number | string }) => getMutation(`orders/${id}/products`) },
  refreshPurchaseOrder: { query: ({ id }: { id: number | string }) => getMutation(`orders/${id}/refresh`) },
  changePurchasePaymentStatus: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      putMutation(`orders/${id}/change-payment-status`, payLoad),
  },
  addPurchaseOrderProduct: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      createMutation(`orders/${id}/products`)(payLoad),
  },
  editPurchaseOrderProduct: {
    query: ({ id, productId, payLoad }: { id: any; productId: any; payLoad: any }) =>
      putMutation(`orders/${id}/products/${productId}`, payLoad),
  },
  bulkUpdatePurchaseOrderProducts: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      putMutation(`orders/${id}/products`, payLoad),
  },
  deletePurchaseOrderProduct: {
    query: ({ id, productId }: { id: any; productId: any }) =>
      deleteMutation(`orders/${id}/products/${productId}`)({}),
  },
  receivePurchaseOrder: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`orders/${id}/receive`)(payLoad) },
  payPurchaseOrder: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`orders/${id}/pay`)(payLoad) },
  setPurchaseOrderAsPaid: { query: ({ id }: { id: any }) => getMutation(`orders/${id}/set-as-paid`) },
  getPurchasePreload: { query: ({ key }: { key: string }) => getMutation(`preload/${key}`) },
  storePurchasePreload: { query: postMutation("preload") },
  getLowStockSuggestions: { query: () => getMutation("low-stock-suggestions") },
  searchProductForProcurement: { query: postMutation("products/search-product") },
  searchProcurementProduct: { query: postMutation("products/search-procurement-product") },
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
