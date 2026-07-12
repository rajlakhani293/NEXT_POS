"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardListIcon, EyeIcon, ScaleIcon, SlidersHorizontalIcon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { StockAdjustmentForm } from "@/app/(dashboard)/inventory/adjustments/createUpdate"
import { Button } from "@/components/ui/button"
import CustomModal from "@/components/ui/customModal"
import { Spinner } from "@/components/ui/spinner"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { catalog } from "@/lib/api/catalog"
import { PERMISSIONS } from "@/lib/permissions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"

const columns = [
  { key: "name", title: "Name" },
  { key: "type", title: "Type" },
  { key: "sku", title: "SKU" },
  { key: "category_name", title: "Category" },
  { key: "status", title: "Status" },
  { key: "user_username", title: "User" },
  {
    key: "created_at",
    title: "Date",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
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
  const [getProductUnitQuantities, productUnitQuantities] = (catalog as any).useGetProductUnitQuantitiesMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.products.create)
  const canUpdate = hasPermission(PERMISSIONS.products.update)
  const canDelete = hasPermission(PERMISSIONS.products.delete)
  const canViewQuantities = hasPermission(PERMISSIONS.productUnits.view)
  const canAdjustStock = hasPermission(PERMISSIONS.inventory.adjust)
  const quantityRows = productUnitQuantities.data?.data || []
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

  const openQuantitiesList = async (record: any, mode: "list" | "preview" = "list") => {
    setQuantitiesMode(mode)
    setQuantitiesProduct(record)
    await getProductUnitQuantities({ productId: record.id })
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
    itemsPerPage: 10,
  })
  const translatedColumns = columns.map((column) => ({
    ...column,
    title: t(column.title),
    render:
      column.key === "type"
        ? (val: any) => t(val || "standard")
        : column.key === "category_name"
          ? (val: any) => val || t("Unassigned")
          : column.key === "status"
            ? (val: any) =>
              val === 0 || val === "0" || val === "available"
                ? t("Available")
                : t("Hidden")
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
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateProductStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle={t("Delete Product")}
        deleteModalDescription={t("Would you like to delete this ?")}
      />

      <StockAdjustmentForm
        isOpen={Boolean(adjustmentProduct)}
        onClose={() => setAdjustmentProduct(null)}
        onSuccess={triggerRefresh}
        product={adjustmentProduct}
      />

      <CustomModal
        open={Boolean(quantitiesProduct)}
        onOpenChange={(open) => {
          if (!open) closeQuantitiesList()
        }}
        title={
          quantitiesMode === "preview"
            ? `${t("Previewing :")} ${quantitiesProduct?.name || ""}`
            : t("Product Unit Quantities List")
        }
        description={
          quantitiesMode === "preview"
            ? t("Units & Quantities")
            : t("Display all product unit quantities.")
        }
        showFooter
        className="sm:max-w-3xl"
        bodyClassName="p-0"
        footer={
          <Button type="button" variant="outline" onClick={closeQuantitiesList}>
            {t("Close")}
          </Button>
        }
      >
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
          {quantitiesProduct?.name || t("Product")}
        </div>
        <div className="max-h-[50vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs font-bold uppercase text-gray-500">
              {quantitiesMode === "preview" ? (
                <tr>
                  <th className="px-4 py-3">{t("Unit")}</th>
                  <th className="px-4 py-3 text-right">{t("Sale Price")}</th>
                  <th className="px-4 py-3 text-right">{t("Wholesale Price")}</th>
                  <th className="px-4 py-3 text-right">{t("Quantity")}</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-3">{t("Product")}</th>
                  <th className="px-4 py-3">{t("Unit")}</th>
                  <th className="px-4 py-3 text-right">{t("Quantity")}</th>
                  <th className="px-4 py-3">{t("Updated At")}</th>
                </tr>
              )}
            </thead>
            <tbody>
              {productUnitQuantities.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Spinner />
                      {t("Loading...")}
                    </div>
                  </td>
                </tr>
              ) : quantityRows.length ? (
                quantityRows.map((quantity: any) => {
                  const unitName =
                    quantity.unit_name ||
                        quantity.unit_short_name ||
                        quantity.unit_identifier ||
                        quantity.unit?.name ||
                        quantity.unit?.identifier ||
                        "-"
                  return quantitiesMode === "preview" ? (
                    <tr key={quantity.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{unitName}</span>
                        {(quantitiesProduct?.type === "materialized" || quantitiesProduct?.type === "product") &&
                          (quantitiesProduct?.stock_management === "enabled" || quantitiesProduct?.track_stock) ? (
                          <button
                            type="button"
                            className="ml-2 text-xs font-semibold text-blue-600 hover:underline"
                            onClick={() => router.push(`/inventory/products/${quantitiesProduct.id}`)}
                          >
                            {t("Convert")}
                          </button>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(quantity.sale_price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(quantity.wholesale_price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {Number(quantity.quantity || 0).toLocaleString()}
                      </td>
                    </tr>
                  ) : (
                    <tr key={quantity.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {quantitiesProduct?.name || quantity.product_name || "-"}
                      </td>
                      <td className="px-4 py-3">{unitName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {Number(quantity.quantity || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {quantity.updated_at ? new Date(quantity.updated_at).toLocaleString() : "-"}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm font-medium text-gray-500">
                    {t("No product unit quantities has been registered")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CustomModal>
    </div>
  )
}
