"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import DynamicTable from "@/components/DynamicTable"
import DynamicForm from "@/components/DynamicForm"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { registers } from "@/lib/api/registers"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { useTableData } from "@/hooks/useTableData"
import { usePermissions } from "@/hooks/use-permissions"

const columns = [
  { key: "register_name", title: "Register" },
  { key: "cashier_name", title: "Cashier" },
  { key: "shift_status", title: "Status" },
  { key: "opened_at", title: "Opened" },
  { key: "closed_at", title: "Closed" },
  { key: "opening_cash", title: "Opening" },
  { key: "expected_cash", title: "Expected" },
  { key: "declared_cash", title: "Declared" },
  { key: "difference_amount", title: "Difference" },
]

const registerColumns = [
  { key: "name", title: "Register" },
  { key: "code", title: "Code" },
  { key: "location", title: "Location" },
  { key: "is_open", title: "Open" },
]

export default function RegistersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"registers" | "shifts">("registers")
  const [activeForm, setActiveForm] = useState<
    "register" | "open" | "close" | "cash_in" | "cash_out" | null
  >(null)
  const [editRegisterId, setEditRegisterId] = useState<number | string | null>(null)
  const [registerValues, setRegisterValues] = useState({
    name: "",
    code: "",
    location: "",
  })
  const [getRegistersDropdown, registersDropdown] = (
    registers as any
  ).useGetRegistersDropdownMutation()
  const [getCurrentShift, currentShiftState] = (
    registers as any
  ).useGetCurrentShiftMutation()
  const [openShift] = (registers as any).useOpenShiftMutation()
  const [closeShift] = (registers as any).useCloseShiftMutation()
  const [cashIn] = (registers as any).useCashInMutation()
  const [cashOut] = (registers as any).useCashOutMutation()
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
  const table = useTableData({
    getMaster: (registers as any).useGetShiftsDataMutation,
    itemsPerPage: 10,
  })
  const currentShift = currentShiftState.data?.data

  useEffect(() => {
    getRegistersDropdown()
    getCurrentShift()
  }, [getCurrentShift, getRegistersDropdown])

  const registerOptions = useMemo(
    () =>
      (registersDropdown.data?.data || []).map((item: any) => ({
        label: item.name,
        value: item.id,
      })),
    [registersDropdown.data?.data]
  )

  const closeForm = () => {
    setActiveForm(null)
    setEditRegisterId(null)
    setRegisterValues({ name: "", code: "", location: "" })
  }

  const refresh = async () => {
    registerTable.triggerRefresh()
    table.triggerRefresh()
    await getCurrentShift()
    await getRegistersDropdown()
  }

  const openRegisterForm = async (record?: any) => {
    if (!record) {
      setEditRegisterId(null)
      setRegisterValues({ name: "", code: "", location: "" })
      setActiveForm("register")
      return
    }
    setEditRegisterId(record.id)
    const response = await getRegisterById({ id: record.id }).unwrap()
    const data = response?.data || record
    setRegisterValues({
      name: data.name || "",
      code: data.code || "",
      location: data.location || "",
    })
    setActiveForm("register")
  }

  const submitRegister = async (values: any) => {
    const payLoad = {
      name: values.name,
      code: values.code || undefined,
      location: values.location || "",
    }
    const response = editRegisterId
      ? await editRegister({ id: editRegisterId, payLoad }).unwrap()
      : await createRegister(payLoad).unwrap()
    showToast.success(response?.message || "Cash register saved successfully.")
    closeForm()
    await refresh()
  }

  const submitOpenShift = async (values: any) => {
    const response = await openShift({
      register_id: values.register_id ? Number(values.register_id) : undefined,
      opening_cash: values.opening_cash || "0",
      note: values.note || "",
    }).unwrap()
    showToast.success(response?.message || "Shift opened successfully.")
    closeForm()
    await refresh()
  }

  const submitCloseShift = async (values: any) => {
    const response = await closeShift({
      shift_id: currentShift?.id,
      declared_cash: values.declared_cash || "0",
      note: values.note || "",
    }).unwrap()
    showToast.success(response?.message || "Shift closed successfully.")
    closeForm()
    await refresh()
  }

  const submitCashMovement = async (values: any) => {
    const mutation = activeForm === "cash_in" ? cashIn : cashOut
    const response = await mutation({
      shift_id: currentShift?.id,
      amount: values.amount,
      note: values.note || "",
    }).unwrap()
    showToast.success(response?.message || "Cash movement recorded.")
    closeForm()
    await refresh()
  }

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      {hasPermission(PERMISSIONS.cashRegister.open) && !currentShift ? (
        <Button onClick={() => setActiveForm("open")}>Open Shift</Button>
      ) : null}
      {hasPermission(PERMISSIONS.cashRegister.cashIn) && currentShift ? (
        <Button variant="outline" onClick={() => setActiveForm("cash_in")}>
          Cash In
        </Button>
      ) : null}
      {hasPermission(PERMISSIONS.cashRegister.cashOut) && currentShift ? (
        <Button variant="outline" onClick={() => setActiveForm("cash_out")}>
          Cash Out
        </Button>
      ) : null}
      {hasPermission(PERMISSIONS.cashRegister.close) && currentShift ? (
        <Button variant="destructive" onClick={() => setActiveForm("close")}>
          Close Shift
        </Button>
      ) : null}
    </div>
  )

  return (
    <PermissionGuard permission={PERMISSIONS.cashRegister.view}>
      <div className="space-y-4">
        {currentShift ? (
          <div className="rounded-lg border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Current Shift
                </p>
                <h2 className="text-lg font-bold">
                  {currentShift.register_name || "Register"} · Expected Cash ₹
                  {currentShift.expected_cash || 0}
                </h2>
              </div>
              {actionButtons}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Current Shift
              </p>
              <h2 className="text-lg font-bold">No open shift</h2>
            </div>
            {actionButtons}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeTab === "registers" ? "default" : "outline"}
            onClick={() => setActiveTab("registers")}
          >
            Registers
          </Button>
          <Button
            type="button"
            variant={activeTab === "shifts" ? "default" : "outline"}
            onClick={() => setActiveTab("shifts")}
          >
            Shift History
          </Button>
        </div>

        {activeTab === "registers" ? (
          <DynamicTable
            data={registerTable.orders}
            columns={registerColumns}
            tableTitle="Cash Registers"
            title={hasPermission(PERMISSIONS.cashRegister.open) ? "Add Register" : undefined}
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
            showEdit={hasPermission(PERMISSIONS.cashRegister.close)}
            onEdit={openRegisterForm}
            showDelete={hasPermission(PERMISSIONS.cashRegister.close)}
            deleteMutation={deleteRegister}
            showStatus={hasPermission(PERMISSIONS.cashRegister.close)}
            statusChangeMutation={({ ids, status }: any) =>
              updateRegisterStatus({ payLoad: { ids, status } })
            }
            triggerRefresh={refresh}
            deleteModalTitle="Delete Cash Register"
            deleteModalDescription="Are you sure you want to delete this cash register?"
          />
        ) : (
          <DynamicTable
            data={table.orders}
            columns={columns}
            tableTitle="Cash Register Shifts"
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
            rowActions={(_, record) => [
              {
                key: "view",
                label: "View Shift",
                labelText: "View Shift",
                icon: <ArrowRight className="size-4" />,
                onClick: () => router.push(`/registers/${record.id}`),
              },
            ]}
          />
        )}

        <DynamicForm
          isOpen={activeForm === "register"}
          onClose={closeForm}
          title={editRegisterId ? "Edit Cash Register" : "Create Cash Register"}
          initialValues={registerValues}
          fields={[
            {
              name: "name",
              label: "Register Name",
              placeholder: "Main Register",
              required: true,
            },
            {
              name: "code",
              label: "Code",
              placeholder: "Auto generated if empty",
            },
            {
              name: "location",
              label: "Location",
              placeholder: "Counter / branch location",
            },
          ]}
          onSubmit={submitRegister}
        />

        <DynamicForm
          isOpen={activeForm === "open"}
          onClose={closeForm}
          title="Open Cashier Shift"
          initialValues={{ register_id: "", opening_cash: "", note: "" }}
          fields={[
            {
              name: "register_id",
              label: "Register",
              type: "select",
              options: registerOptions,
              placeholder: "Select register",
              allowClear: true,
            },
            {
              name: "opening_cash",
              label: "Opening Cash",
              type: "number",
              placeholder: "Enter opening cash",
              required: true,
              prefix: "₹",
            },
            { name: "note", label: "Note", type: "textarea", placeholder: "Enter note" },
          ]}
          onSubmit={submitOpenShift}
        />

        <DynamicForm
          isOpen={activeForm === "close"}
          onClose={closeForm}
          title="Close Cashier Shift"
          initialValues={{ declared_cash: currentShift?.expected_cash || "", note: "" }}
          fields={[
            {
              name: "declared_cash",
              label: "Declared Cash",
              type: "number",
              placeholder: "Enter declared cash",
              required: true,
              prefix: "₹",
            },
            { name: "note", label: "Note", type: "textarea", placeholder: "Enter note" },
          ]}
          onSubmit={submitCloseShift}
        />

        <DynamicForm
          isOpen={activeForm === "cash_in" || activeForm === "cash_out"}
          onClose={closeForm}
          title={activeForm === "cash_out" ? "Cash Out" : "Cash In"}
          initialValues={{ amount: "", note: "" }}
          fields={[
            {
              name: "amount",
              label: "Amount",
              type: "number",
              placeholder: "Enter amount",
              required: true,
              prefix: "₹",
            },
            { name: "note", label: "Note", type: "textarea", placeholder: "Enter note" },
          ]}
          onSubmit={submitCashMovement}
        />
      </div>
    </PermissionGuard>
  )
}
