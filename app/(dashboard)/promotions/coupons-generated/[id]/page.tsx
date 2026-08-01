"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { promotions } from "@/lib/api/promotions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type GeneratedCouponValues = {
  name: string
  usage: string
  limit_usage: string
}

const initialValues: GeneratedCouponValues = {
  name: "",
  usage: "",
  limit_usage: "",
}

export default function GeneratedCustomerCouponFormPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const id = params.id as string
  const loadKeyRef = useRef("")
  const [values, setValues] = useState(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [getGeneratedCustomerCouponById, couponState] = (
    promotions as any
  ).useGetGeneratedCustomerCouponByIdMutation()
  const [editGeneratedCustomerCoupon] = (
    promotions as any
  ).useEditGeneratedCustomerCouponMutation()

  useEffect(() => {
    if (!id || loadKeyRef.current === id) return
    loadKeyRef.current = id

    const load = async () => {
      const response = await getGeneratedCustomerCouponById({ id }).unwrap()
      const record = response?.data
      if (!record) return
      setValues({
        name: record.name || "",
        usage: record.usage ? String(record.usage) : "0",
        limit_usage: record.limit_usage ? String(record.limit_usage) : "0",
      })
    }

    load()
  }, [getGeneratedCustomerCouponById, id])

  const updateField = (name: keyof GeneratedCouponValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const goBack = () => router.push("/promotions/coupons-generated")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await editGeneratedCustomerCoupon({
        id,
        payLoad: {
          name: values.name,
          usage: Number(values.usage || 0),
          limit_usage: Number(values.limit_usage || 0),
        },
      }).unwrap()
      showToast.success(response?.message || t("Customer coupon updated successfully."))
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (couponState.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Spinner className="h-5 w-5" />
          {t("Loading customer coupon...")}
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
          <h1 className="text-xl font-bold text-gray-900">{t("Edit Customer Coupon")}</h1>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UniFieldInput
              label={t("Name")}
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
            <UniFieldInput
              label={t("Usage")}
              type="number"
              min="0"
              value={values.usage}
              onChange={(event) => updateField("usage", event.target.value)}
            />
            <UniFieldInput
              label={t("Limit")}
              type="number"
              min="0"
              value={values.limit_usage}
              onChange={(event) => updateField("limit_usage", event.target.value)}
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
