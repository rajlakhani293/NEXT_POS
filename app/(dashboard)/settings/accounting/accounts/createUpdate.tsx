"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { accounting } from "@/lib/api/accounting"

const initialValues = {
  name: "",
  code: "",
  account_type: "asset",
  description: "",
  opening_balance: "",
}

export function TransactionAccountForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Transaction Account"
      fields={[
        { name: "name", label: "Account Name", placeholder: "Enter account name", type: "text", required: true },
        { name: "code", label: "Code", placeholder: "Auto generated if empty", type: "text" },
        {
          name: "account_type",
          label: "Account Type",
          placeholder: "Select account type",
          type: "select",
          required: true,
          options: [
            { label: "Asset", value: "asset" },
            { label: "Liability", value: "liability" },
            { label: "Income", value: "income" },
            { label: "Expense", value: "expense" },
            { label: "Equity", value: "equity" },
          ],
        },
        { name: "opening_balance", label: "Opening Balance", placeholder: "Enter opening balance", type: "number" },
        { name: "description", label: "Description", placeholder: "Enter description", type: "textarea" },
      ]}
      initialValues={initialValues}
      createHook={(accounting as any).useCreateAccountMutation}
      editHook={(accounting as any).useEditAccountMutation}
      getByIdHook={(accounting as any).useGetAccountByIdMutation}
      buildPayload={(values) => ({
        ...values,
        opening_balance: values.opening_balance || "0",
      })}
    />
  )
}
