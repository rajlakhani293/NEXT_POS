"use client"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { accounting } from "@/lib/api/accounting"
import { PERMISSIONS } from "@/lib/permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "transaction__name", title: "Transaction" },
  { key: "account__name", title: "Account" },
  { key: "action_type", title: "Action" },
  { key: "amount", title: "Amount" },
  { key: "balance_before", title: "Before" },
  { key: "balance_after", title: "After" },
  { key: "source_type", title: "Source" },
]

export default function TransactionHistoryPage() {
  const table = useTableData({
    getMaster: (accounting as any).useGetTransactionHistoryDataMutation,
    itemsPerPage: 10,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.reports.view}>
      <DynamicTable
        data={table.orders}
        columns={columns}
        tableTitle="Transaction History"
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
        hideActions
        showDateRange
      />
    </PermissionGuard>
  )
}
