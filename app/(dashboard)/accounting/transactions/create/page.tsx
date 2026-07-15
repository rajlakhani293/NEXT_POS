"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const initialValues = {
  active: true,
  account_id: "",
  name: "",
  value: "",
  recurring: false,
  occurrence: "",
  occurrence_value: "",
  scheduled_date: "",
  type: "",
  description: "",
  media_id: "",
  group_id: "",
}

const transactionTypes = [
  { label: "Direct Expense", value: "direct", enabled: true },
  { label: "Recurring Expense", value: "recurring", enabled: false },
  { label: "Entity Expense", value: "entity", enabled: false },
  { label: "Scheduled Expense", value: "scheduled", enabled: false },
]

const occurrenceOptions = [
  { label: "Start of Month", value: "month_starts" },
  { label: "Mid of Month", value: "month_mids" },
  { label: "End of Month", value: "month_ends" },
  { label: "X days Before Month Ends", value: "x_before_month_ends" },
  { label: "X days After Month Starts", value: "x_after_month_starts" },
  { label: "Every X minutes", value: "every_x_minutes" },
  { label: "Every X hours", value: "every_x_hours" },
  { label: "Every X Days", value: "every_x_days" },
]

export default function CreateAccountingTransactionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("id")
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const accounts = (accounting as any).useGetAccountsDropdownQuery()
  const [createTransaction, createState] = (
    accounting as any
  ).useCreateManualTransactionMutation()
  const [editTransaction, editState] = (
    accounting as any
  ).useEditTransactionMutation()
  const [getTransactionById, transactionState] = (
    accounting as any
  ).useGetTransactionByIdMutation()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = Boolean(editId)
  const hasSelectedType = isEditing || Boolean(values.type)
  const isRecurringType = values.type === "recurring"
  const isScheduledType =
    values.type === "scheduled" ||
    values.type === "entity"

  useEffect(() => {
    if (!editId) return
    getTransactionById({ id: editId })
  }, [editId, getTransactionById])

  useEffect(() => {
    const record = transactionState.data?.data
    if (!record) return
    setValues({
      active: Boolean(record.active),
      account_id: String(record.account_id || record.account?.id || ""),
      name: record.name || "",
      value: String(record.value || ""),
      recurring: Boolean(record.recurring),
      occurrence: record.occurrence || "",
      occurrence_value: String(record.occurrence_value || ""),
      scheduled_date: record.scheduled_date
        ? String(record.scheduled_date).slice(0, 10)
        : "",
      type: record.recurring ? "recurring" : "direct",
      description: record.description || "",
      media_id: record.media_id ? String(record.media_id) : "",
      group_id: record.group_id ? String(record.group_id) : "",
    })
  }, [transactionState.data])

  useEffect(() => {
    if (values.type !== "recurring" && values.recurring) {
      setValues((current) => ({ ...current, recurring: false }))
    }
    if (values.type === "recurring" && !values.recurring) {
      setValues((current) => ({ ...current, recurring: true }))
    }
  }, [values.recurring, values.type])

  const setValue = (name: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: "" }))
  }

  const visibleOccurrence = useMemo(
    () => isRecurringType || values.occurrence || values.occurrence_value,
    [isRecurringType, values.occurrence, values.occurrence_value]
  )

  const expenseAccountIds = useMemo(
    () => {
      const configuredIds =
        (posOptions as any).accounting_expenses_accounts ||
        (posOptions as any).accounting_expense_accounts ||
        []
      return (Array.isArray(configuredIds) ? configuredIds : [])
        .map((id: any) => String(id))
        .filter(Boolean)
    },
    [posOptions]
  )

  const expenseAccounts = useMemo(
    () =>
      (accounts.data?.data || []).filter(
        (account: any) =>
          account.category_identifier === "expenses" &&
          expenseAccountIds.includes(String(account.id))
      ),
    [accounts.data?.data, expenseAccountIds]
  )

  const selectTransactionType = (type: (typeof transactionTypes)[number]) => {
    if (!type.enabled) return
    setValues((current) => ({
      ...current,
      type: type.value,
      recurring: type.value === "recurring",
    }))
  }

  const submit = async () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = t("Name is required")
    if (!values.account_id) nextErrors.account_id = t("Transaction account is required.")
    if (!values.value || Number(values.value) <= 0) {
      nextErrors.value = t("Value must be greater than 0.")
    }
    if (isRecurringType && !values.occurrence) {
      nextErrors.occurrence = t("Occurrence is required.")
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const payLoad = {
      name: values.name,
      active: values.active,
      account_id: Number(values.account_id),
      description: values.description || "",
      media_id: Number(values.media_id || 0),
      value: Number(values.value || 0),
      recurring: values.type === "recurring",
      type: "expense",
      group_id: values.group_id ? Number(values.group_id) : null,
      occurrence: values.occurrence || "",
      occurrence_value: values.occurrence_value || "",
      scheduled_date: values.scheduled_date || null,
    }

    const response = isEditing
      ? await editTransaction({ id: editId, payLoad }).unwrap()
      : await createTransaction(payLoad).unwrap()

    showToast.success(
      response?.message || t("The transaction has been successfully saved.")
    )
    router.push("/accounting/transactions")
  }

  return (
    <DashboardPage padding="none">
      <PermissionGuard
        permission={isEditing ? PERMISSIONS.expenses.update : PERMISSIONS.expenses.create}
      >
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
            <h1 className="text-xl font-semibold">
              {isEditing ? t("Edit transaction") : t("Create a new transaction")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? t("Modify  Transaction.")
                : t("Register a new transaction and save it.")}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6 pb-24">
          {!hasSelectedType ? (
            <div className="mx-auto max-w-3xl rounded-xl border bg-white shadow-sm">
              <div className="border-b px-4 py-3">
                <h2 className="font-semibold text-gray-950">{t("Expense Type")}</h2>
              </div>
              <div className="border-b bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-semibold">{t("Warning")}</p>
                    <p>{t("Some expense type are disabled as POS is not able to perform asynchronous requests.")}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2">
                {transactionTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    disabled={!type.enabled}
                    onClick={() => selectTransactionType(type)}
                    className={`flex h-36 flex-col items-center justify-center border-b border-r text-center transition ${
                      type.enabled
                        ? "cursor-pointer bg-white hover:bg-gray-50"
                        : "cursor-not-allowed bg-gray-50 text-gray-400"
                    }`}
                  >
                    <span className="text-base font-bold">{t(type.label)}</span>
                    {!type.enabled ? (
                      <span className="mt-1 text-xs">{t("Disabled")}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {hasSelectedType ? (
          <div className="mx-auto grid max-w-5xl gap-5 rounded-xl border bg-white p-6 md:grid-cols-2">
            <UniFieldInput
              label={t("Name")}
              required
              value={values.name}
              onChange={(event) => setValue("name", event.target.value)}
              error={errors.name}
              placeholder={t("Provide a name to the resource.")}
            />
            <UniFieldSelect
              label={t("Account")}
              required
              value={values.account_id}
              onValueChange={(value) => setValue("account_id", value)}
              error={errors.account_id}
              placeholder={t("Choose an account")}
              hasOptions={expenseAccounts.length > 0}
              emptyLabel="You need to configure the expense accounts before creating a transaction."
            >
              {expenseAccounts.map((account: any) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  {account.name}
                </SelectItem>
              ))}
            </UniFieldSelect>
            <UniFieldInput
              label={t("Value")}
              required
              type="number"
              min="0"
              prefix={posOptions.currency_symbol}
              prefixPadding="pl-9"
              value={values.value}
              onChange={(event) => setValue("value", event.target.value)}
              error={errors.value}
              placeholder={t("Is the value or the cost of the transaction.")}
            />
            {visibleOccurrence ? (
              <>
                <UniFieldSelect
                  label={t("Occurrence")}
                  value={values.occurrence}
                  onValueChange={(value) => setValue("occurrence", value)}
                  error={errors.occurrence}
                  placeholder={t("Define how often this transaction occurs")}
                >
                  {occurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
                <UniFieldInput
                  label={t("Occurrence Value")}
                  value={values.occurrence_value}
                  onChange={(event) =>
                    setValue("occurrence_value", event.target.value)
                  }
                  placeholder={t("Must be used in case of X days after month starts and X days before month ends.")}
                />
              </>
            ) : null}
            {isScheduledType ? (
              <UniFieldInput
                label={t("Scheduled")}
                type="date"
                value={values.scheduled_date}
                onChange={(event) =>
                  setValue("scheduled_date", event.target.value)
                }
                placeholder={t("Set the scheduled date.")}
              />
            ) : null}
            {values.type === "entity" ? (
              <UniFieldInput
                label={t("Users Group")}
                type="number"
                value={values.group_id}
                onChange={(event) => setValue("group_id", event.target.value)}
                placeholder={t("Assign transaction to users group. the Transaction will therefore be multiplied by the number of entity.")}
              />
            ) : null}
            <UniFieldInput
              label={t("Description")}
              as="textarea"
              value={values.description}
              onChange={(event) => setValue("description", event.target.value)}
              placeholder={t("Further details on the transaction.")}
              containerClassName="md:col-span-2"
            />
          </div>
          ) : null}
        </div>

        {hasSelectedType ? (
        <div className="flex flex-none justify-end gap-2 border-t bg-white px-6 py-3">
          <Button variant="outline" onClick={() => router.back()}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={
              createState.isLoading || editState.isLoading || transactionState.isLoading
            }
          >
            {t("Save Transaction")}
          </Button>
        </div>
        ) : null}
        </div>
      </PermissionGuard>
    </DashboardPage>
  )
}
