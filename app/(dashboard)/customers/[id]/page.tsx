"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ReceiptText } from "lucide-react"

import {
  CustomerAddressAddon,
  type AddressFormValues,
  type AddressType,
} from "@/app/(dashboard)/customers/[id]/customerAddress"
import DynamicTable from "@/components/DynamicTable"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

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

  // Billing address
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

  // Shipping address
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

  // Billing address
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

  // Shipping address
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

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-amber-50 text-amber-700",
  unpaid: "bg-rose-50 text-rose-700",
  refunded: "bg-sky-50 text-sky-700",
  partially_refunded: "bg-indigo-50 text-indigo-700",
  hold: "bg-gray-100 text-gray-700",
  void: "bg-zinc-200 text-zinc-700",
  order_void: "bg-zinc-200 text-zinc-700",
}

export default function CustomerFormPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const formatMoney = (value: any) =>
    `${posOptions.currency_symbol}${Number(value || 0).toFixed(posOptions.currency_precision)}`
  const id = params.id as string
  const isEdit = id !== "create"

  const [values, setValues] = useState<CustomerFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [addressFormType, setAddressFormType] = useState<AddressType | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<"general" | "orders">("general")
  const [ordersRows, setOrdersRows] = useState<any[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersSearch, setOrdersSearch] = useState("")
  const lastOrderRequestRef = useRef("")

  const [groups, setGroups] = useState<{ id: number; name: string }[]>([])

  const contentRef = useRef<HTMLDivElement>(null)
  const paginationSentinelRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")

  const [createCustomer] = (customers as any).useCreateCustomerMutation()
  const [editCustomer] = (customers as any).useEditCustomerMutation()
  const [getCustomerById, customer] = (
    customers as any
  ).useGetCustomerByIdMutation()
  const [getCustomerOrderHistory, orderHistoryState] = (
    customers as any
  ).useGetCustomerOrderHistoryMutation()
  const [getCustomerGroupsDropdown] = (
    customers as any
  ).useGetCustomerGroupsDropdownMutation()

  useEffect(() => {
    if (searchParams.get("tab") === "orders") {
      setActiveTab("orders")
    }
  }, [searchParams])

  const loadOrderHistory = async (
    targetPage = ordersPage,
    search = ordersSearch,
    force = false
  ) => {
    if (!id || id === "create") return

    const requestKey = `${id}:${targetPage}:${search}`
    if (!force && lastOrderRequestRef.current === requestKey) return
    lastOrderRequestRef.current = requestKey

    try {
      const response = await getCustomerOrderHistory({
        id,
        payLoad: { page: targetPage, limit: 10, search },
      }).unwrap()
      const data = response?.data || {}
      setOrdersRows(data.items || [])
      setTotalOrders(data.total || 0)
    } catch (err) {
      console.error("Failed to load order history", err)
    }
  }

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
    if (activeTab === "orders") {
      loadOrderHistory(ordersPage, ordersSearch)
    }
  }, [activeTab, id, ordersPage, ordersSearch])

  const handleOrdersFilterChange = (action: string, payload?: any) => {
    if (action === "search") {
      setOrdersPage(1)
      setOrdersSearch(String(payload || ""))
      loadOrderHistory(1, String(payload || ""), true)
    }
  }

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
        birth_date: record.birth_date || "",
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
        billing_company_name: billingAddress.company_name || "",

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
        shipping_company_name: shippingAddress.company_name || "",
      })
      setErrors({})
    }

    load()
  }, [getCustomerById, id, isEdit])

  useEffect(() => {
    const sentinel = paginationSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterStuck(!entry.isIntersecting),
      {
        threshold: 0.01,
        root: contentRef.current,
        rootMargin: "0px 0px -80px 0px",
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [customer.isLoading])

  const updateField = (name: keyof CustomerFormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const getAddressValues = (type: AddressType): AddressFormValues => ({
    first_name: values[`${type}_first_name` as keyof CustomerFormValues],
    last_name: values[`${type}_last_name` as keyof CustomerFormValues],
    phone: values[`${type}_phone` as keyof CustomerFormValues],
    email: values[`${type}_email` as keyof CustomerFormValues],
    address_1: values[`${type}_address_1` as keyof CustomerFormValues],
    address_2: values[`${type}_address_2` as keyof CustomerFormValues],
    country: values[`${type}_country` as keyof CustomerFormValues],
    city: values[`${type}_city` as keyof CustomerFormValues],
    pobox: values[`${type}_pobox` as keyof CustomerFormValues],
    company_name: values[`${type}_company_name` as keyof CustomerFormValues],
  })

  const handleAddressChange = (
    addressType: AddressType,
    addressValues: AddressFormValues
  ) => {
    setValues((current) => ({
      ...current,
      [`${addressType}_first_name`]: addressValues.first_name,
      [`${addressType}_last_name`]: addressValues.last_name,
      [`${addressType}_phone`]: addressValues.phone,
      [`${addressType}_email`]: addressValues.email,
      [`${addressType}_address_1`]: addressValues.address_1,
      [`${addressType}_address_2`]: addressValues.address_2,
      [`${addressType}_country`]: addressValues.country,
      [`${addressType}_city`]: addressValues.city,
      [`${addressType}_pobox`]: addressValues.pobox,
      [`${addressType}_company_name`]: addressValues.company_name,
    }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.first_name.trim()) nextErrors.first_name = t("First name is required")
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
    } finally {
      setIsSubmitting(false)
    }
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
                {isEdit ? t("Edit Customer") : t("Create Customer")}
              </h1>
            </div>
          </div>
          {isEdit ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={cn(
                  "border-b-2 px-3 py-1.5 text-sm font-semibold transition-colors duration-150",
                  activeTab === "general"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {t("Details")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "border-b-2 px-3 py-1.5 text-sm font-semibold transition-colors duration-150",
                  activeTab === "orders"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {t("Order History")}
              </button>
            </div>
          ) : null}
        </div>
      </div>


      <div ref={contentRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {customer.isLoading && isEdit ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm">
              <Spinner className="h-5 w-5" />
              {t("Loading customer data...")}
            </div>
          </div>
        ) : null}

        {activeTab === "orders" && isEdit ? (
          <div className="p-4">
            <DynamicTable
              data={ordersRows}
              columns={[
                { key: "code", title: t("Order Code") },
                { key: "order_type", title: t("Type") },
                {
                  key: "payment_status",
                  title: t("Payment Status"),
                  render: (value: string) => (
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        paymentStatusColors[value] || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {t(String(value || "-").replaceAll("_", " "))}
                    </span>
                  ),
                },
                { key: "delivery_status", title: t("Delivery Status") },
                { key: "subtotal", title: t("Subtotal"), render: (value: any) => formatMoney(value) },
                { key: "tax_amount", title: t("Tax"), render: (value: any) => formatMoney(value) },
                { key: "shipping", title: t("Shipping"), render: (value: any) => formatMoney(value) },
                { key: "total", title: t("Total"), render: (value: any) => formatMoney(value) },
                { key: "created_at", title: t("Date"), render: (value: any) => new Date(value).toLocaleDateString() },
              ]}
              tableTitle={t("Orders History")}
              showSearch
              searchTerm={ordersSearch}
              onFilterChange={handleOrdersFilterChange}
              currentPage={ordersPage}
              itemsPerPage={10}
              totalItems={totalOrders}
              onPageChange={setOrdersPage}
              isLoading={orderHistoryState.isLoading}
              onEdit={(record: any) => router.push(`/sales/${record.id}`)}
              rowActions={(_, record) => [
                {
                  key: "receipt",
                  label: t("Receipt"),
                  labelText: t("Receipt"),
                  icon: <ReceiptText className="size-4" />,
                  onClick: () => router.push(`/sales/${record.id}/receipt`),
                },
              ]}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

          <div className="px-4 pt-4">
            <div className="space-y-5">
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    {t("Customer Details")}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UniFieldInput
                    label={t("First Name")}
                    required
                    placeholder={t("Enter first name")}
                    value={values.first_name}
                    error={errors.first_name}
                    onChange={(event) => updateField("first_name", event.target.value)}
                  />
                  <UniFieldInput
                    label={t("Last Name")}
                    placeholder={t("Enter last name")}
                    value={values.last_name}
                    error={errors.last_name}
                    onChange={(event) => updateField("last_name", event.target.value)}
                  />
                  <UniFieldInput
                    label={t("Phone Number")}
                    placeholder={t("Enter 10 digit phone number")}
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
                    placeholder={t("Enter customer email")}
                    value={values.email}
                    error={errors.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      {t("Group")} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={values.group_id}
                      onValueChange={(val) => updateField("group_id", val)}
                    >
                      <SelectTrigger className="h-10 w-full border-2 bg-white">
                        <SelectValue placeholder={t("Select Group")} />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.group_id && (
                      <p className="text-xs text-red-500 font-semibold">{errors.group_id}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      {t("Gender")}
                    </label>
                    <Select
                      value={values.gender || "not_defined"}
                      onValueChange={(val) => updateField("gender", val === "not_defined" ? "" : val)}
                    >
                      <SelectTrigger className="h-10 w-full border-2 bg-white">
                        <SelectValue placeholder={t("Not Defined")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_defined">{t("Not Defined")}</SelectItem>
                        <SelectItem value="male">{t("Male")}</SelectItem>
                        <SelectItem value="female">{t("Female")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <UniFieldInput
                    label={t("Birth Date")}
                    type="date"
                    value={values.birth_date ? values.birth_date.split(" ")[0] : ""}
                    onChange={(event) => updateField("birth_date", event.target.value)}
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
                    step="0.01"
                    prefix={posOptions.currency_symbol}
                    placeholder={t("Enter credit limit")}
                    value={values.credit_limit_amount}
                    onChange={(event) =>
                      updateField("credit_limit_amount", event.target.value)
                    }
                  />
                </div>
              </section>

              <CustomerAddressAddon
                openType={addressFormType}
                onOpenChange={setAddressFormType}
                billingAddress={getAddressValues("billing")}
                shippingAddress={getAddressValues("shipping")}
                onAddressChange={handleAddressChange}
              />
            </div>
          </div>

          <div ref={paginationSentinelRef} className="h-px w-full" />

          <footer
            className={cn(
              "sticky z-50 transition-all duration-300 ease-in-out",
              isFooterStuck ? "bottom-2 mx-3" : "bottom-0 mx-0"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-end gap-x-2 rounded-b-xl bg-white/90 p-3 backdrop-blur-md transition-shadow duration-200",
                isFooterStuck
                  ? "rounded-t-xl border border-gray-200"
                  : "rounded-t-none border-t-2 border-gray-100"
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
              >
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-28 bg-black text-white hover:bg-black/90"
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
          </footer>
        </form>
        )}
      </div>

    </div>
  )
}
