"use client"

import { useRouter } from "next/navigation"
import { Clock, Play, Plus } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { accounting } from "@/lib/api/accounting"
import { PERMISSIONS } from "@/lib/permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "name", title: "Name" },
  { key: "type", title: "Type" },
  { key: "account__name", title: "Account Name" },
  { key: "value", title: "Value" },
  { key: "recurring", title: "Recurring", render: (value: any) => (value ? "Yes" : "No") },
  { key: "occurrence", title: "Occurrence" },
  { key: "user_username", title: "Author" },
  { key: "created_at", title: "Created At" },
]

export default function TransactionsPage() {
  const router = useRouter()
  const table = useTableData({
    getMaster: (accounting as any).useGetTransactionsDataMutation,
    itemsPerPage: 10,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.reports.view}>
      <DynamicTable
        data={table.orders}
        columns={columns}
        tableTitle="Transactions List"
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
            label: "History",
            labelText: "History",
            icon: <Clock className="size-4" />,
            onClick: () => router.push(`/accounting/transactions/history/${record.id}`),
          },
          {
            key: "trigger",
            label: "Trigger",
            labelText: "Trigger",
            icon: <Play className="size-4" />,
            onClick: () => router.push(`/accounting/transactions/history/${record.id}?trigger=1`),
          },
        ]}
        showDateRange
        secondaryActionButton={
          <Button onClick={() => router.push("/accounting/transactions/create")}>
            <Plus className="size-4" />
            Create Expense
          </Button>
        }
      />
    </PermissionGuard>
  )
}
