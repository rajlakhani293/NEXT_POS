"use client"

import { useEffect, useState } from "react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { accounting } from "@/lib/api/accounting"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const accountFields = [
  ["paid_expense_offset_account_id", "Paid Expense Offset"],
  ["sales_revenue_account_id", "Sales Revenue Account"],
  ["order_cash_account_id", "Order Cash Account"],
  ["receivable_account_id", "Receivable Account"],
  ["cogs_account_id", "Cost of Goods Sold Account"],
  ["inventory_account_id", "Inventory Account"],
  ["procurement_cash_account_id", "Procurement Cash Account"],
  ["procurement_payable_account_id", "Procurement Payable Account"],
] as const

export default function AccountingConfigurationPage() {
  const accounts = (accounting as any).useGetAccountsDropdownQuery()
  const settings = (accounting as any).useGetAccountingSettingsQuery()
  const [updateSettings, updateState] = (
    accounting as any
  ).useUpdateAccountingSettingsMutation()
  const [values, setValues] = useState<Record<string, any>>({
    expense_account_ids: [],
  })

  useEffect(() => {
    if (!settings.data?.data) return
    const data = settings.data.data
    setValues({
      expense_account_ids: data.expense_account_ids || [],
      ...Object.fromEntries(
        accountFields.map(([field]) => [field, String(data[field] || "")])
      ),
    })
  }, [settings.data?.data])

  if (settings.isLoading || accounts.isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-5" />
        Loading accounting configuration...
      </div>
    )
  }

  const accountOptions = accounts.data?.data || []
  const toggleExpense = (accountId: number, checked: boolean) => {
    setValues((current) => ({
      ...current,
      expense_account_ids: checked
        ? [...current.expense_account_ids, accountId]
        : current.expense_account_ids.filter((id: number) => id !== accountId),
    }))
  }

  const save = async () => {
    const missing = accountFields.some(([field]) => !values[field])
    if (missing || !values.expense_account_ids.length) {
      showToast.error("Choose all required accounting accounts.")
      return
    }
    const payLoad = {
      expense_account_ids: values.expense_account_ids,
      ...Object.fromEntries(
        accountFields.map(([field]) => [field, Number(values[field])])
      ),
    }
    const response = await updateSettings({ payLoad }).unwrap()
    showToast.success(response?.message || "Accounting configuration saved.")
  }

  return (
    <PermissionGuard permission={PERMISSIONS.reports.view}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-gray-50">
        <div className="flex flex-none items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Accounting Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Map expense, sales, inventory, cash and payable accounts.
            </p>
          </div>
          <Button
            onClick={save}
            disabled={updateState.isLoading}
          >
            Save Configuration
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.4fr]">
            <section className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold">Expense Accounts</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                These accounts are available when creating an expense category.
              </p>
              <div className="space-y-2">
                {accountOptions
                  .filter((account: any) => account.account_type === "expense")
                  .map((account: any) => (
                    <label
                      key={account.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <Checkbox
                        checked={values.expense_account_ids.includes(account.id)}
                        onCheckedChange={(checked) =>
                          toggleExpense(account.id, Boolean(checked))
                        }
                      />
                      <span className="text-sm font-medium">{account.name}</span>
                    </label>
                  ))}
              </div>
            </section>
            <section className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
              {accountFields.map(([field, label]) => (
                <UniFieldSelect
                  key={field}
                  label={label}
                  required
                  value={values[field] || ""}
                  onValueChange={(value) =>
                    setValues((current) => ({ ...current, [field]: value }))
                  }
                  placeholder="Choose account"
                >
                  {accountOptions.map((account: any) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
              ))}
            </section>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
