"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customer_id") || ""
  const customerName = searchParams.get("customer_name") || ""
  const lastLedgerRequestRef = useRef("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [getCustomerCreditLedger, ledgerState] = (customers as any).useGetCustomerCreditLedgerMutation()
  const [adjustCustomerCredit] = (
    customers as any
  ).useAdjustCustomerCreditMutation()

  const loadLedger = async (
    targetCustomerId = customerId,
    nextPage = page,
    search = searchTerm,
    force = false
  ) => {
    if (!targetCustomerId) {
      setRows([])
      setTotalItems(0)
      return
    }

    const requestKey = `${targetCustomerId}:${nextPage}:${search}`
    if (!force && lastLedgerRequestRef.current === requestKey) return
    lastLedgerRequestRef.current = requestKey

    const response = await getCustomerCreditLedger({
      id: targetCustomerId,
      payLoad: { page: nextPage, limit: 10, search },
    }).unwrap()
    const data = response?.data || {}
    setRows(data.items || [])
    setTotalItems(data.total || 0)
  }

  useEffect(() => {
    loadLedger(customerId, page, searchTerm)
  }, [customerId, page, searchTerm])

  const submitAdjustment = async (values: any) => {
    const response = await adjustCustomerCredit({
      id: customerId,
      payLoad: {
        amount: values.amount,
        direction: values.direction,
        reason: values.reason,
        note: values.note || "",
      },
    }).unwrap()
    showToast.success(response?.message || "Credit adjusted successfully.")
    setIsFormOpen(false)
    await loadLedger(customerId, 1, searchTerm, true)
  }

  const handleFilterChange = (action: string, payload?: any) => {
    if (action === "search") {
      setPage(1)
      setSearchTerm(String(payload || ""))
    }
  }

  if (!customerId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold">Customer Credit</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Please open credit history from a customer row.
          </p>
          <Button className="mt-4" onClick={() => router.push("/customers")}>
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Customer Credit</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {customerName
              ? `Adjust credit and view ledger for ${customerName}.`
              : "Adjust customer credit and view ledger."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push("/customers")}>
            Back to Customers
          </Button>
        </div>
      </div> */}

      <DynamicTable
        data={rows}
        columns={columns}
        tableTitle="Credit Ledger"
        showSearch
        searchTerm={searchTerm}
        onFilterChange={handleFilterChange}
        currentPage={page}
        itemsPerPage={10}
        totalItems={totalItems}
        onPageChange={setPage}
        isLoading={ledgerState.isLoading}
        secondaryActionButton={
          <Button disabled={!customerId} onClick={() => setIsFormOpen(true)}>
            Adjust Credit
          </Button>
        }
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
