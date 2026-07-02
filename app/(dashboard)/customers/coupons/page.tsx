"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { CouponForm } from "./createUpdate"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string
) => [
  { key: "name", title: t("Name") },
  {
    key: "type",
    title: t("Type"),
    render: (value: any) =>
      value === "percentage_discount"
        ? t("Percentage Discount")
        : value === "flat_discount"
          ? t("Flat Discount")
          : value,
  },
  {
    key: "discount_value",
    title: t("Discount Value"),
    render: (value: any, record: any) =>
      record.type === "percentage_discount" ? `${value}%` : formatMoney(value),
  },
  { key: "valid_hours_start", title: t("Valid From") },
  { key: "valid_hours_end", title: t("Valid Till") },
  { key: "user_username", title: t("Author") },
  { key: "created_at", title: t("Created On"), render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function CouponsPage() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const columns = buildColumns(t, formatMoney)
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
        tableTitle={t("Coupons List")}
        title={canCreate ? t("Create Coupon") : undefined}
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
        deleteModalTitle={t("Delete Coupon")}
        deleteModalDescription={t("Would you like to delete this ?")}
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
