"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { expenses } from "@/lib/api/expenses"
import { PERMISSIONS } from "@/lib/permissions"
import { ExpenseCategoryForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "description", title: "Description" },
]

export default function ExpenseCategoriesPage() {
  return (
    <CatalogPageShell
      tableTitle="Expense Categories"
      addTitle="Add Category"
      columns={columns}
      getDataHook={(expenses as any).useGetExpenseCategoriesDataMutation}
      deleteHook={(expenses as any).useDeleteExpenseCategoryMutation}
      statusHook={(expenses as any).useUpdateExpenseCategoryStatusMutation}
      FormComponent={ExpenseCategoryForm}
      deleteTitle="Delete Expense Category"
      deleteDescription="Are you sure you want to delete this expense category?"
      permissions={{
        view: PERMISSIONS.expenses.view,
        create: PERMISSIONS.expenses.create,
        update: PERMISSIONS.expenses.update,
        delete: PERMISSIONS.expenses.delete,
      }}
    />
  )
}
