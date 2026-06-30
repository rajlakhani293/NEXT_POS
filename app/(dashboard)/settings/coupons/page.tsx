"use client"

import { useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import { promotions } from "@/lib/api/promotions"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { CouponForm } from "./createUpdate"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const columns = [
  { key: "name", title: "Name" },
  {
    key: "type",
    title: "Type",
    render: (value: any) =>
      value === "percentage_discount"
        ? "Percentage Discount"
        : value === "flat_discount"
          ? "Flat Discount"
          : value,
  },
  {
    key: "discount_value",
    title: "Discount Value",
    render: (value: any, record: any) =>
      record.type === "percentage_discount" ? `${value}%` : formatMoney(value),
  },
  { key: "valid_hours_start", title: "Valid From" },
  { key: "valid_hours_end", title: "Valid Till" },
  { key: "user_username", title: "Author" },
  { key: "created_at", title: "Created On", render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function CouponsPage() {
  const [formState, setFormState] = useState<{
    isOpen: boolean
    editId?: number | string | null
  }>({ isOpen: false, editId: null })
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
    if (open) setFormState({ isOpen: true, editId: null })
  }

  const handleEdit = (record: any) => {
    setFormState({ isOpen: true, editId: record.id })
  }

  const closeForm = () => {
    setFormState({ isOpen: false, editId: null })
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
      <CouponForm
        isOpen={formState.isOpen}
        editId={formState.editId}
        onClose={closeForm}
        onSuccess={triggerRefresh}
      />
    </div>
  )
}
