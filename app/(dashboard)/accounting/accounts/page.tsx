"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import DynamicTable from "@/components/DynamicTable"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { TransactionAccountForm } from "./createUpdate"

const buildColumns = (t: (key: string) => string) => [
  { key: "category_identifier", title: t("Category") },
  {
    key: "sub_category__name",
    title: t("Sub Account"),
    render: (value: string) => value || "-",
  },
  { key: "name", title: t("Name") },
  { key: "account", title: t("Account") },
  { key: "user_username", title: t("User") },
  {
    key: "created_at",
    title: t("Created At"),
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function TransactionAccountsPage() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [deleteRecord] = (accounting as any).useDeleteAccountMutation()
  const [updateStatus] = (accounting as any).useUpdateAccountStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.transactionAccounts.create)
  const canUpdate = hasPermission(PERMISSIONS.transactionAccounts.update)
  const canDelete = hasPermission(PERMISSIONS.transactionAccounts.delete)
  const table = useTableData({
    getMaster: (accounting as any).useGetAccountsDataMutation,
    itemsPerPage: 10,
  })

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setEditId(null)
      setIsFormOpen(true)
    }
  }, [canCreate, searchParams])

  const closeForm = () => {
    setIsFormOpen(false)
    setEditId(null)
  }

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={table.orders}
        columns={buildColumns(t)}
        tableTitle={t("Accounts List")}
        title={canCreate ? t("Add a new Account") : undefined}
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
        setAddEntityOpen={
          canCreate
            ? (open: boolean) => {
                if (open) {
                  setEditId(null)
                  setIsFormOpen(true)
                }
              }
            : undefined
        }
        showEdit={canUpdate}
        onEdit={(record: any) => {
          setEditId(record.id)
          setIsFormOpen(true)
        }}
        showDelete={canDelete}
        deleteMutation={deleteRecord}
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={table.triggerRefresh}
        deleteModalTitle={t("Delete Account")}
        deleteModalDescription={t("Would you like to delete this ?")}
        showDateRange
        selectedDateRange={table.selectedDateRange}
        dateFilters={table.dateFilters}
      />

      <TransactionAccountForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSuccess={table.triggerRefresh}
        editId={editId}
      />
    </div>
  )
}
