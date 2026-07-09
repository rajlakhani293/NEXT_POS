"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { rewards } from "@/lib/api/rewards"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { RewardSystemForm } from "./createUpdate"

const buildColumns = (t: (key: string) => string) => [
  { key: "name", title: t("Name") },
  { key: "target", title: t("Target") },
  { key: "coupon_name", title: t("Coupon") },
  { key: "user_username", title: t("User") },
  { key: "created_at", title: t("Created On"), render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function RewardSystemsPage() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const columns = buildColumns(t)
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
        tableTitle={t("Reward Systems")}
        title={canCreate ? t("Create Reward") : undefined}
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
        deleteModalTitle={t("Delete Reward System")}
        deleteModalDescription={t("Would you like to delete this ?")}
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
