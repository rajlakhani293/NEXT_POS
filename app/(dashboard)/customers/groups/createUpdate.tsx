"use client"

import { useEffect } from "react"

import DynamicForm from "@/components/DynamicForm"
import { customers } from "@/lib/api/customers"
import { rewards } from "@/lib/api/rewards"
import { showToast } from "@/lib/toast"

type CustomerGroupFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
}

type CustomerGroupFormValues = {
  name: string
  description: string
  minimal_credit_payment: string
  reward_system_id: string
}

const initialValues: CustomerGroupFormValues = {
  name: "",
  description: "",
  minimal_credit_payment: "",
  reward_system_id: "",
}

const buildFields = (rewardSystems: any[]) => [
  {
    name: "name",
    label: "Group Name",
    type: "text",
    placeholder: "Enter group name",
    required: true,
  },
  {
    name: "minimal_credit_payment",
    label: "Minimum Credit Payment",
    type: "number",
    placeholder: "Enter minimum payment percentage",
    suffix: "%",
    min: 0,
    max: 100,
  },
  {
    name: "reward_system_id",
    label: "Reward System",
    type: "select",
    placeholder: "Select reward system",
    allowClear: true,
    options: rewardSystems.map((system: any) => ({
      label: system.name,
      value: system.id,
    })),
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
    rows: 3,
  },
]

export function CustomerGroupForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
}: CustomerGroupFormProps) {
  const [createCustomerGroup] = (customers as any).useCreateCustomerGroupMutation()
  const [editCustomerGroup] = (customers as any).useEditCustomerGroupMutation()
  const [getCustomerGroupById, { data, isLoading }] = (
    customers as any
  ).useGetCustomerGroupByIdMutation()
  const [getRewardSystemsDropdown, rewardSystems] = (
    rewards as any
  ).useGetRewardSystemsDropdownMutation()

  useEffect(() => {
    if (isOpen) {
      getRewardSystemsDropdown()
    }
    if (isOpen && editId) {
      getCustomerGroupById({ id: editId })
    }
  }, [editId, getCustomerGroupById, getRewardSystemsDropdown, isOpen])

  const record = data?.data
  const fields = buildFields(rewardSystems.data?.data || [])
  const formValues: CustomerGroupFormValues =
    editId && record
      ? {
        name: record.name || "",
        description: record.description || "",
        minimal_credit_payment: record.minimal_credit_payment
          ? String(record.minimal_credit_payment)
          : "",
        reward_system_id: record.reward_system_id
          ? String(record.reward_system_id)
          : "",
      }
      : initialValues

  const handleSubmit = async (values: CustomerGroupFormValues) => {
    const payLoad = {
      name: values.name,
      description: values.description || "",
      minimal_credit_payment: values.minimal_credit_payment || "0",
      reward_system_id: values.reward_system_id
        ? Number(values.reward_system_id)
        : undefined,
    }

    if (editId) {
      const response = await editCustomerGroup({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || "Customer group updated successfully.")
    } else {
      const response = await createCustomerGroup(payLoad).unwrap()
      showToast.success(response?.message || "Customer group created successfully.")
    }

    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      key={editId || "create-customer-group"}
      fields={fields as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? "Edit Customer Group" : "Create Customer Group"}
      isOpen={isOpen}
      formWidth="w-[560px]"
      isLoading={Boolean(editId) && isLoading}
    />
  )
}
