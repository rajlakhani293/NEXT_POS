"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"

const buildCouponColumns = (t: (key: string) => string) => [
  { key: "coupon__name", title: t("Coupon") },
  { key: "code", title: t("Issued Code") },
  { key: "issued_at", title: t("Issued At") },
  { key: "expires_at", title: t("Expires At") },
  { key: "usage_count", title: t("Usage Count") },
  {
    key: "is_redeemed",
    title: t("Redeemed"),
    render: (value: boolean) => (value ? t("Yes") : t("No")),
  },
  { key: "redeemed_at", title: t("Redeemed At") },
]

const buildHistoryColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string
) => [
  { key: "sale_order__code", title: t("Sale No") },
  { key: "code", title: t("Coupon Code") },
  { key: "type", title: t("Type") },
  { key: "discount_value", title: t("Value") },
  { key: "discount_amount", title: t("Discount Applied"), render: (value: any) => formatMoney(value) },
  { key: "created_at", title: t("Used At") },
]

export default function CustomerCouponsHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const id = params.id as string
  const formatMoney = (value: any) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const couponColumns = buildCouponColumns(t)
  const historyColumns = buildHistoryColumns(t, formatMoney)
  const [coupons, setCoupons] = useState<any[]>([])
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)
  const [historyRows, setHistoryRows] = useState<any[]>([])
  const [totalCoupons, setTotalCoupons] = useState(0)
  const [totalHistory, setTotalHistory] = useState(0)
  const [couponsPage, setCouponsPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  const [getCustomerCouponsData, couponsState] = (
    promotions as any
  ).useGetCustomerCouponsDataMutation()
  const [getCustomerCouponHistoryData, historyState] = (
    promotions as any
  ).useGetCustomerCouponHistoryDataMutation()

  const loadCoupons = async (nextPage = couponsPage) => {
    const response = await getCustomerCouponsData({
      id,
      payLoad: { page: nextPage, limit: 10 },
    }).unwrap()
    const data = response?.data || {}
    const items = data.items || []
    setCoupons(items)
    setTotalCoupons(data.total || 0)
    if (!selectedCoupon && items.length) {
      setSelectedCoupon(items[0])
    }
  }

  const loadHistory = async (customerCouponId: number | string, nextPage = historyPage) => {
    const response = await getCustomerCouponHistoryData({
      customerId: id,
      customerCouponId,
      payLoad: { page: nextPage, limit: 10 },
    }).unwrap()
    const data = response?.data || {}
    setHistoryRows(data.items || [])
    setTotalHistory(data.total || 0)
  }

  useEffect(() => {
    loadCoupons(couponsPage)
  }, [couponsPage, id])

  useEffect(() => {
    if (selectedCoupon?.id) {
      loadHistory(selectedCoupon.id, historyPage)
    } else {
      setHistoryRows([])
      setTotalHistory(0)
    }
  }, [selectedCoupon?.id, historyPage, id])

  if (couponsState.isLoading && coupons.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading customer coupons...")}
        </div>
      </div>
    )
  }

  return (
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
            <h1 className="text-xl font-bold text-gray-900">{t("Customer Coupons")}</h1>
            <p className="text-xs font-medium text-gray-500">
              {t("Issued coupons and usage history for this customer.")}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{t("Issued Coupons")}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{totalCoupons}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{t("Selected Coupon")}</p>
            <p className="mt-3 text-lg font-bold text-slate-950">
              {selectedCoupon?.code || "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{t("Usage History")}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{totalHistory}</p>
          </div>
        </div>

        <DynamicTable
          data={coupons}
          columns={couponColumns}
          tableTitle={t("Issued Customer Coupons")}
          currentPage={couponsPage}
          itemsPerPage={10}
          totalItems={totalCoupons}
          onPageChange={setCouponsPage}
          isLoading={couponsState.isLoading}
          hideActions
          onRowClick={(row) => {
            setSelectedCoupon(row)
            setHistoryPage(1)
          }}
        />

        <DynamicTable
          data={historyRows}
          columns={historyColumns}
          tableTitle={
            selectedCoupon?.code
              ? `${t("Coupon Usage History")} - ${selectedCoupon.code}`
              : t("Coupon Usage History")
          }
          currentPage={historyPage}
          itemsPerPage={10}
          totalItems={totalHistory}
          onPageChange={setHistoryPage}
          isLoading={historyState.isLoading}
          hideActions
        />
      </div>
    </div>
  )
}
