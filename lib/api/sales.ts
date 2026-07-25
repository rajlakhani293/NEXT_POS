import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import {
  createMutation,
  deleteMutation,
  getMutation,
  postMutation,
  putMutation,
} from "@/lib/api/apiUtils"

const endpointsConfig = {
  getSalesData: { query: postMutation("get-transactions") },
  getInstallmentsData: { query: postMutation("instalments/get-transactions") },
  createSale: { query: createMutation("") },
  editSale: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      putMutation(`${id}`, payLoad),
  },
  holdSale: { query: createMutation("hold") },
  getHeldSalesData: { query: postMutation("drafts/get-transactions") },
  getHeldSaleById: {
    query: ({ id }: { id: number | string }) => getMutation(`drafts/${id}`),
  },
  deleteHeldSale: {
    query: ({ id }: { id: number | string }) => deleteMutation(`drafts/${id}`)({}),
  },
  getSaleById: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}`),
  },
  deleteSales: {
    query: deleteMutation("delete"),
  },
  getSaleReceipt: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}/receipt`),
  },
  getSaleInvoice: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}/invoice`),
  },
  getSaleRefundReceipt: {
    query: ({ id }: { id: number | string }) => getMutation(`refunds/${id}/receipt`),
  },
  updateSaleProcessing: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/processing`)(payLoad),
  },
  updateSaleDelivery: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/delivery`)(payLoad),
  },
  getSaleInstallments: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}/instalments`),
  },
  createSaleInstallments: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/instalments`)(payLoad),
  },
  updateSaleInstallment: {
    query: ({
      id,
      installmentId,
      payLoad,
    }: {
      id: number | string
      installmentId: number | string
      payLoad: any
    }) => ({
      url: `${id}/instalments/${installmentId}`,
      method: "PUT",
      body: payLoad,
    }),
  },
  deleteSaleInstallment: {
    query: ({
      id,
      installmentId,
    }: {
      id: number | string
      installmentId: number | string
    }) => deleteMutation(`${id}/instalments/${installmentId}`)({}),
  },
  paySaleInstallment: {
    query: ({
      id,
      installmentId,
      payLoad,
    }: {
      id: number | string
      installmentId: number | string
      payLoad: any
    }) => createMutation(`${id}/instalments/${installmentId}/pay`)(payLoad),
  },
  createSaleReturn: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/refund`)(payLoad),
  },
  collectSaleDue: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/collect-due`)(payLoad),
  },
  addSalePayment: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/payments`)(payLoad),
  },
  voidSale: {
    query: ({ id, payLoad }: { id: number | string; payLoad: any }) =>
      createMutation(`${id}/void`)(payLoad),
  },
  getSaleRefunds: {
    query: ({ id }: { id: number | string }) => getMutation(`${id}/refunds`),
  },
  getSaleRefundedItems: {
    query: ({ id }: { id: number | string }) =>
      getMutation(`${id}/products/refunded`),
  },
}

export const sales = createApi({
  reducerPath: "sales",
  baseQuery: createBaseQueryWithInterceptor("sales"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
