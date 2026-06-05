"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { promotions } from "@/lib/api/promotions"
import { rewards } from "@/lib/api/rewards"
import { showToast } from "@/lib/toast"

type RewardRuleForm = {
  from_amount: string
  to_amount: string
  reward: string
}

type RewardFormValues = {
  name: string
  coupon_id: string
  target: string
  description: string
  rules: RewardRuleForm[]
}

const emptyRule = (): RewardRuleForm => ({
  from_amount: "",
  to_amount: "",
  reward: "",
})

const initialValues: RewardFormValues = {
  name: "",
  coupon_id: "",
  target: "",
  description: "",
  rules: [],
}

export default function RewardSystemFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"

  const [values, setValues] = useState<RewardFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")

  const [createRewardSystem] = (rewards as any).useCreateRewardSystemMutation()
  const [editRewardSystem] = (rewards as any).useEditRewardSystemMutation()
  const [getRewardSystemById, rewardSystem] = (
    rewards as any
  ).useGetRewardSystemByIdMutation()
  const [getCouponsDropdown, coupons] = (
    promotions as any
  ).useGetCouponsDropdownMutation()

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await getCouponsDropdown()
      if (!isEdit) {
        setValues(initialValues)
        setErrors({})
        return
      }

      const response = await getRewardSystemById({ id }).unwrap()
      const record = response?.data
      if (!record) return

      const rules =
        Array.isArray(record.rules) && record.rules.length
          ? record.rules.map((rule: any) => ({
            from_amount: rule.from_amount ? String(rule.from_amount) : "",
            to_amount: rule.to_amount ? String(rule.to_amount) : "",
            reward: rule.reward ? String(rule.reward) : "",
          }))
          : []

      setValues({
        name: record.name || "",
        coupon_id: record.coupon_id ? String(record.coupon_id) : "",
        target: record.target ? String(record.target) : "",
        description: record.description || "",
        rules,
      })
      setErrors({})
    }

    load()
  }, [getCouponsDropdown, getRewardSystemById, id, isEdit])

  const updateField = (name: keyof RewardFormValues, value: any) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const updateRule = (
    index: number,
    name: keyof RewardRuleForm,
    value: string
  ) => {
    setValues((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [name]: value } : rule
      ),
    }))
  }

  const addRule = () => {
    setValues((current) => ({
      ...current,
      rules: [...current.rules, emptyRule()],
    }))
  }

  const removeRule = (index: number) => {
    setValues((current) => ({
      ...current,
      rules: current.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = "Reward system name is required"
    if (!values.coupon_id) nextErrors.coupon_id = "Coupon is required"
    if (!values.target) nextErrors.target = "Target is required"
    const hasValidRule = values.rules.some(
      (rule) => Number(rule.reward || 0) > 0
    )
    if (!hasValidRule) nextErrors.rules = "At least one reward rule is required"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/settings/rewards")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const payLoad = {
      name: values.name,
      coupon_id: Number(values.coupon_id),
      target: values.target || "0",
      description: values.description || "",
      rules: values.rules
        .filter((rule) => Number(rule.reward || 0) > 0)
        .map((rule) => ({
          from_amount: rule.from_amount || "0",
          to_amount: rule.to_amount || "0",
          reward: Number(rule.reward || 0),
        })),
    }

    setIsSubmitting(true)
    try {
      if (isEdit) {
        const response = await editRewardSystem({ id, payLoad }).unwrap()
        showToast.success(
          response?.message || "Reward system updated successfully."
        )
      } else {
        const response = await createRewardSystem(payLoad).unwrap()
        showToast.success(
          response?.message || "Reward system created successfully."
        )
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = coupons.isLoading || (isEdit && rewardSystem.isLoading)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          Loading reward system data...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={goBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isEdit ? "Edit Reward System" : "Create a new reward system"}
              </h1>
              <p className="text-xs font-medium text-gray-500">
                Register a reward system, coupon target and earning rules.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-full flex-col"
        >
          <div className="flex-1 space-y-5 px-4 pt-4">
            <div className="grid gap-5 xl:grid-cols-[minmax(420px,560px)_minmax(560px,1fr)]">
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4 border-b pb-3">
                  <h2 className="text-base font-bold text-gray-900">
                    Reward Details
                  </h2>
                </div>
                <div className="space-y-4">
                  <UniFieldInput
                    label="Reward System Name"
                    required
                    placeholder="Enter reward system name"
                    value={values.name}
                    error={errors.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />

                  <UniFieldSelect
                    label="Coupon"
                    required
                    value={values.coupon_id}
                    onValueChange={(value) => updateField("coupon_id", value)}
                    placeholder="Choose coupon"
                    error={errors.coupon_id}
                    allowClear
                  >
                    {(coupons.data?.data || []).map((coupon: any) => (
                      <SelectItem key={coupon.id} value={String(coupon.id)}>
                        {coupon.name} ({coupon.code})
                      </SelectItem>
                    ))}
                  </UniFieldSelect>
                  <p className="-mt-3 text-xs font-medium text-gray-500">
                    Decide which coupon applies when customer redeems this
                    reward.
                  </p>

                  <UniFieldInput
                    label="Target"
                    required
                    type="number"
                    min="0"
                    placeholder="Points needed to redeem"
                    value={values.target}
                    error={errors.target}
                    onChange={(event) =>
                      updateField("target", event.target.value)
                    }
                  />
                  <p className="-mt-3 text-xs font-medium text-gray-500">
                    This is the objective that the user should reach to trigger
                    the reward.
                  </p>

                  <UniFieldInput
                    as="textarea"
                    label="Description"
                    placeholder="A short description about this system"
                    rows={9}
                    value={values.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Reward Rules
                    </h2>
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      Add cart value ranges and points earned for each range.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addRule}
                    className="h-9 gap-2 bg-black text-white hover:bg-black/90"
                  >
                    <Plus className="size-4" />
                    Add Rule
                  </Button>
                </div>

                {values.rules.length ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="grid grid-cols-[64px_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_56px] gap-3 border-b bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600">
                      <div>No.</div>
                      <div>From</div>
                      <div>To</div>
                      <div>Points</div>
                      <div className="text-center">Action</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {values.rules.map((rule, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[64px_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_56px] items-start gap-3 px-3 py-3"
                        >
                          <div className="flex h-10 items-center text-sm font-semibold text-gray-600">
                            #{index + 1}
                          </div>
                          <UniFieldInput
                            type="number"
                            min="0"
                            step="0.01"
                            prefix="₹"
                            placeholder="From"
                            value={rule.from_amount}
                            onChange={(event) =>
                              updateRule(
                                index,
                                "from_amount",
                                event.target.value
                              )
                            }
                          />
                          <UniFieldInput
                            type="number"
                            min="0"
                            step="0.01"
                            prefix="₹"
                            placeholder="To"
                            value={rule.to_amount}
                            onChange={(event) =>
                              updateRule(index, "to_amount", event.target.value)
                            }
                          />
                          <UniFieldInput
                            type="number"
                            min="0"
                            placeholder="Points"
                            value={rule.reward}
                            onChange={(event) =>
                              updateRule(index, "reward", event.target.value)
                            }
                          />
                          <div className="flex h-10 items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeRule(index)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 text-center">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                      <Plus className="size-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      No reward rules added
                    </h3>
                    <p className="mt-1 max-w-sm text-xs font-medium text-gray-500">
                      Click Add Rule to define cart value intervals and earned
                      points.
                    </p>
                  </div>
                )}

                {errors.rules ? (
                  <p className="mt-3 text-sm font-semibold text-red-500">
                    {errors.rules}
                  </p>
                ) : null}
              </section>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-end gap-x-2 border-t-2 border-gray-100 bg-white p-3">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-28 bg-black text-white hover:bg-black/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Saving...
                  </span>
                ) : isEdit ? (
                  "Update Reward"
                ) : (
                  "Save Reward"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
