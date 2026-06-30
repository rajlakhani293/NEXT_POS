"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Boxes, PackageSearch } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { PermissionGuard } from "@/components/permission-guard"
import { purchases } from "@/lib/api/purchases"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const columns = [
  { key: "first_name", title: "First Name" },
  { key: "email", title: "Email" },
  { key: "phone", title: "Phone" },
  { key: "amount_due", title: "Amount Due", render: (value: any) => formatMoney(value) },
  { key: "amount_paid", title: "Amount Paid", render: (value: any) => formatMoney(value) },
  { key: "user_username", title: "Author" },
  { key: "created_at", title: "Created At", render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

const providerInitialValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_1: "",
  address_2: "",
  description: "",
}

function ProviderForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="provider"
      fields={[
        {
          name: "first_name",
          label: "First Name",
          placeholder: "Provide a name to the resource.",
          type: "text",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Provide the provider email. Might be used to send automated email.",
          type: "email",
        },
        {
          name: "last_name",
          label: "Last Name",
          placeholder: "Provider last name if necessary.",
          type: "text",
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Contact phone number for the provider. Might be used to send automated SMS notifications.",
          type: "text",
        },
        {
          name: "address_1",
          label: "Address 1",
          placeholder: "First address of the provider.",
          type: "text",
        },
        {
          name: "address_2",
          label: "Address 2",
          placeholder: "Second address of the provider.",
          type: "text",
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Further details about the provider",
          type: "textarea",
        },
      ]}
      initialValues={providerInitialValues}
      createHook={(purchases as any).useCreateProviderMutation}
      editHook={(purchases as any).useEditProviderMutation}
      getByIdHook={(purchases as any).useGetProviderByIdMutation}
      formWidth="w-[560px]"
    />
  )
}

export default function ProvidersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formState, setFormState] = useState<{
    isOpen: boolean
    editId?: number | string | null
  }>({ isOpen: false, editId: null })
  const [deleteProvider] = (purchases as any).useDeleteProviderMutation()
  const [updateProviderStatus] = (purchases as any).useUpdateProviderStatusMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.purchases.create)
  const canUpdate = hasPermission(PERMISSIONS.purchases.update)
  const canDelete = hasPermission(PERMISSIONS.purchases.delete)

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
    itemsPerPage: 10,
  })

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setFormState({ isOpen: true, editId: null })
    }
  }, [canCreate, searchParams])

  return (
    <PermissionGuard permission={PERMISSIONS.purchases.view}>
      <div className="h-full space-y-4">
        <DynamicTable
          data={orders}
          columns={columns}
          tableTitle="Providers List"
          title={canCreate ? "Add a new provider" : undefined}
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
          deleteModalTitle="Delete Provider"
          deleteModalDescription="Would you like to delete this ?"
          selectedDateRange={selectedDateRange}
          dateFilters={dateFilters}
          rowActions={(_, record) => [
            {
              key: "procurements",
              label: "See Procurements",
              labelText: "See Procurements",
              icon: <Boxes className="size-4" />,
              onClick: () => router.push(`/providers/${record.id}/procurements`),
            },
            {
              key: "products",
              label: "See Products",
              labelText: "See Products",
              icon: <PackageSearch className="size-4" />,
              onClick: () => router.push(`/providers/${record.id}/products`),
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
