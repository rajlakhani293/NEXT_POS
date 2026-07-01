"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const initialValues = {
  account_id: "",
  name: "",
  transaction_type: "expense",
  action_type: "increase",
  amount: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  reference_number: "",
  description: "",
}

export default function CreateAccountingTransactionPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const accounts = (accounting as any).useGetAccountsDropdownQuery()
  const [createTransaction, createState] = (
    accounting as any
  ).useCreateManualTransactionMutation()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: "" }))
  }

  const submit = async () => {
    const nextErrors: Record<string, string> = {}
    if (!values.account_id) nextErrors.account_id = t("Account is required.")
    if (!values.name.trim()) nextErrors.name = t("Transaction name is required.")
    if (!values.amount || Number(values.amount) <= 0) {
      nextErrors.amount = t("Amount must be greater than 0.")
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    const response = await createTransaction({
      ...values,
      account_id: Number(values.account_id),
    }).unwrap()
    showToast.success(response?.message || t("The transaction has been successfully saved."))
    router.push("/accounting/transactions")
  }

  return (
    <PermissionGuard permission={PERMISSIONS.expenses.create}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
        <div className="flex flex-none items-center gap-4 border-b bg-white px-6 py-3">
          <Button
            size="icon"
            variant="outline"
            aria-label={t("Back")}
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{t("Create a new transaction")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("Register a new transaction and save it.")}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6 pb-24">
          <div className="mx-auto grid max-w-5xl gap-5 rounded-xl border bg-white p-6 md:grid-cols-2">
            <UniFieldSelect
              label={t("Account")}
              required
              value={values.account_id}
              onValueChange={(value) => setValue("account_id", value)}
              error={errors.account_id}
              placeholder={t("Choose account")}
            >
              {(accounts.data?.data || []).map((account: any) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  {account.name}
                </SelectItem>
              ))}
            </UniFieldSelect>
            <UniFieldInput
              label={t("Transaction Name")}
              required
              value={values.name}
              onChange={(event) => setValue("name", event.target.value)}
              error={errors.name}
              placeholder={t("Enter transaction name")}
            />
            <input type="hidden" value={values.transaction_type} readOnly />
            <UniFieldSelect
              label={t("Action")}
              value={values.action_type}
              onValueChange={(value) => setValue("action_type", value)}
            >
              <SelectItem value="increase">{t("Increase")}</SelectItem>
              <SelectItem value="decrease">{t("Decrease")}</SelectItem>
            </UniFieldSelect>
            <UniFieldInput
              label={t("Amount")}
              required
              type="number"
              min="0"
              prefix="₹"
              prefixPadding="pl-9"
              value={values.amount}
              onChange={(event) => setValue("amount", event.target.value)}
              error={errors.amount}
              placeholder={t("Enter amount")}
            />
            <UniFieldInput
              label={t("Transaction Date")}
              type="date"
              value={values.transaction_date}
              onChange={(event) => setValue("transaction_date", event.target.value)}
            />
            <UniFieldInput
              label={t("Reference Number")}
              value={values.reference_number}
              onChange={(event) => setValue("reference_number", event.target.value)}
              placeholder={t("Enter reference number")}
            />
            <UniFieldInput
              label={t("Description")}
              as="textarea"
              value={values.description}
              onChange={(event) => setValue("description", event.target.value)}
              placeholder={t("Enter transaction description")}
              containerClassName="md:col-span-2"
            />
          </div>
        </div>

        <div className="flex flex-none justify-end gap-2 border-t bg-white px-6 py-3">
          <Button variant="outline" onClick={() => router.back()}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit} disabled={createState.isLoading}>
            {t("Save Transaction")}
          </Button>
        </div>
      </div>
    </PermissionGuard>
  )
}
