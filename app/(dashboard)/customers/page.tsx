"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Gift, ReceiptText, TicketPercent, Wallet } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { CustomerForm } from "./createUpdate"

const formatMoney = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const buildColumns = (t: (key: string) => string) => [
  { key: "first_name", title: t("First Name") },
  { key: "last_name", title: t("Last Name") },
  { key: "group_name", title: t("Group") },
  { key: "phone", title: t("Phone") },
  { key: "email", title: t("Email") },
  {
    key: "account_amount",
    title: t("Account Credit"),
    render: (value: any) => formatMoney(value),
  },
  {
    key: "owed_amount",
    title: t("Owed Amount"),
    render: (value: any) => formatMoney(value),
  },
  {
    key: "purchases_amount",
    title: t("Purchase Amount"),
    render: (value: any) => formatMoney(value),
  },
  { key: "user_username", title: t("Author") },
]

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const columns = buildColumns(t)
  const [isFormOpen, setIsFormOpen] = useState(false)
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
    if (open) setIsFormOpen(true)
  }

  const handleEdit = (record: any) => {
    router.push(`/customers/${record.id}`)
  }

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setIsFormOpen(true)
    }
  }, [canCreate, searchParams])

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle={t("Customers List")}
        title={canCreate ? t("Add a new customer") : undefined}
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
        deleteModalTitle={t("Delete Customer")}
        deleteModalDescription={t("Would you like to delete this ?")}
        rowActions={(_, record) => [
          {
            key: "orders",
            label: t("Orders"),
            labelText: t("Orders"),
            icon: <ReceiptText className="size-4" />,
            onClick: () => router.push(`/customers/${record.id}?tab=orders`),
          },
          {
            key: "credit",
            label: t("Wallet History"),
            labelText: t("Wallet History"),
            icon: <Wallet className="size-4" />,
            onClick: () => router.push(`/customers/${record.id}/account-history`),
          },
          {
            key: "rewards",
            label: t("Rewards"),
            labelText: t("Rewards"),
            icon: <Gift className="size-4" />,
            onClick: () => router.push(`/customers/${record.id}/rewards`),
          },
          {
            key: "coupons",
            label: t("Coupons"),
            labelText: t("Coupons"),
            icon: <TicketPercent className="size-4" />,
            onClick: () => router.push(`/customers/${record.id}/coupons`),
          },
        ]}
      />
      <CustomerForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={triggerRefresh}
      />
    </div>
  )
}
