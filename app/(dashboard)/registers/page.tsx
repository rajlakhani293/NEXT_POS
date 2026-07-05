"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { History } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import DynamicForm from "@/components/DynamicForm"
import { PermissionGuard } from "@/components/permission-guard"
import { registers } from "@/lib/api/registers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { useTableData } from "@/hooks/useTableData"
import { usePermissions } from "@/hooks/use-permissions"

const buildRegisterColumns = (
  t: (key: string) => string,
  formatMoney: (value: any) => string
) => [
  { key: "name", title: t("Name") },
  {
    key: "register_status",
    title: t("Status"),
    render: (value: string) => (
      <span className="capitalize font-semibold text-xs">
        {t(value || "closed")}
      </span>
    ),
  },
  { key: "cashier_username", title: t("Used By"), render: (value: any) => value || t("N/A") },
  { key: "balance", title: t("Balance"), render: formatMoney },
  { key: "user_username", title: t("Author") },
  {
    key: "created_at",
    title: t("Created At"),
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
]

export default function RegistersPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false)
  const [editRegisterId, setEditRegisterId] = useState<number | string | null>(null)
  const [registerValues, setRegisterValues] = useState({
    name: "",
    register_status: "closed",
    description: "",
  })
  const [createRegister] = (registers as any).useCreateRegisterMutation()
  const [editRegister] = (registers as any).useEditRegisterMutation()
  const [deleteRegister] = (registers as any).useDeleteRegisterMutation()
  const [updateRegisterStatus] = (registers as any).useUpdateRegisterStatusMutation()
  const [getRegisterById] = (registers as any).useGetRegisterByIdMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.cashRegister.create)
  const canUpdate = hasPermission(PERMISSIONS.cashRegister.update)
  const canDelete = hasPermission(PERMISSIONS.cashRegister.delete)
  const registerTable = useTableData({
    getMaster: (registers as any).useGetRegistersDataMutation,
    itemsPerPage: 10,
  })
  const closeForm = () => {
    setIsRegisterFormOpen(false)
    setEditRegisterId(null)
    setRegisterValues({ name: "", register_status: "closed", description: "" })
  }

  const refresh = () => {
    registerTable.triggerRefresh()
  }

  const openRegisterForm = async (record?: any) => {
    if (!record) {
      setEditRegisterId(null)
      setRegisterValues({ name: "", register_status: "closed", description: "" })
      setIsRegisterFormOpen(true)
      return
    }
    setEditRegisterId(record.id)
    const response = await getRegisterById({ id: record.id }).unwrap()
    const data = response?.data || record
    setRegisterValues({
      name: data.name || "",
      register_status: data.register_status || "closed",
      description: data.description || "",
    })
    setIsRegisterFormOpen(true)
  }

  const submitRegister = async (values: any) => {
    const payLoad = {
      name: values.name,
      register_status: values.register_status || "closed",
      description: values.description || "",
    }
    const response = editRegisterId
      ? await editRegister({ id: editRegisterId, payLoad }).unwrap()
      : await createRegister(payLoad).unwrap()
    showToast.success(response?.message || t("Cash register saved successfully."))
    closeForm()
    refresh()
  }

  return (
    <PermissionGuard permission={PERMISSIONS.cashRegister.view}>
      <div className="space-y-4">
        <DynamicTable
          data={registerTable.orders}
          columns={buildRegisterColumns(t, formatMoney)}
          tableTitle={t("Registers List")}
          title={canCreate ? t("Add a new register") : undefined}
          showSearch
          searchTerm={registerTable.searchTerm}
          currentPage={registerTable.currentPage}
          itemsPerPage={registerTable.itemsPerPage}
          totalItems={registerTable.totalItems}
          onPageChange={registerTable.setCurrentPage}
          onFilterChange={registerTable.handleFilterChange}
          sortConfig={registerTable.sortConfig}
          onSort={registerTable.handleSort}
          sortableFields={registerTable.sortableFields}
          isLoading={registerTable.isLoading}
          setAddEntityOpen={
            canCreate
              ? () => openRegisterForm()
              : undefined
          }
          showDateRange
          showEdit={canUpdate}
          onEdit={openRegisterForm}
          showDelete={canDelete}
          deleteMutation={deleteRegister}
          showStatus={canUpdate}
          statusChangeMutation={({ ids, status }: any) =>
            updateRegisterStatus({ payLoad: { ids, status } })
          }
          rowActions={(_, record) => [
            {
              key: "history",
              label: t("Register History"),
              labelText: t("Register History"),
              icon: <History className="size-4" />,
              onClick: () => router.push(`/registers/${record.id}`),
            },
          ]}
          triggerRefresh={refresh}
          deleteModalTitle={t("Delete Cash Register")}
          deleteModalDescription={t("Would you like to delete this ?")}
        />

        <DynamicForm
          isOpen={isRegisterFormOpen}
          onClose={closeForm}
          title={editRegisterId ? t("Edit register") : t("Create a new register")}
          initialValues={registerValues}
          fields={[
            {
              name: "name",
              label: t("Name"),
              placeholder: t("Provide a name to the resource."),
              required: true,
            },
            {
              name: "register_status",
              label: t("Status"),
              placeholder: t("Define what is the status of the register."),
              type: "select",
              required: true,
              options: [
                { label: t("Closed"), value: "closed" },
                { label: t("Disabled"), value: "disabled" },
              ],
            },
            {
              name: "description",
              label: t("Description"),
              placeholder: t("Provide mode details about this cash register."),
              type: "textarea",
            },
          ]}
          onSubmit={submitRegister}
        />
      </div>
    </PermissionGuard>
  )
}
