"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { rewards } from "@/lib/api/rewards"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const buildColumns = (t: (key: string) => string, formatDate: (value: any) => string) => [
  { key: "name", title: t("Name") },
  { key: "target", title: t("Target") },
  { key: "coupon_name", title: t("Coupon") },
  { key: "user_username", title: t("User") },
  { key: "created_at", title: t("Created On"), render: (value: any) => formatDate(value) },
]

export default function RewardSystemsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const columns = buildColumns(t, (value) => formatBusinessDate(value, posOptions))
  const [deleteRewardSystem] = (rewards as any).useDeleteRewardSystemMutation()
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

  })

  const handleAdd = (open: boolean) => {
    if (open) router.push("/rewards-system/create")
  }

  const handleEdit = (record: any) => {
    router.push(`/rewards-system/${record.id}`)
  }

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      router.replace("/rewards-system/create")
    }
  }, [canCreate, router, searchParams])

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
        triggerRefresh={triggerRefresh}
        deleteModalTitle={t("Delete Reward System")}
        deleteModalDescription={t("Would you like to delete this ?")}
      />
    </div>
  )
}
