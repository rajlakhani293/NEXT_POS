"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { rewards } from "@/lib/api/rewards"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type CustomerRewardValues = {
  points: string
  target: string
}

const initialValues: CustomerRewardValues = {
  points: "",
  target: "",
}

export default function CustomerRewardEditPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const customerId = params.id as string
  const rewardId = params.rewardId as string
  const loadKeyRef = useRef("")
  const [values, setValues] = useState(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [getCustomerRewardById, rewardState] = (
    rewards as any
  ).useGetCustomerRewardByIdMutation()
  const [editCustomerReward] = (rewards as any).useEditCustomerRewardMutation()

  useEffect(() => {
    const loadKey = `${customerId}:${rewardId}`
    if (!customerId || !rewardId || loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      const response = await getCustomerRewardById({
        customerId,
        rewardId,
      }).unwrap()
      const record = response?.data
      if (!record) return
      setValues({
        points: record.points ? String(record.points) : "0",
        target: record.target ? String(record.target) : "0",
      })
    }

    load()
  }, [customerId, getCustomerRewardById, rewardId])

  const updateField = (name: keyof CustomerRewardValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const goBack = () => router.push(`/customers/${customerId}/rewards`)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await editCustomerReward({
        customerId,
        rewardId,
        payLoad: {
          points: values.points || "0",
          target: values.target || "0",
        },
      }).unwrap()
      showToast.success(response?.message || t("Customer reward updated successfully."))
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (rewardState.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading customer reward...")}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="flex-none border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={goBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{t("Edit Customer Reward")}</h1>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UniFieldInput
              label={t("Points")}
              type="number"
              min="0"
              value={values.points}
              onChange={(event) => updateField("points", event.target.value)}
            />
            <UniFieldInput
              label={t("Target")}
              type="number"
              min="0"
              value={values.target}
              onChange={(event) => updateField("target", event.target.value)}
            />
          </div>
        </section>
      </div>
      <footer className="flex justify-end gap-2 border-t border-gray-200 bg-white p-3">
        <Button type="button" variant="outline" onClick={goBack}>
          {t("Cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("Saving...") : t("Save")}
        </Button>
      </footer>
    </form>
  )
}
