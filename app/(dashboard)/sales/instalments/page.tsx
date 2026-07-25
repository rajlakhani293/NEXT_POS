"use client"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export default function SaleInstalmentsPage() {
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)

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
      render: formatDate,
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
          showEdit={false}
        />
      </div>
    </PermissionGuard>
  )
}
