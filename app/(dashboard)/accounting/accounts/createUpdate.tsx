"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const initialValues = {
  name: "",
  account: "",
  category_identifier: "assets",
  sub_category_id: "",
  description: "",
}

export function TransactionAccountForm(props: any) {
  const { t } = useTranslation()
  const accounts = (accounting as any).useGetAccountsDropdownQuery()

  return (
    <CatalogMasterForm
      {...props}
      entityName={t("Account")}
      fields={[
        {
          name: "category_identifier",
          label: t("Main Account"),
          placeholder: t("Select category"),
          type: "select",
          required: true,
          options: [
            { label: t("Assets"), value: "assets" },
            { label: t("Liabilities"), value: "liabilities" },
            { label: t("Revenues"), value: "revenues" },
            { label: t("Expenses"), value: "expenses" },
            { label: t("Equity"), value: "equity" },
          ],
        },
        {
          name: "sub_category_id",
          label: t("Sub Account"),
          placeholder: t("Select parent account"),
          type: "select",
          options: (accounts.data?.data || []).map((account: any) => ({
            label: account.name,
            value: String(account.id),
          })),
        },
        { name: "name", label: t("Name"), placeholder: t("Enter account name"), type: "text", required: true },
        { name: "account", label: t("Account"), placeholder: t("Auto generated if empty"), type: "text" },
        { name: "description", label: t("Description"), placeholder: t("Enter description"), type: "textarea" },
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
