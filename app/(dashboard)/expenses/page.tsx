"use client"

import { useEffect, useRef, useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { expenses } from "@/lib/api/expenses"
import { registers } from "@/lib/api/registers"
import { PERMISSIONS } from "@/lib/permissions"
import { useTableData } from "@/hooks/useTableData"
import { usePermissions } from "@/hooks/use-permissions"
import { ExpenseForm } from "./createUpdate"

const columns = [
  { key: "category__name", title: "Category" },
  { key: "amount", title: "Amount" },
  { key: "expense_date", title: "Date" },
  { key: "payment_type", title: "Payment" },
  { key: "shift__register__name", title: "Register" },
  { key: "shift__shift_status", title: "Shift Status" },
  { key: "reference_number", title: "Reference" },
  { key: "note", title: "Note" },
]

export default function ExpensesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [deleteExpense] = (expenses as any).useDeleteExpenseMutation()
  const [updateExpenseStatus] = (expenses as any).useUpdateExpenseStatusMutation()
  const [getCurrentShift, currentShift] = (registers as any).useGetCurrentShiftMutation()
  const { hasPermission } = usePermissions()
  const table = useTableData({
    getMaster: (expenses as any).useGetExpensesDataMutation,
    itemsPerPage: 10,
  })

  const isCalledRef = useRef(false)

  useEffect(() => {
    if (isCalledRef.current) return
    isCalledRef.current = true
    getCurrentShift()
  }, [getCurrentShift])

  const closeForm = () => {
    setIsFormOpen(false)
    setEditId(null)
  }

  const openCreate = () => {
    setEditId(null)
    setIsFormOpen(true)
  }

  const openEdit = (record: any) => {
    setEditId(record.id)
    setIsFormOpen(true)
  }

  return (
    <PermissionGuard permission={PERMISSIONS.expenses.view}>
      <>
        {currentShift.data?.data ? (
          <div className="mb-4 rounded-lg border bg-white p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              Current Shift
            </p>
            <h2 className="text-lg font-bold">
              {currentShift.data.data.register_name || "Register"} · Expected Cash ₹
              {currentShift.data.data.expected_cash || 0}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If you record an expense with `Cash` and assign this shift, expected cash will reduce automatically.
            </p>
          </div>
        ) : null}

        <DynamicTable
          data={table.orders}
          columns={columns}
          tableTitle="Expenses"
          title={hasPermission(PERMISSIONS.expenses.create) ? "Add Expense" : undefined}
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
          setAddEntityOpen={
            hasPermission(PERMISSIONS.expenses.create) ? openCreate : undefined
          }
          showEdit={hasPermission(PERMISSIONS.expenses.update)}
          onEdit={openEdit}
          showDelete={hasPermission(PERMISSIONS.expenses.delete)}
          deleteMutation={deleteExpense}
          showStatus={hasPermission(PERMISSIONS.expenses.update)}
          statusChangeMutation={({ ids, status }: any) =>
            updateExpenseStatus({ payLoad: { ids, status } })
          }
          triggerRefresh={table.triggerRefresh}
          deleteModalTitle="Delete Expense"
          deleteModalDescription="Are you sure you want to delete this expense?"
        />

        <ExpenseForm
          isOpen={isFormOpen}
          editId={editId}
          currentShift={currentShift.data?.data}
          onClose={closeForm}
          onSuccess={table.triggerRefresh}
        />
      </>
    </PermissionGuard>
  )
}
