"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const buildCouponColumns = (t: (key: string) => string) => [
  { key: "name", title: t("Name") },
  {
    key: "coupon_type",
    title: t("Type"),
    render: (value: string) => t(value || "Flat"),
  },
  { key: "code", title: t("Code") },
  { key: "coupon_discount_value", title: t("Value") },
  { key: "usage", title: t("Usage") },
  { key: "limit_usage", title: t("Limit") },
  { key: "user_username", title: t("Author") },
  { key: "created_at", title: t("Date") },
]

export default function CustomerCouponsHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const id = params.id as string
  const couponColumns = buildCouponColumns(t)
  const [coupons, setCoupons] = useState<any[]>([])
  const [totalCoupons, setTotalCoupons] = useState(0)
  const [couponsPage, setCouponsPage] = useState(1)

  const [getCustomerCouponsData, couponsState] = (
    promotions as any
  ).useGetCustomerCouponsDataMutation()

  useEffect(() => {
    const loadCoupons = async () => {
      const response = await getCustomerCouponsData({
        id,
        payLoad: { page: couponsPage, limit: 10 },
      }).unwrap()
      const data = response?.data || {}
      setCoupons(data.items || [])
      setTotalCoupons(data.total || 0)
    }
    loadCoupons()
  }, [couponsPage, getCustomerCouponsData, id])

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
              <h1 className="text-xl font-bold text-gray-900">{t("Customer Coupons List")}</h1>
              <p className="text-xs font-medium text-gray-500">
                {t("Display all customer coupons.")}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <DynamicTable
            data={coupons}
            columns={couponColumns}
            tableTitle={t("Customer Coupons List")}
            currentPage={couponsPage}
            itemsPerPage={10}
            totalItems={totalCoupons}
            onPageChange={setCouponsPage}
            isLoading={couponsState.isLoading}
            showEdit
            onEdit={(record: any) => router.push(`/promotions/coupons-generated/${record.id}`)}
            rowActions={(_rowId, record: any) => [
              {
                key: "usage-history",
                label: t("Usage History"),
                labelText: t("Usage History"),
                priority: 1,
                onClick: (event?: React.MouseEvent<HTMLButtonElement>) => {
                  event?.stopPropagation()
                  router.push(`/customers/${id}/coupons/${record.id}/history`)
                },
              },
            ]}
          />
        </div>
      </div>
    </DashboardPage>
  )
}
