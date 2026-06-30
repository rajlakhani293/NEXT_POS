"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { rewards } from "@/lib/api/rewards"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { RewardSystemForm } from "./createUpdate"

const columns = [
  { key: "name", title: "Name" },
  { key: "target", title: "Target" },
  { key: "coupon_name", title: "Coupon" },
  { key: "user_username", title: "Author" },
  { key: "created_at", title: "Created On", render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function RewardSystemsPage() {
  const searchParams = useSearchParams()
  const [formState, setFormState] = useState<{
    isOpen: boolean
    editId?: number | string | null
  }>({ isOpen: false, editId: null })
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
    if (open) setFormState({ isOpen: true, editId: null })
  }

  const handleEdit = (record: any) => {
    setFormState({ isOpen: true, editId: record.id })
  }

  const closeForm = () => {
    setFormState({ isOpen: false, editId: null })
  }

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setFormState({ isOpen: true, editId: null })
    }
  }, [canCreate, searchParams])

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Reward Systems"
        title={canCreate ? "Create Reward" : undefined}
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
        deleteModalDescription="Would you like to delete this ?"
      />
      <RewardSystemForm
        isOpen={formState.isOpen}
        editId={formState.editId}
        onClose={closeForm}
        onSuccess={triggerRefresh}
      />
    </div>
  )
}
