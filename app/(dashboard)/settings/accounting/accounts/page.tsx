"use client"

import { useMemo, useState } from "react"

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import DynamicForm from "@/components/DynamicForm"
import { Button } from "@/components/ui/button"
import { accounting } from "@/lib/api/accounting"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { TransactionAccountForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "account_type", title: "Type" },
  { key: "current_balance", title: "Balance" },
  { key: "is_system", title: "System" },
]

export default function TransactionAccountsPage() {
  const [isTransactionOpen, setIsTransactionOpen] = useState(false)
  const [getAccountsDropdown, accountsDropdown] = (
    accounting as any
  ).useGetAccountsDropdownMutation()
  const [createManualTransaction] = (
    accounting as any
  ).useCreateManualTransactionMutation()
  const [bootstrapAccounting, bootstrapState] = (
    accounting as any
  ).useBootstrapAccountingMutation()

  const accountOptions = useMemo(
    () =>
      (accountsDropdown.data?.data || []).map((item: any) => ({
        label: `${item.name} (${item.account_type})`,
        value: item.id,
      })),
    [accountsDropdown.data?.data]
  )

  const openManualTransaction = () => {
    getAccountsDropdown()
    setIsTransactionOpen(true)
  }

  const bootstrap = async () => {
    const response = await bootstrapAccounting().unwrap()
    showToast.success(response?.message || "Accounting bootstrapped.")
  }

  const submitManualTransaction = async (values: any) => {
    const response = await createManualTransaction({
      ...values,
      account_id: Number(values.account_id),
      amount: values.amount || "0",
    }).unwrap()
    showToast.success(response?.message || "Transaction created.")
    setIsTransactionOpen(false)
  }

  return (
    <>
      <CatalogPageShell
        tableTitle="Transaction Accounts"
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
      <div className="pointer-events-none fixed right-8 bottom-8 z-40 flex gap-2">
        <Button
          className="pointer-events-auto"
          variant="outline"
          onClick={bootstrap}
          disabled={bootstrapState.isLoading}
        >
          Bootstrap Accounts
        </Button>
        <Button className="pointer-events-auto" onClick={openManualTransaction}>
          Manual Transaction
        </Button>
      </div>

      <DynamicForm
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        title="Manual Transaction"
        initialValues={{
          account_id: "",
          name: "",
          transaction_type: "adjustment",
          action_type: "credit",
          amount: "",
          transaction_date: new Date().toISOString().slice(0, 10),
          reference_number: "",
          description: "",
        }}
        fields={[
          {
            name: "account_id",
            label: "Account",
            type: "select",
            options: accountOptions,
            placeholder: "Select account",
            required: true,
          },
          {
            name: "name",
            label: "Transaction Name",
            placeholder: "Enter transaction name",
            required: true,
          },
          {
            name: "transaction_type",
            label: "Transaction Type",
            type: "select",
            required: true,
            options: [
              { label: "Income", value: "income" },
              { label: "Expense", value: "expense" },
              { label: "Transfer", value: "transfer" },
              { label: "Adjustment", value: "adjustment" },
            ],
          },
          {
            name: "action_type",
            label: "Action",
            type: "radio",
            required: true,
            options: [
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ],
          },
          {
            name: "amount",
            label: "Amount",
            type: "number",
            placeholder: "Enter amount",
            prefix: "₹",
            required: true,
          },
          {
            name: "transaction_date",
            label: "Date",
            type: "date",
          },
          {
            name: "reference_number",
            label: "Reference Number",
            placeholder: "Enter reference number",
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            placeholder: "Enter description",
          },
        ]}
        onSubmit={submitManualTransaction}
      />
    </>
  )
}
