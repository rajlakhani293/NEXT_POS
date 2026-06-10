"use client"

import { useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { rewards } from "@/lib/api/rewards"
import { useTableData } from "@/hooks/useTableData"

const balanceColumns = [
  { key: "customer__name", title: "Customer" },
  { key: "reward_system__name", title: "Reward System" },
  { key: "points", title: "Points" },
  { key: "lifetime_points", title: "Lifetime Points" },
  { key: "target_points", title: "Target" },
]

const redemptionColumns = [
  { key: "customer__name", title: "Customer" },
  { key: "reward_system__name", title: "Reward System" },
  { key: "customer_coupon__code", title: "Coupon" },
  { key: "points_redeemed", title: "Points Redeemed" },
  { key: "note", title: "Note" },
  { key: "created_at", title: "Created" },
]

export default function RewardBalancesPage() {
  const [tab, setTab] = useState<"balances" | "redemptions">("balances")
  const balances = useTableData({
    getMaster: (rewards as any).useGetCustomerRewardBalancesDataMutation,
    itemsPerPage: 10,
    enabled: tab === "balances",
  })
  const redemptions = useTableData({
    getMaster: (rewards as any).useGetCustomerRewardRedemptionsDataMutation,
    itemsPerPage: 10,
    enabled: tab === "redemptions",
  })

  const table = tab === "balances" ? balances : redemptions

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reward Customer History</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Customer reward points and redeemed coupon history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === "balances" ? "default" : "outline"}
            onClick={() => setTab("balances")}
          >
            Balances
          </Button>
          <Button
            variant={tab === "redemptions" ? "default" : "outline"}
            onClick={() => setTab("redemptions")}
          >
            Redemptions
          </Button>
        </div>
      </div>

      <DynamicTable
        data={table.orders}
        columns={tab === "balances" ? balanceColumns : redemptionColumns}
        tableTitle={tab === "balances" ? "Reward Balances" : "Reward Redemptions"}
        showSearch
        searchTerm={table.searchTerm}
        currentPage={table.currentPage}
        itemsPerPage={table.itemsPerPage}
        totalItems={table.totalItems}
        onPageChange={table.setCurrentPage}
        onFilterChange={table.handleFilterChange}
        sortConfig={table.sortConfig}
        onSort={table.handleSort}
        sortableFields={table.sortableFields}
        isLoading={table.isLoading}
        hideActions
      />
    </div>
  )
}
