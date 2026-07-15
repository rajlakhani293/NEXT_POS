"use client"

import { useRouter } from "next/navigation"
import { Clock, Play, Plus } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { useTableData } from "@/hooks/useTableData"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string
) => [
    { key: "name", title: t("Name") },
    { key: "type", title: t("Type") },
    { key: "account__name", title: t("Account Name") },
    { key: "value", title: t("Value"), render: (value: any) => formatMoney(value) },
    { key: "recurring", title: t("Recurring"), render: (value: any) => (value ? t("Yes") : t("No")) },
    { key: "occurrence", title: t("Occurrence") },
    { key: "user_username", title: t("User") },
    { key: "created_at", title: t("Created At") },
  ]

export default function TransactionsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.expenses.create)
  const canUpdate = hasPermission(PERMISSIONS.expenses.update)
  const canDelete = hasPermission(PERMISSIONS.expenses.delete)
  const [deleteTransaction] = (accounting as any).useDeleteTransactionMutation()
  const [triggerTransaction] = (accounting as any).useTriggerTransactionMutation()
  const formatMoney = (value: any) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const table = useTableData({
    getMaster: (accounting as any).useGetTransactionsDataMutation,

  })

  return (
    <PermissionGuard permission={PERMISSIONS.expenses.view}>
      <DynamicTable
        data={table.orders}
        columns={buildColumns(t, formatMoney)}
        tableTitle={t("Transactions List")}
        showSearch
        searchTerm={table.searchTerm}
        currentPage={table.currentPage}
        itemsPerPage={table.itemsPerPage}
        totalItems={table.totalItems}
        onPageChange={table.setCurrentPage}
        onFilterChange={table.handleFilterChange}
        sortConfig={table.sortConfig}
        onSort={table.handleSort}
        sortableFields={table.sortableFields}
        isLoading={table.isLoading}
        showEdit={canUpdate}
        onEdit={(record) => router.push(`/accounting/transactions/create?id=${record.id}`)}
        showDelete={canDelete}
        deleteMutation={deleteTransaction}
        triggerRefresh={table.triggerRefresh}
        deleteModalTitle={t("Delete Transaction")}
        deleteModalDescription={t("Would you like to delete this ?")}
        rowActions={(_, record) => [
          {
            key: "history",
            label: t("History"),
            labelText: t("History"),
            icon: <Clock className="size-4" />,
            onClick: () => router.push(`/accounting/transactions/history/${record.id}`),
          },
          {
            key: "trigger",
            label: t("Trigger"),
            labelText: t("Trigger"),
            icon: <Play className="size-4" />,
            onClick: async () => {
              try {
                const response = await triggerTransaction({ id: record.id }).unwrap()
                showToast.success(response?.message || t("The transaction has been successfully triggered."))
                table.triggerRefresh()
              } catch (error: any) {
                showToast.error(error?.data?.message || t("Unable to trigger transaction."))
              }
            },
          },
        ].filter((action) => action.key !== "trigger" || canUpdate)}
        showDateRange
        secondaryActionButton={
          canCreate ? <Button onClick={() => router.push("/accounting/transactions/create")}>
            <Plus className="size-4" />
            {t("Create Expense")}
          </Button> : undefined
        }
      />
    </PermissionGuard>
  )
}
