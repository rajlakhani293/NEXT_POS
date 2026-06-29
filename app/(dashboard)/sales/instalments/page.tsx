"use client"

import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { useTableData } from "@/hooks/useTableData"
import { sales } from "@/lib/api/sales"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

export default function SaleInstalmentsPage() {
  const router = useRouter()
  const { t } = useTranslation()

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
    itemsPerPage: 10,
  })

  const columns = [
    { key: "customer", title: t("customer") },
    { key: "order_code", title: t("order") },
    { key: "amount", title: t("amount"), render: formatMoney },
    {
      key: "date",
      title: t("date"),
      render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      key: "paid",
      title: t("paid"),
      render: (value: boolean) => (
        <span
          className={cn(
            "rounded-full px-2 py-1 text-xs font-semibold uppercase",
            value ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
          )}
        >
          {value ? t("yes") : t("no")}
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
          tableTitle={t("instalments")}
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
              label: t("view_order"),
              labelText: t("view_order"),
              icon: <Eye className="size-4" />,
              onClick: () => router.push(`/sales/${record.order_id}`),
            },
          ]}
        />
      </div>
    </PermissionGuard>
  )
}
