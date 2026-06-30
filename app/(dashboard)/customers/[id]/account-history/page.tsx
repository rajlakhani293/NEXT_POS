"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { customers } from "@/lib/api/customers"
import { showToast } from "@/lib/toast"

const columns = [
  { key: "operation", title: "Operation" },
  { key: "previous_amount", title: "Before" },
  { key: "amount", title: "Amount" },
  { key: "next_amount", title: "After" },
  { key: "description", title: "Description" },
  { key: "created_at", title: "Created" },
]

export default function CustomerAccountHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const lastLedgerRequestRef = useRef("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [getCustomerAccountHistory, ledgerState] = (
    customers as any
  ).useGetCustomerAccountHistoryMutation()
  const [recordCustomerAccountHistory] = (
    customers as any
  ).useRecordCustomerAccountHistoryMutation()

  const loadLedger = async (
    nextPage = page,
    search = searchTerm,
    force = false
  ) => {
    if (!customerId) return

    const requestKey = `${customerId}:${nextPage}:${search}`
    if (!force && lastLedgerRequestRef.current === requestKey) return
    lastLedgerRequestRef.current = requestKey

    const response = await getCustomerAccountHistory({
      id: customerId,
      payLoad: { page: nextPage, limit: 10, search },
    }).unwrap()
    const data = response?.data || {}
    setRows(data.items || [])
    setTotalItems(data.total || 0)
  }

  useEffect(() => {
    loadLedger(page, searchTerm)
  }, [customerId, page, searchTerm])

  const submitAdjustment = async (values: any) => {
    const response = await recordCustomerAccountHistory({
      id: customerId,
      payLoad: {
        general: {
          operation: values.operation,
          amount: values.amount,
          description: values.description || "",
        },
      },
    }).unwrap()
    showToast.success(response?.message || "Account history stored successfully.")
    setIsFormOpen(false)
    await loadLedger(1, searchTerm, true)
  }

  const handleFilterChange = (action: string, payload?: any) => {
    if (action === "search") {
      setPage(1)
      setSearchTerm(String(payload || ""))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.push("/customers")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Accounts List</h1>
          <p className="text-sm font-medium text-gray-500">
            Display all customer accounts.
          </p>
        </div>
      </div>

      <DynamicTable
        data={rows}
        columns={columns}
        tableTitle="Customer Accounts List"
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
            Add a new customer account
          </Button>
        }
        hideActions
      />

      <DynamicForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Create a new customer account"
        initialValues={{
          amount: "",
          operation: "add",
          description: "",
        }}
        fields={[
          {
            name: "amount",
            label: "Amount",
            type: "number",
            placeholder: "Amount",
            required: true,
            prefix: "₹",
          },
          {
            name: "operation",
            label: "Operation",
            type: "radio",
            required: true,
            options: [
              { label: "Add", value: "add" },
              { label: "Deduct", value: "deduct" },
              { label: "Refund", value: "refund" },
              { label: "Payment", value: "payment" },
            ],
          },
          {
            name: "description",
            label: "Description",
            placeholder: "Description",
            required: true,
          },
        ]}
        onSubmit={submitAdjustment}
      />
    </div>
  )
}
