"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDate: (value: any) => string
) => [
  { key: "name", title: t("Name") },
  { key: "purchase_price", title: t("Purchase Price"), render: (value: any) => formatMoney(value) },
  { key: "quantity", title: t("Quantity") },
  { key: "tax_group_name", title: t("Tax Group") },
  { key: "barcode", title: t("Barcode") },
  { key: "expiration_date", title: t("Expiration Date"), render: formatDate },
  { key: "tax_type", title: t("Tax Type") },
  { key: "tax_value", title: t("Tax Value"), render: (value: any) => formatMoney(value) },
  { key: "total_purchase_price", title: t("Total Price"), render: (value: any) => formatMoney(value) },
]

export default function ProviderProductsPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)
  const columns = buildColumns(t, formatMoney, formatDate)
  const id = params.id as string
  const lastRequestRef = useRef("")
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [getProviderProducts, productsState] = (
    purchases as any
  ).useGetProviderProductsMutation()

  const loadRows = async (nextPage = page, search = searchTerm, force = false) => {
    if (!id) return
    const requestKey = `${id}:${nextPage}:${search}`
    if (!force && lastRequestRef.current === requestKey) return
    lastRequestRef.current = requestKey

    const response = await getProviderProducts({
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
    <DashboardPage padding="none">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.push("/providers")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t("Provider Products")}
              </h1>
              <p className="text-xs font-medium text-gray-500">
                {t("List of all products supplied by this provider.")}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <DynamicTable
            data={rows}
            columns={columns}
            tableTitle={t("Provider Products List")}
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
            isLoading={productsState.isLoading}
            hideActions
          />
        </div>
      </div>
    </DashboardPage>
  )
}
