"use client"

import { useState } from "react"
import { CheckCircle2, CircleOff } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { payments } from "@/lib/api/payments"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const initialValues = {
  label: "",
  identifier: "",
  description: "",
  priority: 0,
  readonly: false,
}

const columns = [
  { key: "identifier", title: "Identifier" },
  { key: "label", title: "Label" },
  {
    key: "status",
    title: "Active",
    render: (_value: any, context: any) => {
      const record = context.row
      const isActive = Number(record.status || 0) === 0
      return (
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
            isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          {isActive ? "Yes" : "No"}
        </span>
      )
    },
  },
  { key: "priority", title: "Priority" },
  {
    key: "created_at",
    title: "Created On",
    render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
  },
  {
    key: "readonly",
    title: "Readonly",
    render: (value: any) => (value ? "Yes" : "No"),
  },
  { key: "user_username", title: "Author" },
]

function normalizeIdentifier(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function PaymentTypesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [formValues, setFormValues] = useState(initialValues)
  const { hasPermission } = usePermissions()

  const [createPaymentType] = (payments as any).useCreatePaymentTypeMutation()
  const [editPaymentType] = (payments as any).useEditPaymentTypeMutation()
  const [getPaymentTypeById] = (payments as any).useGetPaymentTypeByIdMutation()
  const [deletePaymentType] = (payments as any).useDeletePaymentTypeMutation()
  const [updatePaymentTypeStatus] = (
    payments as any
  ).useUpdatePaymentTypeStatusMutation()

  const table = useTableData({
    getMaster: (payments as any).useGetPaymentTypesDataMutation,
    itemsPerPage: 10,
  })

  const canCreate = hasPermission(PERMISSIONS.payments.create)

  const closeForm = () => {
    setIsFormOpen(false)
    setEditId(null)
    setFormValues(initialValues)
  }

  const openCreate = () => {
    setEditId(null)
    setFormValues(initialValues)
    setIsFormOpen(true)
  }

  const openEdit = async (record: any) => {
    const response = await getPaymentTypeById({ id: record.id }).unwrap()
    const data = response?.data || record
    setEditId(record.id)
    setFormValues({
      label: data.label || "",
      identifier: data.identifier || "",
      description: data.description || "",
      priority: Number(data.priority ?? 0),
      readonly: Boolean(data.readonly),
    })
    setIsFormOpen(true)
  }

  const submitPaymentType = async (values: any) => {
    const payLoad = {
      label: values.label,
      identifier: values.readonly
        ? values.identifier
        : normalizeIdentifier(values.identifier || values.label),
      description: values.description || "",
      priority: Number(values.priority || 0),
    }

    const response = editId
      ? await editPaymentType({ id: editId, payLoad }).unwrap()
      : await createPaymentType(payLoad).unwrap()
    showToast.success(response?.message || "Payment type saved successfully.")
    closeForm()
    table.triggerRefresh()
  }

  const togglePaymentTypeStatus = async (record: any) => {
    const currentStatus = Number(record.status || 0)
    const nextStatus = currentStatus === 0 ? 1 : 0
    const response = await updatePaymentTypeStatus({
      payLoad: { ids: [record.id], status: nextStatus },
    }).unwrap()
    showToast.success(response?.message || "Payment type status updated.")
    table.triggerRefresh()
  }

  return (
    <PermissionGuard permission={PERMISSIONS.payments.view}>
      <div className="h-full space-y-4">
        <DynamicTable
          data={table.orders}
          columns={columns}
          tableTitle="Payment Types"
          title={canCreate ? "Add Payment Type" : undefined}
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
          setAddEntityOpen={canCreate ? openCreate : undefined}
          showEdit={canCreate}
          onEdit={openEdit}
          showDelete={canCreate}
          canDeleteRow={(record) => !record?.readonly}
          deleteMutation={deletePaymentType}
          deleteModalTitle="Delete Payment Type"
          deleteModalDescription="Are you sure you want to delete this payment type?"
          rowActions={(_id, record) =>
            canCreate && !record?.readonly
              ? [
                {
                  key: "status",
                  label: Number(record.status || 0) === 0 ? "Disable" : "Enable",
                  labelText:
                    Number(record.status || 0) === 0 ? "Disable" : "Enable",
                  icon:
                    Number(record.status || 0) === 0 ? (
                      <CircleOff className="size-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ),
                  onClick: () => togglePaymentTypeStatus(record),
                  priority: 2,
                },
              ]
              : []
          }
          triggerRefresh={table.triggerRefresh}
        />

        <DynamicForm
          key={editId || "create-payment-type"}
          isOpen={isFormOpen}
          onClose={closeForm}
          title={editId ? "Edit Payment Type" : "Create Payment Type"}
          initialValues={formValues}
          formWidth="w-[520px]"
          fields={[
            {
              name: "label",
              label: "Label",
              placeholder: "Cash",
              required: true,
            },
            {
              name: "identifier",
              label: "Identifier",
              placeholder: "cash-payment",
              required: true,
              disabled: (values: any) => Boolean(values.readonly),
            },
            {
              name: "description",
              label: "Description",
              type: "textarea",
              rows: 3,
              placeholder: "Enter description",
            },
            {
              name: "priority",
              label: "Priority",
              type: "number",
              placeholder: "0",
            },
          ]}
          onSubmit={submitPaymentType}
        />
      </div>
    </PermissionGuard>
  )
}
