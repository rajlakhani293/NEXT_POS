"use client"

import { useRouter } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { promotions } from "@/lib/api/promotions"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "coupon__name", title: "Coupon" },
  { key: "customer__full_name", title: "Customer" },
  { key: "usage", title: "Usage" },
  { key: "limit_usage", title: "Limit" },
  { key: "user_username", title: "Author" },
  { key: "created_at", title: "Created On", render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function GeneratedCustomerCouponsPage() {
  const router = useRouter()
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
    itemsPerPage: 10,
  })

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Customer Coupons"
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
        onEdit={(record: any) => router.push(`/customers/coupons-generated/${record.id}`)}
        hideActions={!canUpdate}
      />
    </div>
  )
}
