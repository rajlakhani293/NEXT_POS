"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRightLeftIcon } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import DynamicForm from "@/components/DynamicForm"
import { CustomerGroupForm } from "@/app/(dashboard)/customers/groups/createUpdate"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { showToast } from "@/lib/toast"

const buildColumns = (t: (key: string) => string) => [
  { key: "name", title: t("Name") },
  { key: "reward_name", title: t("Reward System") },
  { key: "user_username", title: t("User") },
  { key: "created_at", title: t("Created On"), render: (value: any) => value ? new Date(value).toLocaleDateString() : "-" },
]

export default function CustomerGroupsPage() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const columns = buildColumns(t)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [transferGroup, setTransferGroup] = useState<any | null>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [deleteCustomerGroup] = (customers as any).useDeleteCustomerGroupMutation()
  const [updateCustomerGroupStatus] = (
    customers as any
  ).useUpdateCustomerGroupStatusMutation()
  const [getCustomerGroupsDropdown] = (
    customers as any
  ).useGetCustomerGroupsDropdownMutation()
  const [transferCustomerGroupCustomers] = (
    customers as any
  ).useTransferCustomerGroupCustomersMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.customers.create)
  const canUpdate = hasPermission(PERMISSIONS.customers.update)
  const canDelete = hasPermission(PERMISSIONS.customers.delete)

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
  } = useTableData({
    getMaster: (customers as any).useGetCustomerGroupsDataMutation,
    itemsPerPage: 10,
  })

  const handleAdd = (open: boolean) => {
    setEditId(null)
    setIsFormOpen(open)
  }

  const handleEdit = (record: any) => {
    setEditId(record.id)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditId(null)
  }

  const openTransfer = async (record: any) => {
    setTransferGroup(record)
    const response = await getCustomerGroupsDropdown().unwrap()
    setGroups(response?.data || [])
  }

  const handleTransfer = async (values: { to: string; ids: string }) => {
    if (!transferGroup) return
    const response = await transferCustomerGroupCustomers({
      from: transferGroup.id,
      to: Number(values.to),
      ids: values.ids || "*",
    }).unwrap()
    showToast.success(response?.message || t("The operation was successful."))
    setTransferGroup(null)
    triggerRefresh()
  }

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setEditId(null)
      setIsFormOpen(true)
    }
  }, [canCreate, searchParams])

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle={t("Customer Groups List")}
        title={canCreate ? t("Add a new Customers Group") : undefined}
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
        showDateRange
        onEdit={handleEdit}
        showDelete={canDelete}
        deleteMutation={deleteCustomerGroup}
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateCustomerGroupStatus({ payLoad: { ids, status } })
        }
        rowActions={(_, record) =>
          canUpdate
            ? [
                {
                  key: "transfer",
                  label: t("Transfer Customers"),
                  labelText: t("Transfer Customers"),
                  icon: <ArrowRightLeftIcon className="size-4" />,
                  onClick: () => openTransfer(record),
                },
              ]
            : []
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle={t("Delete Customer Group")}
        deleteModalDescription={t("Would you like to delete this ?")}
      />

      <CustomerGroupForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={triggerRefresh}
        editId={editId}
      />

      <DynamicForm
        key={transferGroup?.id || "transfer-customers"}
        fields={[
          {
            name: "from",
            label: t("From"),
            type: "text",
            disabled: true,
          },
          {
            name: "to",
            label: t("To"),
            type: "select",
            required: true,
            options: groups
              .filter((group) => String(group.id) !== String(transferGroup?.id))
              .map((group) => ({
                label: group.name,
                value: group.id,
              })),
          },
          {
            name: "ids",
            label: t("Customers"),
            type: "select",
            required: true,
            options: [{ label: t("All Customers"), value: "*" }],
          },
        ] as any}
        initialValues={{
          from: transferGroup?.name || "",
          to: "",
          ids: "*",
        }}
        onSubmit={handleTransfer}
        onClose={() => setTransferGroup(null)}
        title={t("Transfer Customers")}
        isOpen={Boolean(transferGroup)}
        formWidth="w-[520px]"
      />
    </div>
  )
}
