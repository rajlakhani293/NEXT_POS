"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { History } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import DynamicForm from "@/components/DynamicForm"
import { PermissionGuard } from "@/components/permission-guard"
import { registers } from "@/lib/api/registers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { useTableData } from "@/hooks/useTableData"
import { usePermissions } from "@/hooks/use-permissions"

const money = (value: any) => `₹${Number(value || 0).toFixed(2)}`

const buildRegisterColumns = (t: (key: string) => string) => [
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
  { key: "balance", title: t("Balance"), render: money },
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
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false)
  const [editRegisterId, setEditRegisterId] = useState<number | string | null>(null)
  const [registerValues, setRegisterValues] = useState({
    name: "",
    description: "",
  })
  const [createRegister] = (registers as any).useCreateRegisterMutation()
  const [editRegister] = (registers as any).useEditRegisterMutation()
  const [deleteRegister] = (registers as any).useDeleteRegisterMutation()
  const [updateRegisterStatus] = (registers as any).useUpdateRegisterStatusMutation()
  const [getRegisterById] = (registers as any).useGetRegisterByIdMutation()
  const { hasPermission } = usePermissions()
  const registerTable = useTableData({
    getMaster: (registers as any).useGetRegistersDataMutation,
    itemsPerPage: 10,
  })
  const closeForm = () => {
    setIsRegisterFormOpen(false)
    setEditRegisterId(null)
    setRegisterValues({ name: "", description: "" })
  }

  const refresh = () => {
    registerTable.triggerRefresh()
  }

  const openRegisterForm = async (record?: any) => {
    if (!record) {
      setEditRegisterId(null)
      setRegisterValues({ name: "", description: "" })
      setIsRegisterFormOpen(true)
      return
    }
    setEditRegisterId(record.id)
    const response = await getRegisterById({ id: record.id }).unwrap()
    const data = response?.data || record
    setRegisterValues({
      name: data.name || "",
      description: data.description || "",
    })
    setIsRegisterFormOpen(true)
  }

  const submitRegister = async (values: any) => {
    const payLoad = {
      name: values.name,
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
          columns={buildRegisterColumns(t)}
          tableTitle={t("Registers List")}
          title={hasPermission(PERMISSIONS.cashRegister.open) ? t("Add a new register") : undefined}
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
            hasPermission(PERMISSIONS.cashRegister.open)
              ? () => openRegisterForm()
              : undefined
          }
          showDateRange
          showEdit={hasPermission(PERMISSIONS.cashRegister.close)}
          onEdit={openRegisterForm}
          showDelete={hasPermission(PERMISSIONS.cashRegister.close)}
          deleteMutation={deleteRegister}
          showStatus={hasPermission(PERMISSIONS.cashRegister.close)}
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
