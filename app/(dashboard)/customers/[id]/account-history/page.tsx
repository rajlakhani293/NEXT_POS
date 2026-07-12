"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
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

export default function CustomerAccountHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const columns = buildColumns(t)
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
    showToast.success(response?.message || t("Account history stored successfully."))
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
    <DashboardPage padding="none">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
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
              <h1 className="text-xl font-bold text-gray-900">
                {t("Customer Account History")}
              </h1>
              <p className="text-xs font-medium text-gray-500">
                {t("Display all customer accounts.")}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <DynamicTable
            data={rows}
            columns={columns}
            tableTitle={t("Customer Accounts List")}
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
                {t("Add a new customer account")}
              </Button>
            }
            hideActions
          />
        </div>

        <DynamicForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={t("Create a new customer account")}
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
              placeholder: t("Amount"),
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
              ],
            },
            {
              name: "description",
              label: t("Description"),
              placeholder: t("Description"),
            },
          ]}
          onSubmit={submitAdjustment}
        />
      </div>
    </DashboardPage>
  )
}
