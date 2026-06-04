"use client"

import { useEffect } from "react"

import DynamicForm from "@/components/DynamicForm"
import { promotions } from "@/lib/api/promotions"
import { rewards } from "@/lib/api/rewards"
import { showToast } from "@/lib/toast"

type RewardSystemFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
}

type RewardSystemFormValues = {
  name: string
  code: string
  coupon_id: string
  target: string
  from_amount: string
  to_amount: string
  reward: string
  description: string
}

const initialValues: RewardSystemFormValues = {
  name: "",
  code: "",
  coupon_id: "",
  target: "",
  from_amount: "",
  to_amount: "",
  reward: "",
  description: "",
}

const buildRewardFields = (couponOptions: any[]) => [
  {
    name: "name",
    label: "Reward Name",
    type: "text",
    placeholder: "Enter reward system name",
    required: true,
  },
  {
    name: "code",
    label: "Code",
    type: "text",
    placeholder: "Auto generated if empty",
  },
  {
    name: "coupon_id",
    label: "Reward Coupon",
    type: "select",
    placeholder: "Select coupon",
    allowClear: true,
    options: couponOptions.map((coupon: any) => ({
      label: `${coupon.name} (${coupon.code})`,
      value: coupon.id,
    })),
  },
  {
    name: "target",
    label: "Target",
    type: "number",
    placeholder: "How many points needed to redeem coupon",
  },
  {
    name: "from_amount",
    label: "From Cart Value",
    type: "number",
    placeholder: "Example: 100",
    prefix: "₹",
  },
  {
    name: "to_amount",
    label: "To Cart Value",
    type: "number",
    placeholder: "Optional",
    prefix: "₹",
  },
  {
    name: "reward",
    label: "Reward Points",
    type: "number",
    placeholder: "Example: 1",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
    rows: 3,
  },
]

export function RewardSystemForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
}: RewardSystemFormProps) {
  const [createRewardSystem] = (rewards as any).useCreateRewardSystemMutation()
  const [editRewardSystem] = (rewards as any).useEditRewardSystemMutation()
  const [getRewardSystemById, { data, isLoading }] = (
    rewards as any
  ).useGetRewardSystemByIdMutation()
  const [getCouponsDropdown, { data: couponsData }] = (
    promotions as any
  ).useGetCouponsDropdownMutation()

  useEffect(() => {
    if (isOpen) {
      getCouponsDropdown()
    }
    if (isOpen && editId) {
      getRewardSystemById({ id: editId })
    }
  }, [editId, getCouponsDropdown, getRewardSystemById, isOpen])

  const record = data?.data
  const rewardFields = buildRewardFields(couponsData?.data || [])
  const formValues: RewardSystemFormValues =
    editId && record
      ? {
          name: record.name || "",
          code: record.code || "",
          coupon_id: record.coupon_id ? String(record.coupon_id) : "",
          target: record.target ? String(record.target) : "",
          from_amount: record.from_amount ? String(record.from_amount) : "",
          to_amount: record.to_amount ? String(record.to_amount) : "",
          reward: record.reward ? String(record.reward) : "",
          description: record.description || "",
        }
      : initialValues

  const handleSubmit = async (values: RewardSystemFormValues) => {
    const payLoad = {
      name: values.name,
      code: values.code || undefined,
      coupon_id: values.coupon_id ? Number(values.coupon_id) : undefined,
      target: values.target || "0",
      from_amount: values.from_amount || "0",
      to_amount: values.to_amount || "0",
      reward: values.reward || "0",
      description: values.description || "",
    }

    if (editId) {
      const response = await editRewardSystem({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || "Reward system updated successfully.")
    } else {
      const response = await createRewardSystem(payLoad).unwrap()
      showToast.success(response?.message || "Reward system created successfully.")
    }

    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      key={editId || "create-reward-system"}
      fields={rewardFields as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? "Edit Reward System" : "Create Reward System"}
      note="Example: spend ₹100 and earn 1 point."
      isOpen={isOpen}
      formWidth="w-[560px]"
      isLoading={Boolean(editId) && isLoading}
    />
  )
}
