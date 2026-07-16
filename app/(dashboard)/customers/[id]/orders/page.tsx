"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ReceiptText } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { cn } from "@/lib/utils"

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-amber-50 text-amber-700",
  unpaid: "bg-rose-50 text-rose-700",
  refunded: "bg-sky-50 text-sky-700",
  partially_refunded: "bg-indigo-50 text-indigo-700",
  hold: "bg-gray-100 text-gray-700",
  void: "bg-zinc-200 text-zinc-700",
  order_void: "bg-zinc-200 text-zinc-700",
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()

  const id = params.id as string

  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)

  const [customerName, setCustomerName] = useState("")
  const [ordersRows, setOrdersRows] = useState<any[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersSearch, setOrdersSearch] = useState("")
  const lastOrderRequestRef = useRef("")

  const [getCustomerById, customerState] = (
    customers as any
  ).useGetCustomerByIdMutation()
  const [getCustomerOrderHistory, orderHistoryState] = (
    customers as any
  ).useGetCustomerOrderHistoryMutation()

  useEffect(() => {
    const loadCustomer = async () => {
      if (!id) return
      try {
        const response = await getCustomerById({ id }).unwrap()
        const record = response?.data
        if (record) {
          setCustomerName(`${record.first_name || ""} ${record.last_name || ""}`.trim())
        }
      } catch (err) {
        console.error("Failed to load customer profile details", err)
      }
    }
    loadCustomer()
  }, [id, getCustomerById])

  const loadOrderHistory = async (
    targetPage = ordersPage,
    search = ordersSearch,
    force = false
  ) => {
    if (!id) return

    const requestKey = `${id}:${targetPage}:${search}`
    if (!force && lastOrderRequestRef.current === requestKey) return
    lastOrderRequestRef.current = requestKey

    try {
      const response = await getCustomerOrderHistory({
        id,
        payLoad: { page: targetPage, limit: 10, search },
      }).unwrap()
      const data = response?.data || {}
      setOrdersRows(data.items || [])
      setTotalOrders(data.total || 0)
    } catch (err) {
      console.error("Failed to load order history", err)
    }
  }

  useEffect(() => {
    loadOrderHistory(ordersPage, ordersSearch)
  }, [id, ordersPage, ordersSearch])

  const handleOrdersFilterChange = (action: string, payload?: any) => {
    if (action === "search") {
      setOrdersPage(1)
      setOrdersSearch(String(payload || ""))
      loadOrderHistory(1, String(payload || ""), true)
    }
  }

  const goBack = () => router.push("/customers")

  return (
    <DashboardPage padding="none">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={goBack}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {customerName ? `${customerName} - ${t("Orders")}` : t("Customer Orders")}
            </h1>
            <p className="text-xs font-medium text-gray-500">
              {t("List of all orders and purchase history for this customer.")}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
        {customerState.isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm animate-pulse">
              <Spinner className="h-5 w-5" />
              {t("Loading customer profile...")}
            </div>
          </div>
        ) : (
          <DynamicTable
            data={ordersRows}
            columns={[
              { key: "code", title: t("Order Code") },
              { key: "order_type", title: t("Type") },
              {
                key: "payment_status",
                title: t("Payment Status"),
                render: (value: string) => (
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      paymentStatusColors[value] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {t(String(value || "-").replaceAll("_", " "))}
                  </span>
                ),
              },
              { key: "delivery_status", title: t("Delivery Status") },
              { key: "subtotal", title: t("Subtotal"), render: (value: any) => formatMoney(value) },
              { key: "tax_amount", title: t("Tax"), render: (value: any) => formatMoney(value) },
              { key: "shipping", title: t("Shipping"), render: (value: any) => formatMoney(value) },
              { key: "total", title: t("Total"), render: (value: any) => formatMoney(value) },
              { key: "created_at", title: t("Date"), render: formatDate },
            ]}
            tableTitle={t("Orders History")}
            showSearch
            searchTerm={ordersSearch}
            onFilterChange={handleOrdersFilterChange}
            currentPage={ordersPage}
            itemsPerPage={10}
            totalItems={totalOrders}
            onPageChange={setOrdersPage}
            isLoading={orderHistoryState.isLoading}
            onEdit={(record: any) => router.push(`/sales/${record.id}`)}
            rowActions={(_, record) => [
              {
                key: "receipt",
                label: t("Receipt"),
                labelText: t("Receipt"),
                icon: <ReceiptText className="size-4" />,
                onClick: () => router.push(`/sales/${record.id}/receipt`),
              },
            ]}
          />
        )}
      </div>
      </div>
    </DashboardPage>
  )
}
