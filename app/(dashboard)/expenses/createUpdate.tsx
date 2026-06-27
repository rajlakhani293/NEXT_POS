"use client"

import { useEffect, useMemo, useState } from "react"

import DynamicForm from "@/components/DynamicForm"
import { expenses } from "@/lib/api/expenses"
import { payments } from "@/lib/api/payments"
import { showToast } from "@/lib/toast"

const getInitialValues = () => ({
  name: "",
  category_id: "",
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  payment_type: "cash-payment",
  shift_id: "",
  reference_number: "",
  note: "",
})

type ExpenseFormProps = {
  isOpen: boolean
  editId?: number | string | null
  currentShift?: any
  onClose: () => void
  onSuccess?: () => void
}

export function ExpenseForm({
  isOpen,
  editId,
  currentShift,
  onClose,
  onSuccess,
}: ExpenseFormProps) {
  const [formValues, setFormValues] = useState(getInitialValues)
  const [createExpense] = (expenses as any).useCreateExpenseMutation()
  const [editExpense] = (expenses as any).useEditExpenseMutation()
  const [getExpenseById, expense] = (expenses as any).useGetExpenseByIdMutation()
  const [getExpenseCategoriesDropdown, categories] =
    (expenses as any).useGetExpenseCategoriesDropdownMutation()
  const [getPaymentTypesDropdown, paymentTypes] =
    (payments as any).useGetPaymentTypesDropdownMutation()

  useEffect(() => {
    if (!isOpen) return

    setFormValues(getInitialValues())
    void getExpenseCategoriesDropdown()
    void getPaymentTypesDropdown()

    if (!editId) return

    void getExpenseById({ id: editId })
      .unwrap()
      .then((response: any) => {
        const data = response?.data
        if (!data) return

        setFormValues({
          name: data.name || "",
          category_id: data.category_id ? String(data.category_id) : "",
          amount: data.amount ? String(data.amount) : "",
          expense_date:
            data.expense_date || new Date().toISOString().slice(0, 10),
          payment_type: data.payment_type || "cash-payment",
          shift_id: data.shift_id ? String(data.shift_id) : "",
          reference_number: data.reference_number || "",
          note: data.note || "",
        })
      })
  }, [
    editId,
    getExpenseById,
    getExpenseCategoriesDropdown,
    getPaymentTypesDropdown,
    isOpen,
  ])

  const categoryOptions = useMemo(
    () =>
      (categories.data?.data || []).map((item: any) => ({
        label: item.name,
        value: item.id,
      })),
    [categories.data?.data]
  )

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
    onClose()
    onSuccess?.()
  }

  return (
    <DynamicForm
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? "Edit Expense" : "Create Expense"}
      initialValues={formValues}
      isLoading={Boolean(editId && expense.isLoading)}
      fields={[
        {
          name: "name",
          label: "Name",
          type: "text",
          placeholder: "Enter expense name (optional)",
        },
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
          options: currentShift
            ? [
                {
                  label: `${currentShift.register_name || "Current Shift"} (${currentShift.shift_status})`,
                  value: currentShift.id,
                },
              ]
            : [],
        },
        {
          name: "reference_number",
          label: "Reference Number",
          placeholder: "Enter reference number",
        },
        {
          name: "note",
          label: "Note",
          type: "textarea",
          placeholder: "Enter note",
        },
      ]}
      onSubmit={submitExpense}
    />
  )
}
