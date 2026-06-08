"use client"

import { useEffect, useMemo, useState } from "react"

import DynamicForm from "@/components/DynamicForm"
import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { customers } from "@/lib/api/customers"
import { showToast } from "@/lib/toast"

const columns = [
  { key: "amount", title: "Amount" },
  { key: "direction", title: "Direction" },
  { key: "balance_after", title: "Balance After" },
  { key: "reason", title: "Reason" },
  { key: "reference_type", title: "Reference Type" },
  { key: "created_at", title: "Created" },
]

export default function CustomerCreditPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [getCustomersDropdown, customersDropdown] = (
    customers as any
  ).useGetCustomersDropdownMutation()
  const [getCustomerCreditLedger, ledgerState] = (
    customers as any
  ).useGetCustomerCreditLedgerMutation()
  const [adjustCustomerCredit] = (
    customers as any
  ).useAdjustCustomerCreditMutation()

  useEffect(() => {
    getCustomersDropdown()
  }, [getCustomersDropdown])

  const customerOptions = useMemo(
    () =>
      (customersDropdown.data?.data || []).map((item: any) => ({
        label: item.name || item.phone,
        value: item.id,
      })),
    [customersDropdown.data?.data]
  )

  const loadLedger = async (customerId = selectedCustomerId, nextPage = page) => {
    if (!customerId) {
      setRows([])
      setTotalItems(0)
      return
    }
    const response = await getCustomerCreditLedger({
      id: customerId,
      payLoad: { page: nextPage, limit: 10 },
    }).unwrap()
    const data = response?.data || {}
    setRows(data.items || [])
    setTotalItems(data.total || 0)
  }

  useEffect(() => {
    loadLedger(selectedCustomerId, page)
  }, [selectedCustomerId, page])

  const submitAdjustment = async (values: any) => {
    const response = await adjustCustomerCredit({
      id: selectedCustomerId,
      payLoad: {
        amount: values.amount,
        direction: values.direction,
        reason: values.reason,
        note: values.note || "",
      },
    }).unwrap()
    showToast.success(response?.message || "Credit adjusted successfully.")
    setIsFormOpen(false)
    await loadLedger(selectedCustomerId, 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Customer Credit</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Adjust customer credit and view ledger.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-md border px-3 text-sm font-semibold"
            value={selectedCustomerId}
            onChange={(event) => {
              setPage(1)
              setSelectedCustomerId(event.target.value)
            }}
          >
            <option value="">Select customer</option>
            {customerOptions.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            disabled={!selectedCustomerId}
            onClick={() => setIsFormOpen(true)}
          >
            Adjust Credit
          </Button>
        </div>
      </div>

      <DynamicTable
        data={rows}
        columns={columns}
        tableTitle="Credit Ledger"
        currentPage={page}
        itemsPerPage={10}
        totalItems={totalItems}
        onPageChange={setPage}
        isLoading={ledgerState.isLoading}
        hideActions
      />

      <DynamicForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Adjust Customer Credit"
        initialValues={{
          amount: "",
          direction: "credit",
          reason: "manual_adjustment",
          note: "",
        }}
        fields={[
          {
            name: "amount",
            label: "Amount",
            type: "number",
            placeholder: "Enter amount",
            required: true,
            prefix: "₹",
          },
          {
            name: "direction",
            label: "Direction",
            type: "radio",
            required: true,
            options: [
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ],
          },
          {
            name: "reason",
            label: "Reason",
            placeholder: "Enter reason",
            required: true,
          },
          { name: "note", label: "Note", type: "textarea", placeholder: "Enter note" },
        ]}
        onSubmit={submitAdjustment}
      />
    </div>
  )
}
