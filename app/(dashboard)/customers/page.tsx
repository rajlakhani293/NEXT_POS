"use client"

import { useRouter } from "next/navigation"
import { Gift, TicketPercent, Wallet } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { customers } from "@/lib/api/customers"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "name", title: "Name" },
  { key: "phone", title: "Phone" },
  { key: "email", title: "Email" },
  { key: "customer_type", title: "Type" },
  { key: "company_name", title: "Company" },
  { key: "opening_balance", title: "Opening Balance" },
  { key: "credit_limit_amount", title: "Credit Limit" },
  { key: "owed_amount", title: "Owed" },
]

export default function CustomersPage() {
  const router = useRouter()
  const [deleteCustomer] = (customers as any).useDeleteCustomerMutation()
  const [updateCustomerStatus] = (
    customers as any
  ).useUpdateCustomerStatusMutation()
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
    getMaster: (customers as any).useGetCustomersDataMutation,
    itemsPerPage: 10,
  })

  const handleAdd = (open: boolean) => {
    if (open) router.push("/customers/create")
  }

  const handleEdit = (record: any) => {
    router.push(`/customers/${record.id}`)
  }

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Customers"
        title={canCreate ? "Add Customer" : undefined}
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
        showDelete={canDelete}
        deleteMutation={deleteCustomer}
        showDateRange
        showStatus={canUpdate}
        statusChangeMutation={({ ids, status }: any) =>
          updateCustomerStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Customer"
        deleteModalDescription="Are you sure you want to delete this customer?"
        rowActions={(_, record) => [
          {
            key: "credit",
            label: "Credit History",
            labelText: "Credit History",
            icon: <Wallet className="size-4" />,
            onClick: () =>
              router.push(
                `/customers/credit?customer_id=${record.id}&customer_name=${encodeURIComponent(record.name || record.phone || "")}`
              ),
          },
          {
            key: "rewards",
            label: "Rewards",
            labelText: "Rewards",
            icon: <Gift className="size-4" />,
            onClick: () => router.push(`/customers/${record.id}/rewards`),
          },
          {
            key: "coupons",
            label: "Coupons",
            labelText: "Coupons",
            icon: <TicketPercent className="size-4" />,
            onClick: () => router.push(`/customers/${record.id}/coupons`),
          },
        ]}
      />
    </div>
  )
}
