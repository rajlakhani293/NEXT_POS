"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, Play, RefreshCw, Trash2 } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { settings } from "@/lib/api/settings"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

export default function WorkersSettingsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "failed">("pending")
  const { hasPermission } = usePermissions()

  const [retryFailedJob, { isLoading: isRetrying }] = (
    settings as any
  ).useRetryFailedJobMutation()
  const [deleteFailedJob, { isLoading: isDeleting }] = (
    settings as any
  ).useDeleteFailedJobMutation()

  const pendingTable = useTableData({
    getMaster: (settings as any).useGetPendingJobsMutation,
    itemsPerPage: 10,
  })

  const failedTable = useTableData({
    getMaster: (settings as any).useGetFailedJobsMutation,
    itemsPerPage: 10,
  })

  const handleRetry = async (record: any) => {
    try {
      const response = await retryFailedJob({ id: record.id }).unwrap()
      showToast.success(response?.message || "Job re-enqueued successfully.")
      pendingTable.triggerRefresh()
      failedTable.triggerRefresh()
    } catch (error: any) {
      showToast.error(
        error?.data?.message || "Failed to retry job. Please try again."
      )
    }
  }

  const handleDelete = async (record: any) => {
    if (!confirm("Are you sure you want to dismiss this failed job?")) return
    try {
      const response = await deleteFailedJob({ id: record.id }).unwrap()
      showToast.success(response?.message || "Failed job dismissed successfully.")
      failedTable.triggerRefresh()
    } catch (error: any) {
      showToast.error(
        error?.data?.message || "Failed to dismiss job. Please try again."
      )
    }
  }

  const handleRefreshAll = () => {
    pendingTable.triggerRefresh()
    failedTable.triggerRefresh()
    showToast.success("Queue lists refreshed.")
  }

  const pendingColumns = [
    { key: "id", title: "Job ID" },
    { key: "queue", title: "Queue" },
    {
      key: "payload",
      title: "Task Details",
      render: (value: any) => {
        try {
          const decoded = JSON.parse(value || "{}")
          return (
            <div className="space-y-1 py-1">
              <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                {decoded.job || "Unknown Job"}
              </span>
              <pre className="no-scrollbar max-h-24 max-w-sm overflow-auto rounded-lg bg-gray-50/70 p-2 text-xs font-normal text-gray-500 font-mono leading-normal border border-gray-100">
                {JSON.stringify(decoded.data || {}, null, 2)}
              </pre>
            </div>
          )
        } catch {
          return <span className="text-gray-500 font-mono text-xs">{value}</span>
        }
      },
    },
    {
      key: "attempts",
      title: "Attempts",
      render: (value: any) => (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
          {value || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      title: "Created At",
      render: (value: any) =>
        value ? new Date(value * 1000).toLocaleString() : "-",
    },
    {
      key: "available_at",
      title: "Available At",
      render: (value: any) =>
        value ? new Date(value * 1000).toLocaleString() : "-",
    },
    {
      key: "reserved_at",
      title: "Reserved At",
      render: (value: any) =>
        value ? (
          <span className="text-emerald-700 font-semibold">
            {new Date(value * 1000).toLocaleString()}
          </span>
        ) : (
          <span className="text-gray-400 font-normal">Idle</span>
        ),
    },
  ]

  const failedColumns = [
    { key: "id", title: "Job ID" },
    { key: "queue", title: "Queue" },
    {
      key: "payload",
      title: "Task Details",
      render: (value: any) => {
        try {
          const decoded = JSON.parse(value || "{}")
          return (
            <div className="space-y-1 py-1">
              <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                {decoded.job || "Unknown Job"}
              </span>
              <pre className="no-scrollbar max-h-24 max-w-sm overflow-auto rounded-lg bg-gray-50/70 p-2 text-xs font-normal text-gray-500 font-mono leading-normal border border-gray-100">
                {JSON.stringify(decoded.data || {}, null, 2)}
              </pre>
            </div>
          )
        } catch {
          return <span className="text-gray-500 font-mono text-xs">{value}</span>
        }
      },
    },
    {
      key: "exception",
      title: "Failure Exception",
      render: (value: any) => (
        <pre className="no-scrollbar max-h-24 max-w-md overflow-auto rounded-lg bg-red-50/50 p-2.5 text-xs font-normal text-red-600 font-mono leading-normal border border-red-100">
          {value || "No stacktrace recorded."}
        </pre>
      ),
    },
    {
      key: "failed_at",
      title: "Failed At",
      render: (value: any) =>
        value ? new Date(value).toLocaleString() : "-",
    },
  ]

  const canManage = hasPermission(PERMISSIONS.settings.update)

  const failedRowActions = (_id: string, record: any) => {
    if (!canManage) return []
    return [
      {
        key: "retry",
        label: "Retry Job",
        labelText: "Retry",
        icon: <Play className="size-4 text-emerald-600" />,
        onClick: () => handleRetry(record),
        priority: 1,
      },
      {
        key: "delete",
        label: "Dismiss",
        labelText: "Dismiss",
        icon: <Trash2 className="size-4 text-red-600" />,
        onClick: () => handleDelete(record),
        priority: 2,
      },
    ]
  }

  return (
    <PermissionGuard permission={PERMISSIONS.settings.view}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Queue Workers & Background Jobs
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor active worker processes, view failure stacktraces, and trigger job retries.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Queues
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between border-b pb-1.5">
            <TabsList className="bg-transparent p-0 gap-6 h-auto">
              <TabsTrigger
                value="pending"
                className="relative rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-gray-500 hover:text-gray-900 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <span>Pending Tasks</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {pendingTable.totalItems}
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="failed"
                className="relative rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-gray-500 hover:text-gray-900 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <span>Failed Tasks</span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-200">
                    {failedTable.totalItems}
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 mt-4 overflow-hidden">
            <TabsContent value="pending" className="h-full m-0 outline-none">
              <DynamicTable
                data={pendingTable.orders}
                columns={pendingColumns}
                tableTitle="Pending Queue"
                showSearch
                searchTerm={pendingTable.searchTerm}
                currentPage={pendingTable.currentPage}
                itemsPerPage={pendingTable.itemsPerPage}
                totalItems={pendingTable.totalItems}
                onPageChange={pendingTable.setCurrentPage}
                onFilterChange={pendingTable.handleFilterChange}
                sortConfig={pendingTable.sortConfig}
                onSort={pendingTable.handleSort}
                sortableFields={["id", "queue", "attempts", "available_at", "created_at", "reserved_at"]}
                isLoading={pendingTable.isLoading}
                showEdit={false}
                showDelete={false}
                hideActions={true}
                triggerRefresh={pendingTable.triggerRefresh}
              />
            </TabsContent>

            <TabsContent value="failed" className="h-full m-0 outline-none">
              <DynamicTable
                data={failedTable.orders}
                columns={failedColumns}
                tableTitle="Failed Queue"
                showSearch
                searchTerm={failedTable.searchTerm}
                currentPage={failedTable.currentPage}
                itemsPerPage={failedTable.itemsPerPage}
                totalItems={failedTable.totalItems}
                onPageChange={failedTable.setCurrentPage}
                onFilterChange={failedTable.handleFilterChange}
                sortConfig={failedTable.sortConfig}
                onSort={failedTable.handleSort}
                sortableFields={["id", "queue", "connection", "failed_at"]}
                isLoading={failedTable.isLoading}
                showEdit={false}
                showDelete={false}
                rowActions={failedRowActions}
                triggerRefresh={failedTable.triggerRefresh}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PermissionGuard>
  )
}
