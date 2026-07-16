"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { useDebounce } from "@/hooks/useDebounce"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDate: (value: any) => string
) => [
    { key: "name", title: t("Name") },
    { key: "code", title: t("Code") },
    { key: "customer_name", title: t("Customer") },
    { key: "order_code", title: t("Order") },
    {
      key: "type",
      title: t("Type"),
      render: (value: any) =>
        value === "percentage_discount"
          ? t("Percentage Discount")
          : value === "flat_discount"
            ? t("Flat Discount")
            : value || "N/A",
    },
    { key: "discount_value", title: t("Discount") },
    {
      key: "discount_amount",
      title: t("Value"),
      render: (value: any) => formatMoney(value),
    },
    { key: "user_username", title: t("Author") },
    {
      key: "created_at",
      title: t("Created At"),
      render: (value: any) => formatDate(value),
    },
  ]

export default function CouponOrderHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const couponId = params.id as string
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const columns = buildColumns(t, formatMoney, (value) => formatBusinessDate(value, posOptions))
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const debouncedSearch = useDebounce(searchTerm, 400)

  const [getCouponOrderHistoryData, historyState] = (
    promotions as any
  ).useGetCouponOrderHistoryDataMutation()

  const lastLoadedRef = useRef<{ couponId: string | null; page: number; search: string } | null>(null)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    if (!couponId) return
    if (
      lastLoadedRef.current?.couponId === couponId &&
      lastLoadedRef.current?.page === page &&
      lastLoadedRef.current?.search === debouncedSearch
    ) {
      return
    }
    lastLoadedRef.current = { couponId, page, search: debouncedSearch }

    const loadHistory = async () => {
      const response = await getCouponOrderHistoryData({
        id: couponId,
        payLoad: { page, search: debouncedSearch },
      }).unwrap()
      const data = response?.data || {}
      setRows(data.items || [])
      setTotalItems(data.total || 0)
    }
    loadHistory()
  }, [couponId, getCouponOrderHistoryData, page, debouncedSearch])

  if (historyState.isLoading && rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading coupon history...")}
        </div>
      </div>
    )
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
              onClick={() => router.push("/coupons")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t("Coupon Order Histories List")}</h1>
              <p className="text-xs font-medium text-gray-500">
                {t("Display all coupon order histories.")}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <DynamicTable
            data={rows}
            columns={columns}
            tableTitle={t("Coupon Order Histories List")}
            showSearch
            searchTerm={searchTerm}
            onFilterChange={(action, value) => {
              if (action === "search") setSearchTerm(value || "")
            }}
            currentPage={page}
            itemsPerPage={10}
            totalItems={totalItems}
            onPageChange={setPage}
            isLoading={historyState.isLoading}
            hideActions
          />
        </div>
      </div>
    </DashboardPage>
  )
}
