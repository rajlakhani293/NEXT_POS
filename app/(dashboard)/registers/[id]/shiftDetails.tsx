"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import CustomModal from "@/components/ui/customModal"
import { Spinner } from "@/components/ui/spinner"
import { registers } from "@/lib/api/registers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney, formatDateTime } from "@/lib/format"
import { usePosOptions } from "@/lib/options"

const buildEntryColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDateTimeValue: (value: string | null) => string
) => [
  { key: "entry_type", title: t("Entry Type") },
  { key: "payment_type", title: t("Payment Type") },
  { key: "amount", title: t("Amount"), render: formatMoney },
  { key: "balance_before", title: t("Before"), render: formatMoney },
  { key: "balance_after", title: t("After"), render: formatMoney },
  { key: "reference_type", title: t("Reference") },
  { key: "note", title: t("Note") },
  {
    key: "created_at",
    title: t("Created At"),
    render: formatDateTimeValue,
  },
]

type ShiftDetailsProps = {
  shiftId: number | string | null
  onClose: () => void
}

export function ShiftDetails({ shiftId, onClose }: ShiftDetailsProps) {
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDateTimeValue = (value: string | null) => formatDateTime(value, posOptions)
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
      [t("Opening Cash"), zReport?.opening_cash],
      [t("Expected Cash"), zReport?.expected_cash],
      [t("Declared Cash"), zReport?.declared_cash],
      [t("Difference"), zReport?.difference_amount],
      [t("Sales Collected"), zReport?.sales_collected],
      [t("Refund Out"), zReport?.refund_out],
      [t("Cash In"), zReport?.cash_in],
      [t("Cash Out"), zReport?.cash_out],
    ],
    [t, zReport]
  )

  return (
    <CustomModal
      open={Boolean(shiftId)}
      onOpenChange={(open) => !open && onClose()}
      title={`${shift?.register_name || t("Register")} ${t("Details")}`}
      description={`${t("Cashier")}: ${shift?.cashier_name || "-"} · ${t("Status")}: ${shift?.shift_status || "-"}`}
      showFooter={false}
      className="flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-xl p-0 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-none lg:h-[calc(100dvh-3rem)] lg:w-[calc(100vw-3rem)] lg:max-w-none"
      headerClassName="shrink-0 px-4 py-3 pr-14 sm:px-5 sm:py-3"
      bodyClassName="thin-scrollbar -mx-0 min-h-0 max-h-none flex-1 overflow-y-auto border-t border-b-0 border-gray-100 p-3 sm:p-5"
    >
      {shiftState.isLoading && !shift ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <Spinner className="size-5" />
            {t("Loading shift details...")}
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
              <h3 className="font-bold text-slate-950">{t("Register History")}</h3>
              <div className="mt-3 space-y-3 text-sm">
                {[
                  [t("Opened At"), formatDateTimeValue(shift?.opened_at)],
                  [t("Closed At"), formatDateTimeValue(shift?.closed_at)],
                  [t("Register"), shift?.register_name],
                  [t("Cashier"), shift?.cashier_name],
                  [t("Entries"), shift?.entry_count],
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
                {t("Totals By Entry Type")}
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
            columns={buildEntryColumns(t, formatMoney, formatDateTimeValue)}
            tableTitle={t("Register History List")}
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
