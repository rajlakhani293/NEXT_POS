"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import DynamicForm from "@/components/DynamicForm"
import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"

const buildColumns = (t: (key: string) => string) => [
  { key: "operation", title: t("Operation") },
  { key: "previous_amount", title: t("Before") },
  { key: "amount", title: t("Amount") },
  { key: "next_amount", title: t("After") },
  { key: "description", title: t("Description") },
  { key: "created_at", title: t("Created") },
]

export default function CustomerCreditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const columns = buildColumns(t)
  const customerId = searchParams.get("customer_id") || ""
  const customerName = searchParams.get("customer_name") || ""
  const lastLedgerRequestRef = useRef("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [getCustomerAccountHistory, ledgerState] = (customers as any).useGetCustomerAccountHistoryMutation()
  const [recordCustomerAccountHistory] = (
    customers as any
  ).useRecordCustomerAccountHistoryMutation()

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

    const response = await getCustomerAccountHistory({
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
    showToast.success(response?.message || t("Account history stored successfully."))
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
          <h1 className="text-xl font-bold">{t("Customer Credit")}</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {t("Please open credit history from a customer row.")}
          </p>
          <Button className="mt-4" onClick={() => router.push("/customers")}>
            {t("Back to Customers")}
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
        tableTitle={t("Account History")}
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
            {t("Add History")}
          </Button>
        }
        hideActions
      />

      <DynamicForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t("Customer Account History")}
        initialValues={{
          amount: "",
          operation: "add",
          description: "",
        }}
        fields={[
          {
            name: "amount",
            label: t("Amount"),
            type: "number",
            placeholder: t("Enter amount"),
            required: true,
            prefix: posOptions.currency_symbol,
          },
          {
            name: "operation",
            label: t("Operation"),
            type: "radio",
            required: true,
            options: [
              { label: t("Add"), value: "add" },
              { label: t("Deduct"), value: "deduct" },
              { label: t("Refund"), value: "refund" },
              { label: t("Payment"), value: "payment" },
            ],
          },
          {
            name: "description",
            label: t("Description"),
            placeholder: t("Enter description"),
            required: true,
          },
        ]}
        onSubmit={submitAdjustment}
      />
    </div>
  )
}
