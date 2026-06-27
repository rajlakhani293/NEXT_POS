"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { accounting } from "@/lib/api/accounting"
import { PERMISSIONS } from "@/lib/permissions"
import { TransactionAccountForm } from "./createUpdate"

const columns = [
  { key: "category_identifier", title: "Category" },
  {
    key: "sub_category__name",
    title: "Sub Account",
    render: (value: string) => value || "-",
  },
  { key: "name", title: "Name" },
  { key: "account", title: "Account" },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function TransactionAccountsPage() {
  return (
    <CatalogPageShell
      tableTitle="Accounts List"
      addTitle="Add Account"
      columns={columns}
      getDataHook={(accounting as any).useGetAccountsDataMutation}
      deleteHook={(accounting as any).useDeleteAccountMutation}
      statusHook={(accounting as any).useUpdateAccountStatusMutation}
      FormComponent={TransactionAccountForm}
      deleteTitle="Delete Account"
      deleteDescription="Are you sure you want to delete this transaction account?"
      permissions={{
        view: PERMISSIONS.reports.view,
        create: PERMISSIONS.settings.update,
        update: PERMISSIONS.settings.update,
        delete: PERMISSIONS.settings.update,
      }}
    />
  )
}
