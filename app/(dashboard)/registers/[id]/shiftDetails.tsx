"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import CustomModal from "@/components/ui/customModal"
import { Spinner } from "@/components/ui/spinner"
import { registers } from "@/lib/api/registers"
import { formatDateTime } from "@/lib/format"

const entryColumns = [
  { key: "entry_type", title: "Entry Type" },
  { key: "payment_type", title: "Payment Type" },
  { key: "amount", title: "Amount" },
  { key: "balance_before", title: "Before" },
  { key: "balance_after", title: "After" },
  { key: "reference_type", title: "Reference" },
  { key: "note", title: "Note" },
  {
    key: "created_at",
    title: "Created",
    render: (value: string | null) => formatDateTime(value),
  },
]

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

type ShiftDetailsProps = {
  shiftId: number | string | null
  onClose: () => void
}

export function ShiftDetails({ shiftId, onClose }: ShiftDetailsProps) {
  const [shift, setShift] = useState<any>(null)
  const requestedShiftRef = useRef<string | null>(null)
  const [getShiftById, shiftState] = (registers as any).useGetShiftByIdMutation()

  useEffect(() => {
    if (!shiftId) {
      requestedShiftRef.current = null
      setShift(null)
      return
    }

    const requestKey = String(shiftId)
    if (requestedShiftRef.current === requestKey) return
    requestedShiftRef.current = requestKey

    void getShiftById({ id: shiftId })
      .unwrap()
      .then((response: any) => setShift(response?.data || null))
      .catch(() => {
        requestedShiftRef.current = null
      })
  }, [getShiftById, shiftId])

  const zReport = shift?.z_report
  const entries = shift?.entries || []
  const cards = useMemo(
    () => [
      ["Opening Cash", zReport?.opening_cash],
      ["Expected Cash", zReport?.expected_cash],
      ["Declared Cash", zReport?.declared_cash],
      ["Difference", zReport?.difference_amount],
      ["Sales Collected", zReport?.sales_collected],
      ["Refund Out", zReport?.refund_out],
      ["Cash In", zReport?.cash_in],
      ["Cash Out", zReport?.cash_out],
    ],
    [zReport]
  )

  return (
    <CustomModal
      open={Boolean(shiftId)}
      onOpenChange={(open) => !open && onClose()}
      title={`${shift?.register_name || "Register"} Shift Details`}
      description={`Cashier: ${shift?.cashier_name || "-"} · Status: ${shift?.shift_status || "-"}`}
      showFooter={false}
      className="flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-xl p-0 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-none lg:h-[calc(100dvh-3rem)] lg:w-[calc(100vw-3rem)] lg:max-w-none"
      headerClassName="shrink-0 px-4 py-3 pr-14 sm:px-5 sm:py-3"
      bodyClassName="thin-scrollbar -mx-0 min-h-0 max-h-none flex-1 overflow-y-auto border-t border-b-0 border-gray-100 p-3 sm:p-5"
    >
      {shiftState.isLoading && !shift ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <Spinner className="size-5" />
            Loading shift details...
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(([title, value]) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 p-3"
              >
                <p className="text-xs font-semibold text-slate-500">{title}</p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {formatMoney(value)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-slate-950">Shift Summary</h3>
              <div className="mt-3 space-y-3 text-sm">
                {[
                  ["Opened At", formatDateTime(shift?.opened_at)],
                  ["Closed At", formatDateTime(shift?.closed_at)],
                  ["Register", shift?.register_name],
                  ["Cashier", shift?.cashier_name],
                  ["Entries", shift?.entry_count],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="text-right font-semibold text-slate-950">
                      {value ?? "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-slate-950">
                Totals By Entry Type
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(zReport?.totals_by_type || []).map((item: any) => (
                  <div
                    key={item.entry_type}
                    className="rounded-lg bg-slate-50 p-3"
                  >
                    <p className="text-xs font-semibold text-slate-500 capitalize">
                      {String(item.entry_type || "-").replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 font-bold text-slate-950">
                      {formatMoney(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DynamicTable
            data={entries}
            columns={entryColumns}
            tableTitle="Shift Entries"
            currentPage={1}
            itemsPerPage={Math.max(entries.length, 10)}
            totalItems={entries.length}
            onPageChange={() => undefined}
            hideActions
          />
        </div>
      )}
    </CustomModal>
  )
}
