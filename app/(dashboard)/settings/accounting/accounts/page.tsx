"use client"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { accounting } from "@/lib/api/accounting"
import { PERMISSIONS } from "@/lib/permissions"
import { TransactionAccountForm } from "./createUpdate"

const columns = [
  { key: "account_type", title: "Category" },
  {
    key: "parent__name",
    title: "Sub Account",
    render: (value: string) => value || "Undefined",
  },
  { key: "name", title: "Name" },
  { key: "code", title: "Account" },
  { key: "current_balance", title: "Balance" },
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
