"use client"

import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"

const buildColumns = (t: (key: string) => string, formatDate: (value: any) => string) => [
  { key: "name", title: t("Name") },
  { key: "code", title: t("Code") },
  { key: "coupon__name", title: t("Coupon") },
  { key: "customer__full_name", title: t("Customer") },
  { key: "usage", title: t("Usage") },
  { key: "limit_usage", title: t("Limit") },
  { key: "user_username", title: t("User") },
  {
    key: "created_at",
    title: t("Created On"),
    render: formatDate,
  },
]

export default function GeneratedCustomerCouponsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const columns = buildColumns(t, (value) => formatBusinessDate(value, posOptions))
  const { hasPermission } = usePermissions()
  const canUpdate = hasPermission(PERMISSIONS.promotions.update)

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
  } = useTableData({
    getMaster: (promotions as any).useGetGeneratedCustomerCouponsDataMutation,

  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle={t("Customer Coupons")}
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
        showEdit={canUpdate}
        onEdit={(record: any) => router.push(`/promotions/coupons-generated/${record.id}`)}
        hideActions={!canUpdate}
      />
    </div>
  )
}
