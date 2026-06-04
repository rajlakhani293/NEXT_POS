"use client"

import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { rewards } from "@/lib/api/rewards"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "target", title: "Target" },
  { key: "rule_summary", title: "Earn Rule" },
  { key: "description", title: "Description" },
]

export default function RewardSystemsPage() {
  const router = useRouter()
  const [deleteRewardSystem] = (rewards as any).useDeleteRewardSystemMutation()
  const [updateRewardSystemStatus] = (
    rewards as any
  ).useUpdateRewardSystemStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.rewards.create)
  const canUpdate = hasPermission(PERMISSIONS.rewards.update)
  const canDelete = hasPermission(PERMISSIONS.rewards.delete)

  const {
    orders,
    totalItems,
    isLoading,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    sortableFields,
    handleFilterChange,
    searchTerm,
    itemsPerPage,
    triggerRefresh,
  } = useTableData({
    getMaster: (rewards as any).useGetRewardSystemsDataMutation,
    itemsPerPage: 10,
  })

  const handleAdd = (open: boolean) => {
    if (open) router.push("/settings/rewards/create")
  }

  const handleEdit = (record: any) => {
    router.push(`/settings/rewards/${record.id}`)
  }

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Reward Systems"
        title={canCreate ? "Add Reward" : undefined}
        showSearch
        searchTerm={searchTerm}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onFilterChange={handleFilterChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        sortableFields={sortableFields}
        isLoading={isLoading}
        setAddEntityOpen={canCreate ? handleAdd : undefined}
        showEdit={canUpdate}
        onEdit={handleEdit}
        showDelete={canDelete}
        deleteMutation={deleteRewardSystem}
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateRewardSystemStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Reward System"
        deleteModalDescription="Are you sure you want to delete this reward system?"
      />

    </div>
  )
}
