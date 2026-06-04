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
  { key: "type", title: "Type" },
  { key: "discount_value", title: "Value" },
  { key: "minimum_cart_value", title: "Min Cart" },
  { key: "maximum_cart_value", title: "Max Cart" },
  { key: "limit_usage", title: "Usage Limit" },
  { key: "target_summary", title: "Customer Target" },
]

export default function CouponsPage() {
  const router = useRouter()
  const [deleteCoupon] = (promotions as any).useDeleteCouponMutation()
  const [updateCouponStatus] = (promotions as any).useUpdateCouponStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.promotions.create)
  const canUpdate = hasPermission(PERMISSIONS.promotions.update)
  const canDelete = hasPermission(PERMISSIONS.promotions.delete)

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
    getMaster: (promotions as any).useGetCouponsDataMutation,
    itemsPerPage: 10,
  })

  const handleAdd = (open: boolean) => {
    if (open) router.push("/settings/coupons/create")
  }

  const handleEdit = (record: any) => {
    router.push(`/settings/coupons/${record.id}`)
  }

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Coupons"
        title={canCreate ? "Add Coupon" : undefined}
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
        deleteMutation={deleteCoupon}
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateCouponStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Coupon"
        deleteModalDescription="Are you sure you want to delete this coupon?"
      />

    </div>
  )
}
