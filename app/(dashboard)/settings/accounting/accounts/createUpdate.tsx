"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { accounting } from "@/lib/api/accounting"

const initialValues = {
  name: "",
  account: "",
  category_identifier: "assets",
  sub_category_id: "",
  description: "",
}

export function TransactionAccountForm(props: any) {
  const accounts = (accounting as any).useGetAccountsDropdownQuery()

  return (
    <CatalogMasterForm
      {...props}
      entityName="Account"
      fields={[
        {
          name: "category_identifier",
          label: "Main Account",
          placeholder: "Select category",
          type: "select",
          required: true,
          options: [
            { label: "Assets", value: "assets" },
            { label: "Liabilities", value: "liabilities" },
            { label: "Revenues", value: "revenues" },
            { label: "Expenses", value: "expenses" },
            { label: "Equity", value: "equity" },
          ],
        },
        {
          name: "sub_category_id",
          label: "Sub Account",
          placeholder: "Select parent account",
          type: "select",
          options: (accounts.data?.data || []).map((account: any) => ({
            label: account.name,
            value: String(account.id),
          })),
        },
        { name: "name", label: "Name", placeholder: "Enter account name", type: "text", required: true },
        { name: "account", label: "Account", placeholder: "Auto generated if empty", type: "text" },
        { name: "description", label: "Description", placeholder: "Enter description", type: "textarea" },
      ]}
      initialValues={initialValues}
      createHook={(accounting as any).useCreateAccountMutation}
      editHook={(accounting as any).useEditAccountMutation}
      getByIdHook={(accounting as any).useGetAccountByIdMutation}
      buildPayload={(values) => ({
        ...values,
        sub_category_id: values.sub_category_id ? Number(values.sub_category_id) : null,
      })}
    />
  )
}
