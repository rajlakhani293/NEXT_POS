"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ReceiptText } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const buildColumns = (t: (key: string) => string) => [
  { key: "name", title: t("Name") },
  { key: "invoice_reference", title: t("Invoice") },
  { key: "payment_status", title: t("Payment") },
  { key: "delivery_status", title: t("Delivery") },
  { key: "total_items", title: t("Items") },
  { key: "value", title: t("Value"), render: (value: any) => formatMoney(value) },
  { key: "created_at", title: t("Created At"), render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function ProviderProcurementsPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const columns = buildColumns(t)
  const id = params.id as string
  const lastRequestRef = useRef("")
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [getProviderProcurements, procurementsState] = (
    purchases as any
  ).useGetProviderProcurementsMutation()

  const loadRows = async (nextPage = page, search = searchTerm, force = false) => {
    if (!id) return
    const requestKey = `${id}:${nextPage}:${search}`
    if (!force && lastRequestRef.current === requestKey) return
    lastRequestRef.current = requestKey

    const response = await getProviderProcurements({
      id,
      payLoad: { page: nextPage, limit: 10, search },
    }).unwrap()
    const data = response?.data || {}
    setRows(data.items || [])
    setTotalItems(data.total || 0)
  }

  useEffect(() => {
    loadRows(page, searchTerm)
  }, [id, page, searchTerm])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push("/providers")}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">{t("Provider Procurements")}</h1>
      </div>
      <DynamicTable
        data={rows}
        columns={columns}
        tableTitle={t("Provider Procurements")}
        showSearch
        searchTerm={searchTerm}
        onFilterChange={(action, payload) => {
          if (action === "search") {
            setPage(1)
            setSearchTerm(String(payload || ""))
          }
        }}
        currentPage={page}
        itemsPerPage={10}
        totalItems={totalItems}
        onPageChange={setPage}
        isLoading={procurementsState.isLoading}
        rowActions={(_, record) => [
          {
            key: "receipt",
            label: t("View"),
            labelText: t("View"),
            icon: <ReceiptText className="size-4" />,
            onClick: () => router.push(`/purchases/orders/${record.id}`),
          },
        ]}
      />
    </div>
  )
}
