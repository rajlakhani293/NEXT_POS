import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import { postMutation } from "@/lib/api/apiUtils"

const endpointsConfig = {
  getDashboardSummary: { query: postMutation("dashboard-summary") },
  refreshDashboardSnapshot: { query: postMutation("dashboard-snapshot/refresh") },
  getCustomerDueReport: { query: postMutation("customer-due") },
  getSupplierPayableReport: { query: postMutation("supplier-payable") },
  getStockLedgerReport: { query: postMutation("stock-ledger") },
  getCustomerCreditLedgerReport: { query: postMutation("customer-credit-ledger") },
  getSaleReport: { query: postMutation("sale-report") },
  getSoldStockReport: { query: postMutation("sold-stock-report") },
  getProfitReport: { query: postMutation("profit-report") },
  getPaymentTypesReport: { query: postMutation("payment-types") },
  getProductsReport: { query: postMutation("products-report") },
  getLowStockReport: { query: postMutation("low-stock") },
  getStockReport: { query: postMutation("stock-report") },
  getCashierReport: { query: postMutation("cashier-report") },
  getCustomerStatement: {
    query: ({ id, payLoad }: { id: any; payLoad: any }) =>
      postMutation(`customers-statement/${id}`)(payLoad),
  },
}

export const reports = createApi({
  reducerPath: "reports",
  baseQuery: createBaseQueryWithInterceptor("reports"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
