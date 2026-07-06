"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownCircle, ArrowUpCircle, History, Lock, LockOpen } from "lucide-react"

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

type RegisterActionState = {
  action: "open" | "close" | "register-cash-in" | "register-cash-out"
  register: any
  title: string
  description: string
  confirmLabel: string
}

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
  const [registerAction, setRegisterAction] = useState<RegisterActionState | null>(null)
  const [registerActionValues, setRegisterActionValues] = useState({
    amount: "",
    description: "",
  })
  const [createRegister] = (registers as any).useCreateRegisterMutation()
  const [editRegister] = (registers as any).useEditRegisterMutation()
  const [deleteRegister] = (registers as any).useDeleteRegisterMutation()
  const [updateRegisterStatus] = (registers as any).useUpdateRegisterStatusMutation()
  const [getRegisterById] = (registers as any).useGetRegisterByIdMutation()
  const [performRegisterAction] = (registers as any).usePerformRegisterActionMutation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.cashRegister.create)
  const canUpdate = hasPermission(PERMISSIONS.cashRegister.update)
  const canDelete = hasPermission(PERMISSIONS.cashRegister.delete)
  const canOpen = hasPermission(PERMISSIONS.cashRegister.open)
  const canClose = hasPermission(PERMISSIONS.cashRegister.close)
  const canCashIn = hasPermission(PERMISSIONS.cashRegister.cashIn)
  const canCashOut = hasPermission(PERMISSIONS.cashRegister.cashOut)
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

  const openRegisterActionForm = (action: RegisterActionState["action"], record: any) => {
    const actionConfig = {
      open: {
        title: t("Open Register : %s").replace("%s", record.name || t("Cash Register")),
        description: t("Further observation while proceeding."),
        confirmLabel: t("Open Register"),
      },
      close: {
        title: t("Close Register"),
        description: t("Further observation while proceeding."),
        confirmLabel: t("Close Register"),
      },
      "register-cash-in": {
        title: t("Cash In"),
        description: t("define the amount of the transaction."),
        confirmLabel: t("Cash In"),
      },
      "register-cash-out": {
        title: t("Cash Out"),
        description: t("define the amount of the transaction."),
        confirmLabel: t("Cash Out"),
      },
    }[action]
    setRegisterAction({ action, register: record, ...actionConfig })
    setRegisterActionValues({ amount: "", description: "" })
  }

  const closeRegisterActionForm = () => {
    setRegisterAction(null)
    setRegisterActionValues({ amount: "", description: "" })
  }

  const submitRegisterAction = async (values: any) => {
    if (!registerAction?.register?.id) return
    const amount = Number(values.amount || 0)
    if (amount < 0 || Number.isNaN(amount)) {
      showToast.error(t("Amount must be a valid number."))
      return
    }
    try {
      const response = await performRegisterAction({
        id: registerAction.register.id,
        action: registerAction.action,
        payLoad: {
          amount,
          description: values.description || "",
        },
      }).unwrap()
      showToast.success(response?.message || t("The operation was successful."))
      closeRegisterActionForm()
      refresh()
    } catch (error: any) {
      showToast.error(error?.data?.message || t("Unable to process the register action."))
      throw error
    }
  }

  const registerRowActions = (_: any, record: any) => {
    const isClosed = record.register_status === "closed"
    const isOpen = record.register_status === "opened" || record.register_status === "in-use"
    const actions: any[] = []
    if (canOpen && isClosed) {
      actions.push({
        key: "open",
        label: t("Open Register"),
        labelText: t("Open Register"),
        icon: <LockOpen className="size-4" />,
        onClick: () => openRegisterActionForm("open", record),
      })
    }
    if (isOpen) {
      if (canClose) {
        actions.push({
          key: "close",
          label: t("Close Register"),
          labelText: t("Close Register"),
          icon: <Lock className="size-4" />,
          onClick: () => openRegisterActionForm("close", record),
        })
      }
      if (canCashIn) {
        actions.push({
          key: "cash-in",
          label: t("Cash In"),
          labelText: t("Cash In"),
          icon: <ArrowDownCircle className="size-4" />,
          onClick: () => openRegisterActionForm("register-cash-in", record),
        })
      }
      if (canCashOut) {
        actions.push({
          key: "cash-out",
          label: t("Cash Out"),
          labelText: t("Cash Out"),
          icon: <ArrowUpCircle className="size-4" />,
          onClick: () => openRegisterActionForm("register-cash-out", record),
        })
      }
    }
    actions.push({
      key: "history",
      label: t("Register History"),
      labelText: t("Register History"),
      icon: <History className="size-4" />,
      onClick: () => router.push(`/registers/${record.id}`),
    })
    return actions
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
          rowActions={registerRowActions}
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

        <DynamicForm
          isOpen={Boolean(registerAction)}
          onClose={closeRegisterActionForm}
          title={registerAction?.title || t("Cash Register")}
          note={`${t("Balance")}: ${formatMoney(registerAction?.register?.balance || 0)}. ${registerAction?.description || ""}`}
          initialValues={registerActionValues}
          fields={[
            {
              name: "amount",
              label: t("Amount"),
              placeholder: t("Amount"),
              type: "number",
              required: registerAction?.action === "register-cash-in" || registerAction?.action === "register-cash-out",
              inputMode: "decimal",
              validate: (value: any) => {
                const numericValue = Number(value || 0)
                if (Number.isNaN(numericValue)) return t("Amount must be a valid number.")
                if (registerAction?.action !== "open" && numericValue <= 0) {
                  return t("Amount must be greater than 0.")
                }
                return ""
              },
            },
            {
              name: "description",
              label: t("Description"),
              placeholder: t("Further observation while proceeding."),
              type: "textarea",
            },
          ]}
          onSubmit={submitRegisterAction}
        />
      </div>
    </PermissionGuard>
  )
}
