"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Boxes, PackageSearch } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate, formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { ProviderForm } from "./createUpdate"

const buildColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string,
  formatDate: (value: any) => string
) => [
    { key: "first_name", title: t("First Name") },
    { key: "email", title: t("Email") },
    { key: "phone", title: t("Phone") },
    { key: "amount_due", title: t("Amount Due"), render: (value: any) => formatMoney(value) },
    { key: "amount_paid", title: t("Amount Paid"), render: (value: any) => formatMoney(value) },
    { key: "user_username", title: t("User") },
    { key: "created_at", title: t("Created At"), render: formatDate },
  ]

export default function ProvidersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const formatDate = (value: any) => formatBusinessDate(value, posOptions)
  const columns = buildColumns(t, formatMoney, formatDate)
  const [formState, setFormState] = useState<{
    isOpen: boolean
    editId?: number | string | null
  }>({ isOpen: false, editId: null })
  const [deleteProvider] = (purchases as any).useDeleteProviderMutation()
  const [updateProviderStatus] = (purchases as any).useUpdateProviderStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.providers.create)
  const canUpdate = hasPermission(PERMISSIONS.providers.update)
  const canDelete = hasPermission(PERMISSIONS.providers.delete)

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
    getMaster: (purchases as any).useGetProvidersDataMutation,

  })

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setFormState({ isOpen: true, editId: null })
    }
  }, [canCreate, searchParams])

  return (
    <PermissionGuard permission={PERMISSIONS.providers.view}>
      <div className="h-full space-y-4">
        <DynamicTable
          data={orders}
          columns={columns}
          tableTitle={t("Providers List")}
          title={canCreate ? t("Add a new provider") : undefined}
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
          setAddEntityOpen={
            canCreate
              ? (open: boolean) => open && setFormState({ isOpen: true, editId: null })
              : undefined
          }
          showEdit={canUpdate}
          onEdit={(record: any) => setFormState({ isOpen: true, editId: record.id })}
          showDelete={canDelete}
          deleteMutation={deleteProvider}
          showStatus={canUpdate}
          statusChangeMutation={({ ids, status }: any) => updateProviderStatus({ payLoad: { ids, status } })}
          triggerRefresh={triggerRefresh}
          deleteModalTitle={t("Delete Provider")}
          deleteModalDescription={t("Would you like to delete this ?")}
          selectedDateRange={selectedDateRange}
          dateFilters={dateFilters}
          rowActions={(_, record) => [
            {
              key: "procurements",
              label: t("See Procurements"),
              labelText: t("See Procurements"),
              icon: <Boxes className="size-4" />,
              onClick: () => router.push(`/procurements/providers/${record.id}/procurements`),
            },
            {
              key: "products",
              label: t("See Products"),
              labelText: t("See Products"),
              icon: <PackageSearch className="size-4" />,
              onClick: () => router.push(`/procurements/providers/${record.id}/products`),
            },
          ]}
        />
        <ProviderForm
          isOpen={formState.isOpen}
          editId={formState.editId}
          onClose={() => setFormState({ isOpen: false, editId: null })}
          onSuccess={triggerRefresh}
        />
      </div>
    </PermissionGuard>
  )
}
