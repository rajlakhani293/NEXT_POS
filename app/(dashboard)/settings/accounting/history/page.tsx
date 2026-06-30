"use client"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { useTableData } from "@/hooks/useTableData"
import { accounting } from "@/lib/api/accounting"
import { PERMISSIONS } from "@/lib/permissions"

const columns = [
  { key: "name", title: "Name" },
  { key: "category_identifier", title: "Main Account" },
  { key: "account_name", title: "Sub Account" },
  { key: "operation", title: "Operation" },
  {
    key: "value",
    title: "Value",
    render: (val: any) => `₹${Number(val || 0).toFixed(2)}`,
  },
  { key: "user_username", title: "Author" },
  {
    key: "created_at",
    title: "Triggered On",
    render: (val: any) => (val ? new Date(val).toLocaleDateString() : "-"),
  },
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
        tableTitle="Transactions History List"
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
