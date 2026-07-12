"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { rewards } from "@/lib/api/rewards"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const buildColumns = (t: (key: string) => string) => [
  {
    key: "customer",
    title: t("Customer"),
    render: (_value: any, record: any) => {
      const row = record?.row || record
      return (
        row?.customer__full_name ||
        [row?.customer__first_name, row?.customer__last_name].filter(Boolean).join(" ") ||
        "-"
      )
    },
  },
  { key: "reward_name", title: t("Reward Name") },
  { key: "points", title: t("Points") },
  { key: "target", title: t("Target") },
  { key: "updated_at", title: t("Last Update") },
]

export default function CustomerRewardsHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const id = params.id as string
  const columns = buildColumns(t)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)

  const [getCustomerRewardBalancesData, rewardsState] = (
    rewards as any
  ).useGetCustomerRewardBalancesDataMutation()

  useEffect(() => {
    const loadRewards = async () => {
      const response = await getCustomerRewardBalancesData({
        page,
        limit: 10,
        filter: { customer_id: Number(id) },
      }).unwrap()
      const data = response?.data || {}
      setRows(data.items || [])
      setTotalItems(data.total || 0)
    }
    loadRewards()
  }, [getCustomerRewardBalancesData, id, page])

  if (rewardsState.isLoading && rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading customer rewards...")}
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
            <h1 className="text-xl font-bold text-gray-900">{t("Customer Rewards List")}</h1>
            <p className="text-xs font-medium text-gray-500">
              {t("Display all customer rewards.")}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
        <DynamicTable
          data={rows}
          columns={columns}
          tableTitle={t("Customer Rewards List")}
          currentPage={page}
          itemsPerPage={10}
          totalItems={totalItems}
          onPageChange={setPage}
          isLoading={rewardsState.isLoading}
          showEdit
          onEdit={(record: any) => router.push(`/customers/${id}/rewards/edit/${record.id}`)}
        />
      </div>
      </div>
    </DashboardPage>
  )
}
