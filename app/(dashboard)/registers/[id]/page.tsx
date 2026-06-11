"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { useTableData } from "@/hooks/useTableData"
import { registers } from "@/lib/api/registers"
import { formatDateTime } from "@/lib/format"
import { ShiftDetails } from "./shiftDetails"
import { IoMdEye } from "react-icons/io"

const columns = [
  { key: "cashier_name", title: "Cashier" },
  { key: "shift_status", title: "Status" },
  {
    key: "opened_at",
    title: "Opened",
    render: (value: string | null) => formatDateTime(value),
  },
  {
    key: "closed_at",
    title: "Closed",
    render: (value: string | null) => formatDateTime(value),
  },
  { key: "opening_cash", title: "Opening" },
  { key: "expected_cash", title: "Expected" },
  { key: "declared_cash", title: "Declared" },
  { key: "difference_amount", title: "Difference" },
]

export default function RegisterShiftHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const registerId = String(params.id)
  const [selectedShiftId, setSelectedShiftId] = useState<
    number | string | null
  >(null)
  const table = useTableData({
    getMaster: (registers as any).useGetShiftsDataMutation,
    itemsPerPage: 10,
    selectedFilters: { register_id: Number(registerId) },
  })
  const register = table.otherData?.register
  const registerName =
    register?.name || table.orders[0]?.register_name || "Cash Register"

  return (
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
              {registerName} Shift History
            </h1>
            <p className="text-sm font-medium text-gray-500">
              {register?.location || "View every cashier shift for this register."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <DynamicTable
          data={table.orders}
          columns={columns}
          tableTitle="Shift History"
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
              label: "View Shift",
              labelText: "View Shift",
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
  )
}
