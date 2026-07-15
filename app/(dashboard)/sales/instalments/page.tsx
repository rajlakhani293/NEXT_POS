"use client"

import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export default function SaleInstalmentsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
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
    selectedDateRange,
    dateFilters,
  } = useTableData({
    getMaster: (sales as any).useGetInstallmentsDataMutation,

  })

  const columns = [
    { key: "customer", title: t("Customer") },
    { key: "order_code", title: t("Order") },
    { key: "amount", title: t("Amount"), render: formatMoney },
    {
      key: "date",
      title: t("Date"),
      render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      key: "paid",
      title: t("Paid"),
      render: (value: boolean) => (
        <span
          className={cn(
            "rounded-full px-2 py-1 text-xs font-semibold uppercase",
            value ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
          )}
        >
          {value ? t("Yes") : t("No")}
        </span>
      ),
    },
  ]

  return (
    <PermissionGuard permission={PERMISSIONS.payments.collectDue}>
      <div className="h-full">
        <DynamicTable
          data={orders}
          columns={columns}
          tableTitle={t("Instalments")}
          showSearch
          showDateRange
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
          selectedDateRange={selectedDateRange}
          dateFilters={dateFilters}
          rowActions={(_, record) => [
            {
              key: "view-order",
              label: t("View Order"),
              labelText: t("View Order"),
              icon: <Eye className="size-4" />,
              onClick: () => router.push(`/sales/${record.order_id}`),
            },
          ]}
        />
      </div>
    </PermissionGuard>
  )
}
