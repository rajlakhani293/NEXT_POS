"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { promotions } from "@/lib/api/promotions"
import { rewards } from "@/lib/api/rewards"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"

type RewardRule = {
  from_amount: string
  to_amount: string
  reward: string
}

type RewardFormValues = {
  name: string
  coupon_id: string
  target: string
  description: string
  rules: RewardRule[]
}

const emptyRule = (): RewardRule => ({
  from_amount: "",
  to_amount: "",
  reward: "",
})

const initialValues: RewardFormValues = {
  name: "",
  coupon_id: "",
  target: "",
  description: "",
  rules: [emptyRule()],
}

export default function RewardSystemFormPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) => formatBusinessMoney(value, posOptions)
  const routeId = String(params.id || "create")
  const rewardId = routeId === "create" ? null : routeId
  const isEdit = Boolean(rewardId)
  const loadKeyRef = useRef("")
  const dropdownsLoadedRef = useRef(false)

  const [values, setValues] = useState<RewardFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createRewardSystem] = (rewards as any).useCreateRewardSystemMutation()
  const [editRewardSystem] = (rewards as any).useEditRewardSystemMutation()
  const [getRewardSystemById, rewardState] = (rewards as any).useGetRewardSystemByIdMutation()
  const [getCouponsDropdown, couponsState] = (promotions as any).useGetCouponsDropdownMutation()

  useEffect(() => {
    if (dropdownsLoadedRef.current) return
    dropdownsLoadedRef.current = true
    getCouponsDropdown()
  }, [])

  useEffect(() => {
    const loadKey = `${rewardId || "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      if (!rewardId) {
        setValues(initialValues)
        setErrors({})
        return
      }

      const response = await getRewardSystemById({ id: rewardId }).unwrap()
      const record = response?.data
      if (!record) return

      setValues({
        name: record.name || "",
        coupon_id: record.coupon_id ? String(record.coupon_id) : "",
        target: record.target ? String(record.target) : "",
        description: record.description || "",
        rules: Array.isArray(record.rules) && record.rules.length
          ? record.rules.map((rule: any) => ({
            from_amount: rule.from_amount ? String(rule.from_amount) : "",
            to_amount: rule.to_amount ? String(rule.to_amount) : "",
            reward: rule.reward ? String(rule.reward) : "",
          }))
          : [emptyRule()],
      })
      setErrors({})
    }

    load()
  }, [getRewardSystemById, rewardId])

  const updateField = <K extends keyof RewardFormValues>(name: K, value: RewardFormValues[K]) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }))
  }

  const updateRule = (index: number, field: keyof RewardRule, value: string) => {
    setValues((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule
      ),
    }))
  }

  const addRule = () => {
    setValues((current) => ({ ...current, rules: [...current.rules, emptyRule()] }))
  }

  const removeRule = (index: number) => {
    setValues((current) => ({
      ...current,
      rules: current.rules.length > 1
        ? current.rules.filter((_, ruleIndex) => ruleIndex !== index)
        : current.rules,
    }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = t("Name is required")
    if (!values.coupon_id) nextErrors.coupon_id = t("Coupon is required")
    if (!values.target) nextErrors.target = t("Target is required")
    values.rules.forEach((rule, index) => {
      if (!rule.from_amount) nextErrors[`rules[${index}].from_amount`] = t("Required")
      if (!rule.to_amount) nextErrors[`rules[${index}].to_amount`] = t("Required")
      if (!rule.reward) nextErrors[`rules[${index}].reward`] = t("Required")
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/promotions/rewards")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const payLoad = {
      name: values.name,
      coupon_id: Number(values.coupon_id),
      target: values.target || "0",
      description: values.description || "",
      rules: values.rules.map((rule) => ({
        from_amount: rule.from_amount || "0",
        to_amount: rule.to_amount || "0",
        reward: rule.reward || "0",
      })),
    }

    setIsSubmitting(true)
    try {
      if (rewardId) {
        const response = await editRewardSystem({ id: rewardId, payLoad }).unwrap()
        showToast.success(response?.message || t("Reward system updated successfully."))
      } else {
        const response = await createRewardSystem(payLoad).unwrap()
        showToast.success(response?.message || t("Reward system created successfully."))
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  const coupons = couponsState.data?.data || []
  const isLoading = couponsState.isLoading || (Boolean(rewardId) && rewardState.isLoading)

  if (isLoading) {
    return (
      <DashboardPage padding="none">
        <div className="flex h-full items-center justify-center bg-gray-50">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <Spinner className="h-5 w-5" />
            {t("Loading reward system...")}
          </div>
        </div>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage padding="none">
      <form noValidate onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
        <div className="flex-none border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={goBack}>
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900">
                  {isEdit ? t("Edit Reward System") : t("Create Reward System")}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEdit ? t("Modify Reward System.") : t("Register a new reward system and save it.")}
                </p>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("Saving...") : t("Save")}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)]">
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">{t("General")}</h2>
              <div className="grid grid-cols-1 gap-4">
                <UniFieldInput
                  label={t("Name")}
                  required
                  value={values.name}
                  error={errors.name}
                  placeholder={t("Provide a name to the resource.")}
                  onChange={(event) => updateField("name", event.target.value)}
                />
                <UniFieldSelect
                  label={t("Coupon")}
                  required
                  value={values.coupon_id}
                  error={errors.coupon_id}
                  placeholder={t("Select coupon")}
                  allowClear
                  hasOptions={coupons.length > 0}
                  onValueChange={(value) => updateField("coupon_id", value)}
                >
                  {coupons.map((coupon: any) => (
                    <SelectItem key={coupon.id} value={String(coupon.id)}>
                      {coupon.name}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
                <p className="-mt-2 text-xs font-medium text-gray-500">
                  {t("Decide which coupon you would apply to the system.")}
                </p>
                <UniFieldInput
                  label={t("Target")}
                  required
                  type="number"
                  value={values.target}
                  error={errors.target}
                  placeholder={t("This is the objective that the user should reach to trigger the reward.")}
                  onChange={(event) => updateField("target", event.target.value)}
                />
                <UniFieldInput
                  label={t("Description")}
                  as="textarea"
                  rows={4}
                  value={values.description}
                  placeholder={t("A short description about this system")}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{t("Rules")}</h2>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {t("Example: spend {amount} and earn 1 point.").replace("{amount}", formatMoney(100))}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRule}>
                  <Plus className="mr-2 size-4" />
                  {t("Add Rule")}
                </Button>
              </div>
              <div className="space-y-3">
                {values.rules.map((rule, index) => (
                  <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <UniFieldInput
                      label={t("From")}
                      type="number"
                      required
                      value={rule.from_amount}
                      error={errors[`rules[${index}].from_amount`]}
                      prefix={posOptions.currency_symbol}
                      placeholder={t("The interval start here.")}
                      onChange={(event) => updateRule(index, "from_amount", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("To")}
                      type="number"
                      required
                      value={rule.to_amount}
                      error={errors[`rules[${index}].to_amount`]}
                      prefix={posOptions.currency_symbol}
                      placeholder={t("The interval ends here.")}
                      onChange={(event) => updateRule(index, "to_amount", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Points")}
                      type="number"
                      required
                      value={rule.reward}
                      error={errors[`rules[${index}].reward`]}
                      placeholder={t("Points earned.")}
                      onChange={(event) => updateRule(index, "reward", event.target.value)}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 text-red-600"
                        disabled={values.rules.length === 1}
                        onClick={() => removeRule(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </form>
    </DashboardPage>
  )
}
