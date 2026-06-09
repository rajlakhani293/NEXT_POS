"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { promotions } from "@/lib/api/promotions"

const couponColumns = [
  { key: "coupon__name", title: "Coupon" },
  { key: "code", title: "Issued Code" },
  { key: "issued_at", title: "Issued At" },
  { key: "expires_at", title: "Expires At" },
  { key: "usage_count", title: "Usage Count" },
  {
    key: "is_redeemed",
    title: "Redeemed",
    render: (value: boolean) => (value ? "Yes" : "No"),
  },
  { key: "redeemed_at", title: "Redeemed At" },
]

const historyColumns = [
  { key: "sale_order__code", title: "Sale No" },
  { key: "code", title: "Coupon Code" },
  { key: "type", title: "Type" },
  { key: "discount_value", title: "Value" },
  { key: "discount_amount", title: "Discount Applied" },
  { key: "created_at", title: "Used At" },
]

export default function CustomerCouponsHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
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
          Loading customer coupons...
        </div>
      </div>
    )
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
          <h1 className="text-xl font-bold text-gray-900">Customer Coupons</h1>
          <p className="text-sm font-medium text-gray-500">
            Issued coupons and usage history for this customer.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Issued Coupons</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{totalCoupons}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Selected Coupon</p>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {selectedCoupon?.code || "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Usage History</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{totalHistory}</p>
        </div>
      </div>

      <DynamicTable
        data={coupons}
        columns={couponColumns}
        tableTitle="Issued Customer Coupons"
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
            ? `Coupon Usage History · ${selectedCoupon.code}`
            : "Coupon Usage History"
        }
        currentPage={historyPage}
        itemsPerPage={10}
        totalItems={totalHistory}
        onPageChange={setHistoryPage}
        isLoading={historyState.isLoading}
        hideActions
      />
    </div>
  )
}
