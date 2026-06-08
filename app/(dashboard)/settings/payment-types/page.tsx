"use client"

import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import DynamicTable from "@/components/DynamicTable"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { payments } from "@/lib/api/payments"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const initialValues = {
  label: "",
  identifier: "",
  description: "",
  is_enabled: true,
  sort_order: "0",
  is_system: false,
}

const columns = [
  { key: "label", title: "Label" },
  { key: "identifier", title: "Identifier" },
  {
    key: "is_system",
    title: "Type",
    render: (_value: any, context: any) => {
      const record = context.row
      return (
        <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold text-gray-700">
          {record.is_system ? "System" : "Custom"}
        </span>
      )
    },
  },
  {
    key: "is_enabled",
    title: "Enabled",
    render: (_value: any, context: any) => {
      const record = context.row
      return record.is_enabled ? "Yes" : "No"
    },
  },
  { key: "sort_order", title: "Sort" },
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
  const [deleteRecord, setDeleteRecord] = useState<any>(null)
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
      is_enabled: Boolean(data.is_enabled),
      sort_order: String(data.sort_order ?? 0),
      is_system: Boolean(data.is_system),
    })
    setIsFormOpen(true)
  }

  const submitPaymentType = async (values: any) => {
    const payLoad = {
      label: values.label,
      identifier: values.is_system
        ? values.identifier
        : normalizeIdentifier(values.identifier || values.label),
      description: values.description || "",
      is_enabled: Boolean(values.is_enabled),
      sort_order: Number(values.sort_order || 0),
    }

    const response = editId
      ? await editPaymentType({ id: editId, payLoad }).unwrap()
      : await createPaymentType(payLoad).unwrap()
    showToast.success(response?.message || "Payment type saved successfully.")
    closeForm()
    table.triggerRefresh()
  }

  const confirmDelete = async () => {
    if (!deleteRecord) return
    const response = await deletePaymentType({ ids: [deleteRecord.id] }).unwrap()
    showToast.success(response?.message || "Payment type deleted successfully.")
    setDeleteRecord(null)
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
          showDelete={false}
          showStatus={canCreate}
          statusChangeMutation={({ ids, status }: any) =>
            updatePaymentTypeStatus({ payLoad: { ids, status } })
          }
          rowActions={(_id, record) =>
            canCreate && !record?.is_system
              ? [
                  {
                    key: "delete",
                    label: "Delete",
                    labelText: "Delete",
                    icon: <Trash2 className="size-4 text-red-500" />,
                    onClick: () => setDeleteRecord(record),
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
              disabled: (values: any) => Boolean(values.is_system),
              note: "System identifiers are fixed because sales/register logic depends on them.",
            },
            {
              name: "description",
              label: "Description",
              type: "textarea",
              rows: 3,
              placeholder: "Enter description",
            },
            {
              name: "is_enabled",
              label: "Enabled",
              type: "switch",
              note: "Disabled payment types will not show in payment dropdowns.",
            },
            {
              name: "sort_order",
              label: "Sort Order",
              type: "number",
              placeholder: "0",
            },
          ]}
          onSubmit={submitPaymentType}
        />

        <Dialog open={Boolean(deleteRecord)} onOpenChange={() => setDeleteRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment Type</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deleteRecord?.label}? System
                payment types cannot be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteRecord(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  )
}
