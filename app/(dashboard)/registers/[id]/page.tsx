"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { useTableData } from "@/hooks/useTableData"
import { registers } from "@/lib/api/registers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney, formatDateTime } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { ShiftDetails } from "./shiftDetails"
import { IoMdEye } from "react-icons/io"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDateTimeValue: (value: string | null) => string
) => [
    { key: "cashier_name", title: t("Cashier") },
    { key: "shift_status", title: t("Status") },
    {
      key: "opened_at",
      title: t("Opened"),
      render: formatDateTimeValue,
    },
    {
      key: "closed_at",
      title: t("Closed"),
      render: formatDateTimeValue,
    },
    { key: "opening_cash", title: t("Opening"), render: formatMoney },
    { key: "expected_cash", title: t("Expected"), render: formatMoney },
    { key: "declared_cash", title: t("Declared"), render: formatMoney },
    { key: "difference_amount", title: t("Difference"), render: formatMoney },
  ]

export default function RegisterShiftHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDateTimeValue = (value: string | null) => formatDateTime(value, posOptions)
  const rawRegisterId = Array.isArray(params.id) ? params.id[0] : params.id
  const registerId = Number(rawRegisterId)
  const hasRegisterId = Number.isFinite(registerId) && registerId > 0
  const [selectedShiftId, setSelectedShiftId] = useState<
    number | string | null
  >(null)
  const table = useTableData({
    getMaster: (registers as any).useGetShiftsDataMutation,
    enabled: hasRegisterId,

    selectedFilters: hasRegisterId ? { register_id: registerId } : {},
  })
  const register = table.otherData?.register
  const registerName =
    register?.name || table.orders[0]?.register_name || t("Cash Register")

  return (
    <DashboardPage padding="none">
      <div>
        <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => router.push("/registers")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t("Register History For : %s").replace("%s", registerName)}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                {register?.location || t("Display all register histories.")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <DynamicTable
            data={table.orders}
            columns={buildColumns(t, formatMoney, formatDateTimeValue)}
            tableTitle={t("Register History List")}
            showSearch
            searchTerm={table.searchTerm}
            currentPage={table.currentPage}
            itemsPerPage={table.itemsPerPage}
            totalItems={table.totalItems}
            onPageChange={table.setCurrentPage}
            onFilterChange={table.handleFilterChange}
            sortConfig={table.sortConfig}
            onSort={table.handleSort}
            sortableFields={table.sortableFields}
            isLoading={table.isLoading}
            showEdit={false}
            showDateRange
            rowActions={(_, record) => [
              {
                key: "view",
                label: t("Details"),
                labelText: t("Details"),
                icon: <IoMdEye className="size-4" />,
                onClick: () => setSelectedShiftId(record.id),
              },
            ]}
          />
        </div>

        <ShiftDetails
          shiftId={selectedShiftId}
          onClose={() => setSelectedShiftId(null)}
        />
      </div>
    </DashboardPage>
  )
}
