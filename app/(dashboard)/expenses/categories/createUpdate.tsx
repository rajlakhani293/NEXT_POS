"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { expenses } from "@/lib/api/expenses"

const initialValues = {
  name: "",
  description: "",
}

export function ExpenseCategoryForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Expense Category"
      fields={[
        { name: "name", label: "Name", placeholder: "Enter category name", type: "text", required: true },
        { name: "description", label: "Description", placeholder: "Enter description", type: "textarea" },
      ]}
      initialValues={initialValues}
      createHook={(expenses as any).useCreateExpenseCategoryMutation}
      editHook={(expenses as any).useEditExpenseCategoryMutation}
      getByIdHook={(expenses as any).useGetExpenseCategoryByIdMutation}
    />
  )
}
