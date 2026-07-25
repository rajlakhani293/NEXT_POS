"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { SelectItem } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"

type CustomerFormValues = {
  first_name: string
  last_name: string
  phone: string
  email: string
  credit_limit_amount: string
  group_id: string
  birth_date: string
  pobox: string
  gender: string
  billing_first_name: string
  billing_last_name: string
  billing_phone: string
  billing_email: string
  billing_address_1: string
  billing_address_2: string
  billing_country: string
  billing_city: string
  billing_pobox: string
  billing_company_name: string
  shipping_first_name: string
  shipping_last_name: string
  shipping_phone: string
  shipping_email: string
  shipping_address_1: string
  shipping_address_2: string
  shipping_country: string
  shipping_city: string
  shipping_pobox: string
  shipping_company_name: string
}

const initialValues: CustomerFormValues = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  credit_limit_amount: "",
  group_id: "",
  birth_date: "",
  pobox: "",
  gender: "",
  billing_first_name: "",
  billing_last_name: "",
  billing_phone: "",
  billing_email: "",
  billing_address_1: "",
  billing_address_2: "",
  billing_country: "",
  billing_city: "",
  billing_pobox: "",
  billing_company_name: "",
  shipping_first_name: "",
  shipping_last_name: "",
  shipping_phone: "",
  shipping_email: "",
  shipping_address_1: "",
  shipping_address_2: "",
  shipping_country: "",
  shipping_city: "",
  shipping_pobox: "",
  shipping_company_name: "",
}

const sanitizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10)
const parseDateValue = (value: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}
const formatDateValue = (date?: Date) => {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type CustomerTab = "general" | "billing" | "shipping"

export default function CustomerFormPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()

  const id = params.id as string
  const isEdit = id !== "create"

  const [values, setValues] = useState<CustomerFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<CustomerTab>("general")

  const [groups, setGroups] = useState<{ id: number; name: string }[]>([])
  const contentRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")

  const [createCustomer] = (customers as any).useCreateCustomerMutation()
  const [editCustomer] = (customers as any).useEditCustomerMutation()
  const [getCustomerById, customerState] = (
    customers as any
  ).useGetCustomerByIdMutation()
  const [getCustomerGroupsDropdown] = (
    customers as any
  ).useGetCustomerGroupsDropdownMutation()

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await getCustomerGroupsDropdown().unwrap()
        setGroups(response?.data || [])
      } catch (err) {
        console.error("Failed to load customer groups", err)
      }
    }
    loadGroups()
  }, [getCustomerGroupsDropdown])

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      if (!isEdit) {
        setValues(initialValues)
        setErrors({})
        return
      }

      try {
        const response = await getCustomerById({ id }).unwrap()
        const record = response?.data
        if (!record) return

        const billingAddress = record.addresses?.billing || record.address || {}
        const shippingAddress = record.addresses?.shipping || {}

        setValues({
          first_name: record.first_name || "",
          last_name: record.last_name || "",
          phone: record.phone || "",
          email: record.email || "",
          credit_limit_amount: record.credit_limit_amount
            ? String(record.credit_limit_amount)
            : "",
          group_id: record.group_id ? String(record.group_id) : "",
          birth_date: record.birth_date ? String(record.birth_date).split(" ")[0] : "",
          pobox: record.pobox || "",
          gender: record.gender || "",

          // Billing address
          billing_first_name: billingAddress.first_name || "",
          billing_last_name: billingAddress.last_name || "",
          billing_phone: billingAddress.phone || "",
          billing_email: billingAddress.email || "",
          billing_address_1: billingAddress.address_1 || "",
          billing_address_2: billingAddress.address_2 || "",
          billing_country: billingAddress.country || "",
          billing_city: billingAddress.city || "",
          billing_pobox: billingAddress.pobox || "",
          billing_company_name: billingAddress.company_name || billingAddress.company || "",

          // Shipping address
          shipping_first_name: shippingAddress.first_name || "",
          shipping_last_name: shippingAddress.last_name || "",
          shipping_phone: shippingAddress.phone || "",
          shipping_email: shippingAddress.email || "",
          shipping_address_1: shippingAddress.address_1 || "",
          shipping_address_2: shippingAddress.address_2 || "",
          shipping_country: shippingAddress.country || "",
          shipping_city: shippingAddress.city || "",
          shipping_pobox: shippingAddress.pobox || "",
          shipping_company_name: shippingAddress.company_name || shippingAddress.company || "",
        })
        setErrors({})
      } catch (err) {
        console.error("Failed to load customer data", err)
      }
    }

    load()
  }, [getCustomerById, id, isEdit])

  const updateField = (name: keyof CustomerFormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.first_name.trim()) nextErrors.first_name = t("Customer Name is required")
    if (!values.group_id) nextErrors.group_id = t("Group is required")
    if (values.phone && !/^[6-9]\d{9}$/.test(values.phone)) {
      nextErrors.phone = t("Enter valid Indian phone number")
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = t("Enter valid email")
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/customers")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const payLoad = {
      ...values,
      group_id: values.group_id ? Number(values.group_id) : null,
      credit_limit_amount: values.credit_limit_amount || "0",
      gender: values.gender,
      billing_company: values.billing_company_name,
      shipping_company: values.shipping_company_name,
    }

    setIsSubmitting(true)
    try {
      if (isEdit) {
        const response = await editCustomer({ id, payLoad }).unwrap()
        showToast.success(response?.message || t("Customer updated successfully."))
      } else {
        const response = await createCustomer(payLoad).unwrap()
        showToast.success(response?.message || t("Customer created successfully."))
      }
      goBack()
    } catch (err) {
      console.error(err)
      const message = (err as any)?.data?.message || (err as any)?.message
      if (!message) {
        showToast.error(t("Something went wrong."))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabsToRender: CustomerTab[] = ["general", "billing", "shipping"]
  const tabHasErrors = (tab: CustomerTab) => {
    const tabFields: Record<CustomerTab, string[]> = {
      general: ["first_name", "last_name", "group_id", "phone", "email", "credit_limit_amount", "birth_date", "gender", "pobox"],
      billing: Object.keys(initialValues).filter((key) => key.startsWith("billing_")),
      shipping: Object.keys(initialValues).filter((key) => key.startsWith("shipping_")),
    }
    return tabFields[tab].some((field) => Boolean(errors[field]))
  }

  return (
    <DashboardPage padding="none">
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
              disabled={isSubmitting}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isEdit ? t("Edit Customer") : t("Create Customer")}
              </h1>
              <p className="text-xs font-medium text-gray-500">
                {t("Customer profile details, billing, and shipping details.")}
              </p>
            </div>
          </div>
          <Button
            type="submit"
            form="customer-form"
            disabled={isSubmitting}
            className="min-w-28 shrink-0 bg-black text-white hover:bg-black/90"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {t("Saving...")}
              </span>
            ) : isEdit ? (
              t("Update Customer")
            ) : (
              t("Save Customer")
            )}
          </Button>
        </div>
      </div>

      {/* Tab Selector Header */}
      <div className="flex-none">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CustomerTab)}>
          <TabsList variant="line" className="-mb-px w-full justify-start overflow-x-auto">
          {tabsToRender.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              data-invalid={tabHasErrors(tab) ? true : undefined}
              aria-invalid={tabHasErrors(tab) ? true : undefined}
            >
              {t(
                tab === "general"
                  ? "General Info"
                  : tab === "billing"
                    ? "Billing Address"
                    : "Shipping Address"
              )}
              {tabHasErrors(tab) ? (
                <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                  !
                </span>
              ) : null}
            </TabsTrigger>
          ))}
          </TabsList>
        </Tabs>
      </div>

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
        {customerState.isLoading && isEdit ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm animate-pulse">
              <Spinner className="h-5 w-5" />
              {t("Loading customer details...")}
            </div>
          </div>
        ) : (
          <form id="customer-form" onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {t("General Information")}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <UniFieldInput
                      label={t("Customer Name")}
                      required
                      placeholder={t("Provide a unique name.")}
                      value={values.first_name}
                      error={errors.first_name}
                      onChange={(event) => updateField("first_name", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Last Name")}
                      placeholder={t("Provide the last name.")}
                      value={values.last_name}
                      error={errors.last_name}
                      onChange={(event) => updateField("last_name", event.target.value)}
                    />
                    <UniFieldSelect
                      label={t("Group")}
                      required
                      value={values.group_id}
                      onValueChange={(val) => updateField("group_id", val)}
                      placeholder={t("Select Group")}
                      error={errors.group_id}
                      hasOptions={Boolean(groups.length)}
                    >
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </UniFieldSelect>
                    <UniFieldInput
                      label={t("Phone Number")}
                      placeholder={t("Enter 10 digit number")}
                      prefix="+91"
                      prefixPadding="pl-12"
                      maxLength={10}
                      inputMode="numeric"
                      value={values.phone}
                      error={errors.phone}
                      onChange={(event) =>
                        updateField("phone", sanitizePhone(event.target.value))
                      }
                    />
                    <UniFieldInput
                      label={t("Email")}
                      type="email"
                      placeholder={t("Enter email address")}
                      value={values.email}
                      error={errors.email}
                      onChange={(event) => updateField("email", event.target.value)}
                    />
                    <UniFieldSelect
                      label={t("Gender")}
                      value={values.gender}
                      onValueChange={(val) => updateField("gender", val)}
                      placeholder={t("Select Gender")}
                      allowClear
                    >
                      <SelectItem value="male">{t("Male")}</SelectItem>
                      <SelectItem value="female">{t("Female")}</SelectItem>
                    </UniFieldSelect>
                    <DatePicker
                      label={t("Birth Date")}
                      placeholder={t("Pick a date")}
                      value={parseDateValue(values.birth_date)}
                      onChange={(date) => updateField("birth_date", formatDateValue(date))}
                    />
                    <UniFieldInput
                      label={t("PO Box")}
                      placeholder={t("Enter PO Box")}
                      value={values.pobox}
                      onChange={(event) => updateField("pobox", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Credit Limit")}
                      type="number"
                      min="0"
                      prefix={posOptions.currency_symbol}
                      placeholder={t("Enter credit limit")}
                      value={values.credit_limit_amount}
                      onChange={(event) => updateField("credit_limit_amount", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {t("Billing Details")}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <UniFieldInput
                      label={t("Billing First Name")}
                      placeholder={t("Enter first name")}
                      value={values.billing_first_name}
                      onChange={(event) => updateField("billing_first_name", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing Last Name")}
                      placeholder={t("Enter last name")}
                      value={values.billing_last_name}
                      onChange={(event) => updateField("billing_last_name", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing Company")}
                      placeholder={t("Enter company name")}
                      value={values.billing_company_name}
                      onChange={(event) => updateField("billing_company_name", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing Phone")}
                      placeholder={t("Enter phone number")}
                      value={values.billing_phone}
                      onChange={(event) => updateField("billing_phone", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing Email")}
                      type="email"
                      placeholder={t("Enter email address")}
                      value={values.billing_email}
                      onChange={(event) => updateField("billing_email", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing Address 1")}
                      placeholder={t("Address Line 1")}
                      value={values.billing_address_1}
                      onChange={(event) => updateField("billing_address_1", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing Address 2")}
                      placeholder={t("Address Line 2")}
                      value={values.billing_address_2}
                      onChange={(event) => updateField("billing_address_2", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing Country")}
                      placeholder={t("Enter country")}
                      value={values.billing_country}
                      onChange={(event) => updateField("billing_country", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing City")}
                      placeholder={t("Enter city")}
                      value={values.billing_city}
                      onChange={(event) => updateField("billing_city", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Billing PO.Box")}
                      placeholder={t("Enter PO.Box")}
                      value={values.billing_pobox}
                      onChange={(event) => updateField("billing_pobox", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {t("Shipping Details")}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <UniFieldInput
                      label={t("Shipping First Name")}
                      placeholder={t("Enter first name")}
                      value={values.shipping_first_name}
                      onChange={(event) => updateField("shipping_first_name", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping Last Name")}
                      placeholder={t("Enter last name")}
                      value={values.shipping_last_name}
                      onChange={(event) => updateField("shipping_last_name", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping Company")}
                      placeholder={t("Enter company name")}
                      value={values.shipping_company_name}
                      onChange={(event) => updateField("shipping_company_name", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping Phone")}
                      placeholder={t("Enter phone number")}
                      value={values.shipping_phone}
                      onChange={(event) => updateField("shipping_phone", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping Email")}
                      type="email"
                      placeholder={t("Enter email address")}
                      value={values.shipping_email}
                      onChange={(event) => updateField("shipping_email", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping Address 1")}
                      placeholder={t("Address Line 1")}
                      value={values.shipping_address_1}
                      onChange={(event) => updateField("shipping_address_1", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping Address 2")}
                      placeholder={t("Address Line 2")}
                      value={values.shipping_address_2}
                      onChange={(event) => updateField("shipping_address_2", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping Country")}
                      placeholder={t("Enter country")}
                      value={values.shipping_country}
                      onChange={(event) => updateField("shipping_country", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping City")}
                      placeholder={t("Enter city")}
                      value={values.shipping_city}
                      onChange={(event) => updateField("shipping_city", event.target.value)}
                    />
                    <UniFieldInput
                      label={t("Shipping PO.Box")}
                      placeholder={t("Enter PO.Box")}
                      value={values.shipping_pobox}
                      onChange={(event) => updateField("shipping_pobox", event.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
      </div>
    </DashboardPage>
  )
}
