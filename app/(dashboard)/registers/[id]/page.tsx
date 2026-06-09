"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { registers } from "@/lib/api/registers"

const columns = [
  { key: "entry_type", title: "Entry Type" },
  { key: "payment_type", title: "Payment Type" },
  { key: "amount", title: "Amount" },
  { key: "balance_before", title: "Before" },
  { key: "balance_after", title: "After" },
  { key: "reference_type", title: "Reference" },
  { key: "note", title: "Note" },
  { key: "created_at", title: "Created" },
]

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

export default function RegisterShiftDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [shift, setShift] = useState<any>(null)
  const [zReport, setZReport] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)

  const [getShiftById, shiftState] = (registers as any).useGetShiftByIdMutation()
  const [getShiftEntriesData, entriesState] = (
    registers as any
  ).useGetShiftEntriesDataMutation()
  const [getShiftZReport, zReportState] = (
    registers as any
  ).useGetShiftZReportMutation()

  const loadShift = async () => {
    const [shiftResponse, zResponse] = await Promise.all([
      getShiftById({ id }).unwrap(),
      getShiftZReport({ id }).unwrap(),
    ])
    setShift(shiftResponse?.data || null)
    setZReport(zResponse?.data?.z_report || null)
  }

  const loadEntries = async (nextPage = page) => {
    const response = await getShiftEntriesData({
      id,
      payLoad: { page: nextPage, limit: 10 },
    }).unwrap()
    const data = response?.data || {}
    setRows(data.items || [])
    setTotalItems(data.total || 0)
  }

  useEffect(() => {
    loadShift()
  }, [id])

  useEffect(() => {
    loadEntries(page)
  }, [id, page])

  const topCards = useMemo(
    () => [
      {
        title: "Opening Cash",
        value: formatMoney(zReport?.opening_cash),
      },
      {
        title: "Expected Cash",
        value: formatMoney(zReport?.expected_cash),
      },
      {
        title: "Declared Cash",
        value: formatMoney(zReport?.declared_cash),
      },
      {
        title: "Difference",
        value: formatMoney(zReport?.difference_amount),
      },
      {
        title: "Sales Collected",
        value: formatMoney(zReport?.sales_collected),
      },
      {
        title: "Refund Out",
        value: formatMoney(zReport?.refund_out),
      },
      {
        title: "Cash In",
        value: formatMoney(zReport?.cash_in),
      },
      {
        title: "Cash Out",
        value: formatMoney(zReport?.cash_out),
      },
    ],
    [zReport]
  )

  if ((shiftState.isLoading || zReportState.isLoading) && !shift) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          Loading shift details...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.push("/registers")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {shift?.register_name || "Register"} Shift
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Cashier: {shift?.cashier_name || "-"} · Status: {shift?.shift_status || "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">{card.title}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Shift Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Opened At</span>
              <span className="font-semibold text-slate-950">{shift?.opened_at || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Closed At</span>
              <span className="font-semibold text-slate-950">{shift?.closed_at || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Register</span>
              <span className="font-semibold text-slate-950">{shift?.register_name || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Cashier</span>
              <span className="font-semibold text-slate-950">{shift?.cashier_name || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Entries</span>
              <span className="font-semibold text-slate-950">{zReport?.entry_count || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Totals By Entry Type</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(zReport?.totals_by_type || []).map((item: any) => (
              <div
                key={item.entry_type}
                className="rounded-xl border border-gray-100 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold capitalize text-slate-500">
                  {String(item.entry_type || "-").replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {formatMoney(item.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DynamicTable
        data={rows}
        columns={columns}
        tableTitle="Shift Entries"
        currentPage={page}
        itemsPerPage={10}
        totalItems={totalItems}
        onPageChange={setPage}
        isLoading={entriesState.isLoading}
        hideActions
      />
    </div>
  )
}
