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
  getExpenseCategoriesDropdown: { query: () => getMutation("categories/dropdown-list") },
  getExpenseCategoriesData: { query: postMutation("categories/get-transactions") },
  createExpenseCategory: { query: createMutation("categories/") },
  editExpenseCategory: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`categories/${id}`, payLoad) },
  deleteExpenseCategory: { query: deleteMutation("categories/delete") },
  updateExpenseCategoryStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("categories/status", payLoad) },
  getExpenseCategoryById: { query: ({ id }: { id: number }) => getMutation(`categories/${id}`) },

  getExpensesData: { query: postMutation("get-transactions") },
  createExpense: { query: createMutation("") },
  editExpense: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`${id}`, payLoad) },
  deleteExpense: { query: deleteMutation("delete") },
  updateExpenseStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("status", payLoad) },
  getExpenseById: { query: ({ id }: { id: number }) => getMutation(`${id}`) },
}

export const expenses = createApi({
  reducerPath: "expenses",
  baseQuery: createBaseQueryWithInterceptor("expenses"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
