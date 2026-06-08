"use client"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { notifications } from "@/lib/api/notifications"
import { PERMISSIONS } from "@/lib/permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "title", title: "Title" },
  { key: "message", title: "Message" },
  { key: "notification_type", title: "Type" },
  { key: "source_type", title: "Source" },
  { key: "is_read", title: "Read" },
  { key: "created_at", title: "Created" },
]

export default function NotificationsPage() {
  const [deleteNotification] = (notifications as any).useDeleteNotificationMutation()
  const table = useTableData({
    getMaster: (notifications as any).useGetNotificationsDataMutation,
    itemsPerPage: 10,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.settings.view}>
      <DynamicTable
        data={table.orders}
        columns={columns}
        tableTitle="Notifications"
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
        showDelete
        deleteMutation={deleteNotification}
        triggerRefresh={table.triggerRefresh}
        deleteModalTitle="Delete Notification"
        deleteModalDescription="Are you sure you want to delete this notification?"
      />
    </PermissionGuard>
  )
}
