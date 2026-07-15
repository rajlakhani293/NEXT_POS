import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import { postMutation } from "@/lib/api/apiUtils"

const endpointsConfig = {
  getDashboardSummary: { query: postMutation("dashboard-summary"), type: "query" },
  getProductHistoryCombinedReport: { query: postMutation("product-history-combined") },
  computeProductHistoryCombinedReport: { query: postMutation("compute-combined-report") },
  getSaleReport: { query: postMutation("sale-report") },
  getSoldStockReport: { query: postMutation("sold-stock-report") },
  getProfitReport: { query: postMutation("profit-report") },
  getPaymentTypesReport: { query: postMutation("payment-types") },
  getProductsReport: { query: postMutation("products-report") },
  getLowStockReport: { query: postMutation("low-stock") },
  getStockReport: { query: postMutation("stock-report") },
  getTransactionsReport: { query: postMutation("transactions") },
  getCustomerStatement: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`customers-statement/${id}`)(payLoad) },
  getAnnualReport: { query: postMutation("annual-report") },
  computeAnnualReport: { query: postMutation("compute/yearly") },
}

export const reports = createApi({
  reducerPath: "reports",
  baseQuery: createBaseQueryWithInterceptor("reports"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {};
    for (const [name, config] of Object.entries(endpointsConfig)) {
      const { type, ...restConfig } = config as any;
      if (type === "query") {
        finalEndpoints[name] = builder.query(restConfig);
      } else {
        finalEndpoints[name] = builder.mutation(restConfig);
      }
    }
    return finalEndpoints;
  },
});
