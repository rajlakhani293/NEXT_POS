"use client"

import { useEffect, useMemo, useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import DynamicForm from "@/components/DynamicForm"
import { PermissionGuard } from "@/components/permission-guard"
import { expenses } from "@/lib/api/expenses"
import { payments } from "@/lib/api/payments"
import { registers } from "@/lib/api/registers"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { useTableData } from "@/hooks/useTableData"
import { usePermissions } from "@/hooks/use-permissions"

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
  const [formValues, setFormValues] = useState({
    category_id: "",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    payment_type: "cash-payment",
    shift_id: "",
    reference_number: "",
    note: "",
  })
  const [deleteExpense] = (expenses as any).useDeleteExpenseMutation()
  const [updateExpenseStatus] = (expenses as any).useUpdateExpenseStatusMutation()
  const [createExpense] = (expenses as any).useCreateExpenseMutation()
  const [editExpense] = (expenses as any).useEditExpenseMutation()
  const [getExpenseById] = (expenses as any).useGetExpenseByIdMutation()
  const [getExpenseCategoriesDropdown, categories] = (
    expenses as any
  ).useGetExpenseCategoriesDropdownMutation()
  const [getCurrentShift, currentShift] = (
    registers as any
  ).useGetCurrentShiftMutation()
  const [getPaymentTypesDropdown, paymentTypes] = (
    payments as any
  ).useGetPaymentTypesDropdownMutation()
  const { hasPermission } = usePermissions()
  const table = useTableData({
    getMaster: (expenses as any).useGetExpensesDataMutation,
    itemsPerPage: 10,
  })

  useEffect(() => {
    getExpenseCategoriesDropdown()
    getCurrentShift()
    getPaymentTypesDropdown()
  }, [getCurrentShift, getExpenseCategoriesDropdown, getPaymentTypesDropdown])

  const categoryOptions = useMemo(
    () =>
      (categories.data?.data || []).map((item: any) => ({
        label: item.name,
        value: item.id,
      })),
    [categories.data?.data]
  )

  const closeForm = () => {
    setIsFormOpen(false)
    setEditId(null)
    setFormValues({
      category_id: "",
      amount: "",
      expense_date: new Date().toISOString().slice(0, 10),
      payment_type: "cash-payment",
      shift_id: "",
      reference_number: "",
      note: "",
    })
  }

  const openCreate = () => {
    setEditId(null)
    setIsFormOpen(true)
  }

  const openEdit = async (record: any) => {
    setEditId(record.id)
    const response = await getExpenseById({ id: record.id }).unwrap()
    const data = response?.data || record
    setFormValues({
      category_id: data.category_id ? String(data.category_id) : "",
      amount: data.amount ? String(data.amount) : "",
      expense_date: data.expense_date || new Date().toISOString().slice(0, 10),
      payment_type: data.payment_type || "cash-payment",
      shift_id: data.shift_id ? String(data.shift_id) : "",
      reference_number: data.reference_number || "",
      note: data.note || "",
    })
    setIsFormOpen(true)
  }

  const submitExpense = async (values: any) => {
    const payLoad = {
      ...values,
      category_id: Number(values.category_id),
      shift_id: values.shift_id ? Number(values.shift_id) : undefined,
      amount: values.amount || "0",
    }
    const response = editId
      ? await editExpense({ id: editId, payLoad }).unwrap()
      : await createExpense(payLoad).unwrap()
    showToast.success(response?.message || "Expense saved successfully.")
    closeForm()
    table.triggerRefresh()
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

        <DynamicForm
          isOpen={isFormOpen}
          onClose={closeForm}
          title={editId ? "Edit Expense" : "Create Expense"}
          initialValues={formValues}
          fields={[
            {
              name: "category_id",
              label: "Category",
              type: "select",
              options: categoryOptions,
              placeholder: "Select category",
              required: true,
            },
            {
              name: "amount",
              label: "Amount",
              type: "number",
              placeholder: "Enter amount",
              required: true,
              prefix: "₹",
            },
            {
              name: "expense_date",
              label: "Expense Date",
              type: "date",
              required: true,
            },
            {
              name: "payment_type",
              label: "Payment Type",
              type: "select",
              required: true,
              options: paymentTypes.data?.data || [],
            },
            {
              name: "shift_id",
              label: "Cashier Shift",
              type: "select",
              allowClear: true,
              placeholder: "Use current open shift",
              options: currentShift.data?.data
                ? [
                    {
                      label: `${currentShift.data.data.register_name || "Current Shift"} (${currentShift.data.data.shift_status})`,
                      value: currentShift.data.data.id,
                    },
                  ]
                : [],
            },
            {
              name: "reference_number",
              label: "Reference Number",
              placeholder: "Enter reference number",
            },
            { name: "note", label: "Note", type: "textarea", placeholder: "Enter note" },
          ]}
          onSubmit={submitExpense}
        />
      </>
    </PermissionGuard>
  )
}
