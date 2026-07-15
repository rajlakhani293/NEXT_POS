"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardListIcon, EyeIcon, ScaleIcon, SlidersHorizontalIcon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { StockAdjustmentForm } from "@/app/(dashboard)/inventory/adjustments/createUpdate"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { catalog } from "@/lib/api/catalog"
import { PERMISSIONS } from "@/lib/permissions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"
import { ProductModals } from "./ProductModals"

const columns = [
  { key: "name", title: "Name" },
  { key: "type", title: "Type" },
  { key: "sku", title: "SKU" },
  { key: "category_name", title: "Category" },
  { key: "user_username", title: "User" },
  {
    key: "created_at",
    title: "Date",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
  { key: "status", title: "Status" }
]

export default function ProductsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const [adjustmentProduct, setAdjustmentProduct] = useState<any>(null)
  const [quantitiesProduct, setQuantitiesProduct] = useState<any>(null)
  const [quantitiesMode, setQuantitiesMode] = useState<"list" | "preview">("list")
  const [deleteProduct] = (catalog as any).useDeleteProductMutation()
  const [updateProductStatus] = (catalog as any).useUpdateProductStatusMutation()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.products.create)
  const canUpdate = hasPermission(PERMISSIONS.products.update)
  const canDelete = hasPermission(PERMISSIONS.products.delete)
  const canViewQuantities = hasPermission(PERMISSIONS.productUnits.view)
  const canAdjustStock = hasPermission(PERMISSIONS.inventory.adjust)
  const currencyIndicator =
    posOptions.currency_preferred === "iso"
      ? posOptions.currency_iso
      : posOptions.currency_symbol
  const formatMoney = (value: any) => {
    const amount = Number(value || 0).toFixed(posOptions.currency_precision)
    return posOptions.currency_position === "after"
      ? `${amount}${currencyIndicator}`
      : `${currencyIndicator}${amount}`
  }

  const openQuantitiesList = (record: any, mode: "list" | "preview" = "list") => {
    setQuantitiesMode(mode)
    setQuantitiesProduct(record)
  }

  const closeQuantitiesList = () => {
    setQuantitiesProduct(null)
  }

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
    getMaster: (catalog as any).useGetProductsDataMutation,
  })
  const handleToggleStatus = async (record: any) => {
    const currentStatus = Number(record?.status || 0)
    const nextStatus = currentStatus === 0 ? 1 : 0
    const confirmed = await confirm({
      title: t("Confirm"),
      description:
        nextStatus === 1
          ? t("Do you want to make this product inactive?")
          : t("Do you want to make this product active?"),
      confirmLabel: nextStatus === 1 ? t("Make Inactive") : t("Make Active"),
      variant: nextStatus === 1 ? "destructive" : "default",
    })

    if (!confirmed) return

    try {
      const response = await updateProductStatus({
        payLoad: { ids: [record.id], status: nextStatus },
      }).unwrap()
      showToast.success(response?.message || t("Product status updated successfully."))
      triggerRefresh()
    } catch (error: any) {
      showToast.error(error?.data?.message || t("Something went wrong"))
    }
  }

  const translatedColumns = columns.map((column) => ({
    ...column,
    title: t(column.title),
    render:
      column.key === "type"
        ? (val: any) => t(val || "standard")
        : column.key === "category_name"
          ? (val: any) => val || t("Unassigned")
          : column.key === "status"
            ? (val: any, record: any) => {
              const row = record?.row || record
              const active = Number(val) === 0 || val === "available"
              const className = `inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-600"
                }`
              if (!canUpdate) {
                return <span className={className}>{active ? t("Active") : t("Inactive")}</span>
              }
              return (
                <button
                  type="button"
                  className={`${className} cursor-pointer`}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleToggleStatus(row)
                  }}
                >
                  {active ? t("Active") : t("Inactive")}
                </button>
              )
            }
            : column.render,
  }))

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={translatedColumns}
        tableTitle={t("Products List")}
        title={canCreate ? t("Add a new product") : undefined}
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
        showDateRange
        setAddEntityOpen={
          canCreate ? () => router.push("/inventory/products/create") : undefined
        }
        showEdit={canUpdate}
        onEdit={(record: any) => router.push(`/inventory/products/${record.id}`)}
        rowActions={(_, record) => [
          ...(canViewQuantities
            ? [
              {
                key: "preview",
                label: t("Preview"),
                labelText: t("Preview"),
                icon: <EyeIcon className="size-4" />,
                onClick: () => openQuantitiesList(record, "preview"),
                priority: 2,
              },
              {
                key: "units",
                label: t("See Quantities"),
                labelText: t("See Quantities"),
                icon: <ScaleIcon className="size-4" />,
                onClick: () => openQuantitiesList(record, "list"),
                priority: 3,
              },
            ]
            : []),
          ...(canAdjustStock
            ? [
              {
                key: "stock_adjustment",
                label: t("Stock Adjustment"),
                labelText: t("Stock Adjustment"),
                icon: <SlidersHorizontalIcon className="size-4" />,
                onClick: () => setAdjustmentProduct(record),
                priority: 4,
              },
            ]
            : []),
          {
            key: "stock_ledger",
            label: t("See History"),
            labelText: t("See History"),
            icon: <ClipboardListIcon className="size-4" />,
            onClick: () =>
              router.push(
                `/inventory/ledger?product_id=${record.id}&product_name=${encodeURIComponent(record.name || "Product")}`
              ),
            priority: 5,
          },
        ]}
        showDelete={canDelete}
        deleteMutation={deleteProduct}
        triggerRefresh={triggerRefresh}
        deleteModalTitle={t("Delete Product")}
        deleteModalDescription={t("Would you like to delete this ?")}
      />
      {confirmDialog}

      <StockAdjustmentForm
        isOpen={Boolean(adjustmentProduct)}
        onClose={() => setAdjustmentProduct(null)}
        onSuccess={triggerRefresh}
        product={adjustmentProduct}
      />

      <ProductModals
        quantitiesProduct={quantitiesProduct}
        quantitiesMode={quantitiesMode}
        onClose={closeQuantitiesList}
        formatMoney={formatMoney}
        currencyIndicator={currencyIndicator}
        posOptions={posOptions}
        triggerRefresh={triggerRefresh}
      />
    </div>
  )
}
