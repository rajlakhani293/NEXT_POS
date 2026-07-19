"use client"

import { useEffect } from "react"

import DynamicForm from "@/components/DynamicForm"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
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

const buildFields = (rewardSystems: any[], t: (key: string) => string) => [
  {
    name: "name",
    label: t("Name"),
    type: "text",
    placeholder: t("Provide a name to the resource."),
    required: true,
  },
  {
    name: "minimal_credit_payment",
    label: t("Minimum Credit Payment (%)"),
    type: "number",
    placeholder: t('Determine in percentage, what is the first minimum credit payment made by all customers on the group, in case of credit order. If left to "0", no minimal credit amount is required.'),
    suffix: "%",
    min: 0,
    max: 100,
    validate: (value: any) => {
      const amount = Number(value || 0)
      if (!Number.isFinite(amount) || amount < 0 || amount > 100) {
        return t("Minimum credit payment must be between 0 and 100.")
      }
      return ""
    },
  },
  {
    name: "reward_system_id",
    label: t("Reward System"),
    type: "select",
    placeholder: t("Select which Reward system applies to the group"),
    allowClear: true,
    options: rewardSystems.map((system: any) => ({
      label: system.name,
      value: system.id,
    })),
  },
  {
    name: "description",
    label: t("Description"),
    type: "textarea",
    placeholder: t("A brief description about what this group is about"),
    rows: 3,
  },
]

export function CustomerGroupForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
}: CustomerGroupFormProps) {
  const { t } = useTranslation()
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
  const fields = buildFields(rewardSystems.data?.data || [], t)
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
    const minimalCreditPayment = Number(values.minimal_credit_payment || 0)
    if (!Number.isFinite(minimalCreditPayment) || minimalCreditPayment < 0 || minimalCreditPayment > 100) {
      showToast.error(t("Minimum credit payment must be between 0 and 100."))
      return
    }

    const payLoad = {
      name: values.name,
      description: values.description || "",
      minimal_credit_payment: String(minimalCreditPayment),
      reward_system_id: values.reward_system_id
        ? Number(values.reward_system_id)
        : undefined,
    }

    if (editId) {
      const response = await editCustomerGroup({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || t("Customer group updated successfully."))
    } else {
      const response = await createCustomerGroup(payLoad).unwrap()
      showToast.success(response?.message || t("Customer group created successfully."))
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
      title={editId ? t("Edit Customers Group") : t("Create a new Customers Group")}
      isOpen={isOpen}
      formWidth="w-[560px]"
      isLoading={Boolean(editId) && isLoading}
    />
  )
}
