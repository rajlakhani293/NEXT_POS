"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

type Rule = {
  id?: number
  on: string
  action: "increase" | "decrease"
  account_id: string
  do: "increase" | "decrease"
  offset_account_id: string
}

const emptyRule: Rule = {
  on: "",
  action: "increase",
  account_id: "",
  do: "increase",
  offset_account_id: "",
}

export default function AccountingRulesPage() {
  const { t } = useTranslation()
  const actions = (accounting as any).useGetAccountingActionsQuery()
  const accounts = (accounting as any).useGetAccountsDropdownQuery()
  const rulesQuery = (accounting as any).useGetAccountingRulesQuery()
  const [createRule, createState] = (accounting as any).useCreateAccountingRuleMutation()
  const [editRule, editState] = (accounting as any).useEditAccountingRuleMutation()
  const [deleteRule] = (accounting as any).useDeleteAccountingRuleMutation()
  const [rules, setRules] = useState<Rule[]>([])
  const { confirm, confirmDialog } = useConfirmDialog()

  useEffect(() => {
    if (!rulesQuery.data?.data) return
    setRules(
      rulesQuery.data.data.map((rule: any) => ({
        id: rule.id,
        on: rule.on || "",
        action: rule.action,
        account_id: String(rule.account_id),
        do: rule.do || "increase",
        offset_account_id: String(rule.offset_account_id),
      }))
    )
  }, [rulesQuery.data?.data])

  const actionOptions = actions.data?.data || []
  const accountOptions = accounts.data?.data || []
  const isSaving = createState.isLoading || editState.isLoading
  const canSave = (rule: Rule) =>
    rule.on && rule.account_id && rule.offset_account_id

  const updateRule = (index: number, changes: Partial<Rule>) => {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...changes } : rule
      )
    )
  }

  const saveRule = async (rule: Rule) => {
    if (!canSave(rule)) {
      showToast.error(t("Choose an action and both transaction accounts."))
      return
    }
    const payLoad = {
      on: rule.on,
      action: rule.action,
      account_id: Number(rule.account_id),
      do: rule.do,
      offset_account_id: Number(rule.offset_account_id),
    }
    const response = rule.id
      ? await editRule({ id: rule.id, payLoad }).unwrap()
      : await createRule(payLoad).unwrap()
    showToast.success(response?.message || t("The accounting action has been saved"))
    rulesQuery.refetch()
  }

  const removeRule = async (rule: Rule, index: number) => {
    if (!rule.id) {
      setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index))
      return
    }
    const confirmed = await confirm({
      title: t("Delete Permanent"),
      description: t("You're about to delete this rule. This action cannot be undone. Would you like to proceed?"),
      confirmLabel: t("Delete"),
      variant: "destructive",
    })
    if (!confirmed) return
    const response = await deleteRule({ ids: [rule.id] }).unwrap()
    showToast.success(response?.message || t("Accounting rule deleted."))
    rulesQuery.refetch()
  }



  const content = useMemo(() => {
    if (rulesQuery.isLoading || accounts.isLoading || actions.isLoading) {
      return (
        <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          {t("Loading accounting rules...")}
        </div>
      )
    }

    return rules.map((rule, index) => (
      <div
        key={rule.id || `new-${index}`}
        className="grid gap-3 rounded-xl border bg-white p-3 shadow-sm xl:grid-cols-[minmax(220px,1.15fr)_150px_minmax(190px,1fr)_150px_minmax(190px,1fr)_auto]"
      >
        <UniFieldSelect
          value={rule.on}
          onValueChange={(value) => updateRule(index, { on: value })}
          placeholder={t("Choose action")}
        >
          {actionOptions.map((option: any) => (
            <SelectItem key={option.value} value={option.value}>
              {t("On")}: {option.label}
            </SelectItem>
          ))}
        </UniFieldSelect>
        <UniFieldSelect
          value={rule.action}
          onValueChange={(value) =>
            updateRule(index, { action: value as Rule["action"] })
          }
        >
          <SelectItem value="increase">{t("Increase")}</SelectItem>
          <SelectItem value="decrease">{t("Decrease")}</SelectItem>
        </UniFieldSelect>
        <UniFieldSelect
          value={rule.account_id}
          onValueChange={(value) => updateRule(index, { account_id: value })}
          placeholder={t("Choose account")}
        >
          {accountOptions.map((account: any) => (
            <SelectItem key={account.id} value={String(account.id)}>
              {account.name}
            </SelectItem>
          ))}
        </UniFieldSelect>
        <UniFieldSelect
          value={rule.do}
          onValueChange={(value) =>
            updateRule(index, { do: value as Rule["do"] })
          }
        >
          <SelectItem value="increase">{t("Increase")}</SelectItem>
          <SelectItem value="decrease">{t("Decrease")}</SelectItem>
        </UniFieldSelect>
        <UniFieldSelect
          value={rule.offset_account_id}
          onValueChange={(value) =>
            updateRule(index, { offset_account_id: value })
          }
          placeholder={t("Choose offset account")}
        >
          {accountOptions.map((account: any) => (
            <SelectItem key={account.id} value={String(account.id)}>
              {account.name}
            </SelectItem>
          ))}
        </UniFieldSelect>
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label={t("Save rule")}
            disabled={isSaving}
            onClick={() => saveRule(rule)}
          >
            <Save className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label={t("Delete rule")}
            onClick={() => removeRule(rule, index)}
          >
            <Trash2 className="size-4 text-red-500" />
          </Button>
        </div>
      </div>
    ))
  }, [
    accountOptions,
    accounts.isLoading,
    actionOptions,
    actions.isLoading,
    isSaving,
    rules,
    rulesQuery.isLoading,
    t,
  ])

  return (
    <DashboardPage padding="none">
      <PermissionGuard permission={PERMISSIONS.expenses.update}>
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-5 py-3">
          <div>
            <h1 className="text-xl font-semibold">{t("Rules")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("Choose the event, movement, account, offset movement and offset account.")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setRules((current) => [...current, { ...emptyRule }])}>
              <Plus className="size-4" />
              {t("Create a new rule")}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">{content}</div>
        </div>
      </PermissionGuard>
      {confirmDialog}
    </DashboardPage>
  )
}
