"use client"

import { useEffect, useState } from "react"
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

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDate: (value: any) => string
) => [
  { key: "sale_order__code", title: t("Sale No") },
  { key: "code", title: t("Code") },
  { key: "type", title: t("Type") },
  { key: "discount_value", title: t("Value") },
  {
    key: "discount_amount",
    title: t("Discount Applied"),
    render: (value: any) => formatMoney(value),
  },
  { key: "created_at", title: t("Date"), render: formatDate },
]

export default function CustomerCouponHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const customerId = params.id as string
  const couponId = params.couponId as string
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)
  const columns = buildColumns(t, formatMoney, formatDate)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)

  const [getCustomerCouponHistoryData, historyState] = (
    promotions as any
  ).useGetCustomerCouponHistoryDataMutation()

  useEffect(() => {
    const loadHistory = async () => {
      const response = await getCustomerCouponHistoryData({
        customerId,
        customerCouponId: couponId,
        payLoad: { page, limit: 10 },
      }).unwrap()
      const data = response?.data || {}
      setRows(data.items || [])
      setTotalItems(data.total || 0)
    }
    loadHistory()
  }, [couponId, customerId, getCustomerCouponHistoryData, page])

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
              onClick={() => router.push(`/customers/${customerId}/coupons`)}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t("Coupon Usage History")}</h1>
              <p className="text-xs font-medium text-gray-500">
                {t("Display all customer coupon histories.")}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <DynamicTable
            data={rows}
            columns={columns}
            tableTitle={t("Coupon Usage History")}
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
