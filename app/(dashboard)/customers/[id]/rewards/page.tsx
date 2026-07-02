"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { rewards } from "@/lib/api/rewards"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const buildBalanceColumns = (t: (key: string) => string) => [
  { key: "reward_system_name", title: t("Reward System") },
  { key: "points", title: t("Points") },
  { key: "lifetime_points", title: t("Lifetime Points") },
  { key: "target_points", title: t("Target") },
]

const buildRedemptionColumns = (t: (key: string) => string) => [
  { key: "reward_system__name", title: t("Reward System") },
  { key: "customer_coupon__code", title: t("Coupon") },
  { key: "points_redeemed", title: t("Points Redeemed") },
  { key: "note", title: t("Note") },
  { key: "created_at", title: t("Created") },
]

export default function CustomerRewardsHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const id = params.id as string
  const balanceColumns = buildBalanceColumns(t)
  const redemptionColumns = buildRedemptionColumns(t)
  const [tab, setTab] = useState<"balances" | "redemptions">("balances")
  const [balances, setBalances] = useState<any[]>([])
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)

  const [getCustomerRewardBalance, balanceState] = (
    rewards as any
  ).useGetCustomerRewardBalanceMutation()
  const [getCustomerRewardRedemptionsData, redemptionsState] = (
    rewards as any
  ).useGetCustomerRewardRedemptionsDataMutation()

  useEffect(() => {
    const loadBalances = async () => {
      const response = await getCustomerRewardBalance({ id }).unwrap()
      setBalances(response?.data || [])
    }
    loadBalances()
  }, [getCustomerRewardBalance, id])

  useEffect(() => {
    const loadRedemptions = async () => {
      const response = await getCustomerRewardRedemptionsData({
        page,
        limit: 10,
        filter: { customer_id: Number(id) },
      }).unwrap()
      const data = response?.data || {}
      setRedemptions(data.items || [])
      setTotalItems(data.total || 0)
    }
    loadRedemptions()
  }, [getCustomerRewardRedemptionsData, id, page])

  if (balanceState.isLoading && balances.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading reward history...")}
        </div>
      </div>
    )
  }

  const totalPoints = balances.reduce(
    (sum: number, item: any) => sum + Number(item.points || 0),
    0
  )

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
          <h1 className="text-xl font-bold text-gray-900">{t("Customer Rewards")}</h1>
          <p className="text-sm font-medium text-gray-500">
            {t("Reward balances and redeemed coupon history for this customer.")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{t("Reward Systems")}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{balances.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{t("Available Points")}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{totalPoints}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{t("Redemptions")}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{totalItems}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === "balances" ? "default" : "outline"}
          onClick={() => setTab("balances")}
        >
          {t("Balances")}
        </Button>
        <Button
          variant={tab === "redemptions" ? "default" : "outline"}
          onClick={() => setTab("redemptions")}
        >
          {t("Redemptions")}
        </Button>
      </div>

      {tab === "balances" ? (
        <DynamicTable
          data={balances}
          columns={balanceColumns}
          tableTitle={t("Reward Balances")}
          currentPage={1}
          itemsPerPage={balances.length || 10}
          totalItems={balances.length}
          showEdit
          onEdit={(record: any) => router.push(`/customers/${id}/rewards/edit/${record.id}`)}
        />
      ) : (
        <DynamicTable
          data={redemptions}
          columns={redemptionColumns}
          tableTitle={t("Reward Redemptions")}
          currentPage={page}
          itemsPerPage={10}
          totalItems={totalItems}
          onPageChange={setPage}
          isLoading={redemptionsState.isLoading}
          hideActions
        />
      )}
    </div>
  )
}
