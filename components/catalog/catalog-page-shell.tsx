"use client"

import { useState } from "react"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { useTableData } from "@/hooks/useTableData"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { useSession } from "@/lib/redux/session-provider"

type CatalogPageShellProps = {
  tableTitle: string
  addTitle: string
  columns: { key: string; title: string; render?: any }[]
  getDataHook: any
  deleteHook: any
  statusHook: any
  FormComponent: React.ComponentType<{
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    editId?: number | string | null
  }>
  deleteTitle: string
  deleteDescription: string
  permissions?: {
    view?: string
    create?: string
    update?: string
    delete?: string
  }
  showDateRange?: boolean
  refreshSessionOnMutation?: boolean
  rowActions?: (id: string, record: any) => any[]
  onEditRecord?: (record: any, openEditForm: (record: any) => void) => void
}

export function CatalogPageShell({
  tableTitle,
  addTitle,
  columns,
  getDataHook,
  deleteHook,
  statusHook,
  FormComponent,
  deleteTitle,
  deleteDescription,
  permissions = PERMISSIONS.products,
  showDateRange = true,
  refreshSessionOnMutation = false,
  rowActions,
  onEditRecord,
}: CatalogPageShellProps) {
  const searchParams = useSearchParams()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [deleteRecord] = deleteHook()
  const [updateStatus] = statusHook()
  const { hasPermission } = usePermissions()
  const { t } = useTranslation()
  const { refreshSession } = useSession()
  const canCreate = hasPermission(permissions.create)
  const canUpdate = hasPermission(permissions.update)
  const canDelete = hasPermission(permissions.delete)
  const translatedColumns = columns.map((column) => ({
    ...column,
    title: t(column.title),
  }))

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
    triggerRefresh,
    selectedDateRange,
    dateFilters,
  } = useTableData({
    getMaster: getDataHook,

    disableDateFilter: !showDateRange,
  })

  const handleRefresh = async () => {
    triggerRefresh()
    if (refreshSessionOnMutation) {
      await refreshSession()
    }
  }

  const handleAdd = (open: boolean) => {
    setEditId(null)
    setIsFormOpen(open)
  }

  const handleEdit = (record: any) => {
    if (onEditRecord) {
      onEditRecord(record, (nextRecord) => {
        setEditId(nextRecord.id)
        setIsFormOpen(true)
      })
      return
    }
    setEditId(record.id)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditId(null)
  }

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setEditId(null)
      setIsFormOpen(true)
    }
  }, [canCreate, searchParams])

  return (
    <DashboardPage padding="default">
      <PermissionGuard permission={permissions.view}>
        <div className="h-full space-y-4">
          <DynamicTable
            data={orders}
            columns={translatedColumns}
            tableTitle={t(tableTitle)}
            title={canCreate ? t(addTitle) : undefined}
            showSearch
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
            setAddEntityOpen={canCreate ? handleAdd : undefined}
            showEdit={canUpdate}
            onEdit={handleEdit}
            rowActions={rowActions}
            showDelete={canDelete}
            deleteMutation={deleteRecord}
            showStatus={canUpdate}
            statusChangeMutation={({ ids, status }: any) =>
              updateStatus({ payLoad: { ids, status } })
            }
            triggerRefresh={handleRefresh}
            deleteModalTitle={t(deleteTitle)}
            deleteModalDescription={t(deleteDescription)}
            showDateRange={showDateRange}
            selectedDateRange={selectedDateRange}
            dateFilters={dateFilters}
          />

          <FormComponent
            isOpen={isFormOpen}
            onClose={handleClose}
            onSuccess={handleRefresh}
            editId={editId}
          />
        </div>
      </PermissionGuard>
    </DashboardPage>
  )
}
