"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const initialValues = {
  active: false,
  account_id: "",
  name: "",
  value: "",
  recurring: false,
  occurrence: "",
  occurrence_value: "",
  scheduled_date: "",
  type: "direct-transaction",
  description: "",
  media_id: "",
  group_id: "",
}

const transactionTypes = [
  { label: "Direct Expense", value: "direct-transaction" },
  { label: "Recurring Expense", value: "recurring-transaction" },
  { label: "Entity Expense", value: "entity-transaction" },
  { label: "Scheduled Expense", value: "scheduled-transaction" },
]

const occurrenceOptions = [
  { label: "Start of Month", value: "month_starts" },
  { label: "Mid of Month", value: "month_mid" },
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
  const isRecurringType = values.type === "recurring-transaction"
  const isScheduledType =
    values.type === "scheduled-transaction" ||
    values.type === "entity-transaction"

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
      type: record.type || "direct-transaction",
      description: record.description || "",
      media_id: record.media_id ? String(record.media_id) : "",
      group_id: record.group_id ? String(record.group_id) : "",
    })
  }, [transactionState.data])

  useEffect(() => {
    if (values.type !== "recurring-transaction" && values.recurring) {
      setValues((current) => ({ ...current, recurring: false }))
    }
    if (values.type === "recurring-transaction" && !values.recurring) {
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
      recurring: values.type === "recurring-transaction",
      type: values.type,
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
              label={t("Transaction Account")}
              required
              value={values.account_id}
              onValueChange={(value) => setValue("account_id", value)}
              error={errors.account_id}
              placeholder={t("Assign the transaction to an account")}
            >
              {(accounts.data?.data || []).map((account: any) => (
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
            <UniFieldSelect
              label={t("Type")}
              value={values.type}
              onValueChange={(value) => setValue("type", value)}
            >
              {transactionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {t(type.label)}
                </SelectItem>
              ))}
            </UniFieldSelect>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">{t("Active")}</div>
                <p className="text-sm text-muted-foreground">
                  {t("determine if the transaction is effective or not. Work for recurring and not recurring transactions.")}
                </p>
              </div>
              <Switch
                checked={values.active}
                onCheckedChange={(checked) => setValue("active", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">{t("Recurring")}</div>
                <p className="text-sm text-muted-foreground">
                  {t("If set to Yes, the transaction will trigger on defined occurrence.")}
                </p>
              </div>
              <Switch
                checked={values.recurring}
                disabled
                onCheckedChange={(checked) => setValue("recurring", checked)}
              />
            </div>
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
            {values.type === "entity-transaction" ? (
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
              containerClassName="md:col-span-2"
            />
          </div>
        </div>

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
      </div>
    </PermissionGuard>
  )
}
