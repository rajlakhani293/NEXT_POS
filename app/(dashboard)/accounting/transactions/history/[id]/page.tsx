"use client"

import { useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Repeat2Icon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string
) => [
  { key: "name", title: t("Name") },
  { key: "category_identifier", title: t("Main Account") },
  { key: "account_name", title: t("Sub Account") },
  { key: "operation", title: t("Operation") },
  {
    key: "value",
    title: t("Value"),
    render: (val: any) => formatMoney(val),
  },
  { key: "user_username", title: t("User") },
  {
    key: "created_at",
    title: t("Triggered On"),
    render: (val: any) => (val ? new Date(val).toLocaleDateString() : "-"),
  },
]

export default function AccountingTransactionScopedHistoryPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const canCreateReflection = hasPermission(PERMISSIONS.transactionHistory.create)
  const canDelete = hasPermission(PERMISSIONS.transactionHistory.delete)
  const posOptions = usePosOptions()
  const formatMoney = (value: any) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const transactionId = params.id
  const hasTriggeredRef = useRef(false)
  const [triggerTransaction] = (accounting as any).useTriggerTransactionMutation()
  const table = useTableData({
    getMaster: (accounting as any).useGetTransactionHistoryDataMutation,
    itemsPerPage: 10,
    selectedFilters: { transaction_id: transactionId },
  })
  const { triggerRefresh } = table
  const [deleteHistory] = (accounting as any).useDeleteTransactionHistoryMutation()
  const [createReflection] = (accounting as any).useCreateTransactionReflectionMutation()

  useEffect(() => {
    if (searchParams.get("trigger") !== "1" || hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    triggerTransaction({ id: transactionId })
      .unwrap()
      .then((response: any) => {
        showToast.success(response?.message || t("The transaction has been successfully triggered."))
        triggerRefresh()
      })
      .catch((error: any) => {
        showToast.error(error?.data?.message || t("Unable to trigger transaction."))
      })
  }, [searchParams, t, transactionId, triggerRefresh, triggerTransaction])

  return (
    <PermissionGuard permission={PERMISSIONS.transactionHistory.view}>
      <DynamicTable
        data={table.orders}
        columns={buildColumns(t, formatMoney)}
        tableTitle={t("Transactions History List")}
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
        showDelete={canDelete}
        deleteMutation={deleteHistory}
        deleteModalTitle={t("Delete Transaction History")}
        deleteModalDescription={t("Are you sure you want to delete this transaction history?")}
        rowActions={(_, record) =>
          canCreateReflection &&
          !record.has_reflection &&
          record.has_transaction &&
          !record.is_reflection
            ? [
                {
                  key: "create_reflection",
                  label: t("Create Reflection"),
                  labelText: t("Create Reflection"),
                  icon: <Repeat2Icon className="size-4" />,
                  onClick: async () => {
                    const response = await createReflection({ id: record.id }).unwrap()
                    showToast.success(response?.message || t("Accounting reflection created successfully."))
                    triggerRefresh()
                  },
                },
              ]
            : []
        }
        showDateRange
      />
    </PermissionGuard>
  )
}
