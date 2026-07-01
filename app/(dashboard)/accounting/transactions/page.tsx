"use client"

import { useRouter } from "next/navigation"
import { Clock, Play, Plus } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { useTableData } from "@/hooks/useTableData"

const buildColumns = (t: (key: string) => string) => [
  { key: "name", title: t("Name") },
  { key: "type", title: t("Type") },
  { key: "account__name", title: t("Account Name") },
  { key: "value", title: t("Value") },
  { key: "recurring", title: t("Recurring"), render: (value: any) => (value ? t("Yes") : t("No")) },
  { key: "occurrence", title: t("Occurrence") },
  { key: "user_username", title: t("Author") },
  { key: "created_at", title: t("Created At") },
]

export default function TransactionsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const table = useTableData({
    getMaster: (accounting as any).useGetTransactionsDataMutation,
    itemsPerPage: 10,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.expenses.view}>
      <DynamicTable
        data={table.orders}
        columns={buildColumns(t)}
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
            onClick: () => router.push(`/accounting/transactions/history/${record.id}?trigger=1`),
          },
        ]}
        showDateRange
        secondaryActionButton={
          <Button onClick={() => router.push("/accounting/transactions/create")}>
            <Plus className="size-4" />
            {t("Create Expense")}
          </Button>
        }
      />
    </PermissionGuard>
  )
}
