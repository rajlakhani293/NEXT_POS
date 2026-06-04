"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckIcon, ChevronDownIcon } from "lucide-react"

import {
  CustomerAddressAddon,
  type AddressFormValues,
  type AddressType,
} from "@/app/(dashboard)/customers/[id]/customerAddress"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { customers } from "@/lib/api/customers"
import { settings } from "@/lib/api/settings"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type CustomerFormValues = {
  name: string
  phone: string
  email: string
  customer_type: string
  company_name: string
  gst_number: string
  opening_balance: string
  credit_limit_amount: string
  billing_address_line_1: string
  billing_pincode: string
  billing_city: string
  billing_state_id: string
  shipping_address_line_1: string
  shipping_pincode: string
  shipping_city: string
  shipping_state_id: string
}

const initialValues: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  customer_type: "retail",
  company_name: "",
  gst_number: "",
  opening_balance: "",
  credit_limit_amount: "",
  billing_address_line_1: "",
  billing_pincode: "",
  billing_city: "",
  billing_state_id: "",
  shipping_address_line_1: "",
  shipping_pincode: "",
  shipping_city: "",
  shipping_state_id: "",
}

const customerTypes = [
  { label: "Retail", value: "retail" },
  { label: "Wholesale", value: "wholesale" },
  { label: "Walk In", value: "walk_in" },
]

function OpeningBalanceDropdown({
  value,
  onChange,
}: {
  value: "debit" | "credit"
  onChange: (value: "debit" | "credit") => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-28 border-2 bg-muted/30 px-3 text-sm font-semibold text-gray-700 shadow-none"
        >
          {value === "credit" ? "Credit" : "Debit"}
          <ChevronDownIcon className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuItem
          onClick={() => onChange("debit")}
          className={cn(
            value === "debit" && "bg-accent font-semibold text-accent-foreground"
          )}
        >
          {value === "debit" ? (
            <CheckIcon className="size-4" />
          ) : (
            <span className="size-4" />
          )}
          Debit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange("credit")}
          className={cn(
            value === "credit" && "bg-accent font-semibold text-accent-foreground"
          )}
        >
          {value === "credit" ? (
            <CheckIcon className="size-4" />
          ) : (
            <span className="size-4" />
          )}
          Credit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const sanitizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10)
const normalizeAmount = (value: any) => Math.abs(Number(value || 0)).toString()

export default function CustomerFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"

  const [values, setValues] = useState<CustomerFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [openingBalanceType, setOpeningBalanceType] = useState<
    "debit" | "credit"
  >("debit")
  const [addressFormType, setAddressFormType] = useState<AddressType | null>(
    null
  )
  const contentRef = useRef<HTMLDivElement>(null)
  const paginationSentinelRef = useRef<HTMLDivElement>(null)
  const loadKeyRef = useRef("")

  const [createCustomer] = (customers as any).useCreateCustomerMutation()
  const [editCustomer] = (customers as any).useEditCustomerMutation()
  const [getCustomerById, customer] = (
    customers as any
  ).useGetCustomerByIdMutation()
  const [getStatesDropdown, states] = (
    settings as any
  ).useGetStatesDropdownMutation()

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await getStatesDropdown()

      if (!isEdit) {
        setValues(initialValues)
        setOpeningBalanceType("debit")
        setErrors({})
        return
      }

      const response = await getCustomerById({ id }).unwrap()
      const record = response?.data
      if (!record) return

      const billingAddress = record.addresses?.billing || record.address || {}
      const shippingAddress = record.addresses?.shipping || {}
      const openingBalance = Number(record.opening_balance || 0)

      setValues({
        name: record.name || "",
        phone: record.phone || "",
        email: record.email || "",
        customer_type: record.customer_type || "retail",
        company_name: record.company_name || "",
        gst_number: record.gst_number || "",
        opening_balance: openingBalance ? normalizeAmount(openingBalance) : "",
        credit_limit_amount: record.credit_limit_amount
          ? String(record.credit_limit_amount)
          : "",
        billing_address_line_1: billingAddress.address_line_1 || "",
        billing_pincode: billingAddress.pincode || "",
        billing_city: billingAddress.city || "",
        billing_state_id: billingAddress.state_id
          ? String(billingAddress.state_id)
          : "",
        shipping_address_line_1: shippingAddress.address_line_1 || "",
        shipping_pincode: shippingAddress.pincode || "",
        shipping_city: shippingAddress.city || "",
        shipping_state_id: shippingAddress.state_id
          ? String(shippingAddress.state_id)
          : "",
      })
      setOpeningBalanceType(openingBalance < 0 ? "credit" : "debit")
      setErrors({})
    }

    load()
  }, [getCustomerById, getStatesDropdown, id, isEdit])

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

  const stateOptions = (states.data?.data || []).map((state: any) => ({
    label: state.name,
    value: String(state.id),
  }))

  const getAddressValues = (type: AddressType): AddressFormValues => ({
    address_line_1: values[`${type}_address_line_1` as keyof CustomerFormValues],
    pincode: values[`${type}_pincode` as keyof CustomerFormValues],
    city: values[`${type}_city` as keyof CustomerFormValues],
    state_id: values[`${type}_state_id` as keyof CustomerFormValues],
  })

  const handleAddressChange = (
    addressType: AddressType,
    addressValues: AddressFormValues
  ) => {
    setValues((current) => ({
      ...current,
      [`${addressType}_address_line_1`]: addressValues.address_line_1,
      [`${addressType}_pincode`]: addressValues.pincode,
      [`${addressType}_city`]: addressValues.city,
      [`${addressType}_state_id`]: addressValues.state_id,
    }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = "Name is required"
    if (values.phone && !/^[6-9]\d{9}$/.test(values.phone)) {
      nextErrors.phone = "Enter valid Indian phone number"
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Enter valid email"
    }
    if (values.billing_pincode && !/^\d{6}$/.test(values.billing_pincode)) {
      nextErrors.billing_pincode = "Pincode must be 6 digits"
    }
    if (values.shipping_pincode && !/^\d{6}$/.test(values.shipping_pincode)) {
      nextErrors.shipping_pincode = "Pincode must be 6 digits"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/customers")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const openingBalanceAmount = Math.abs(Number(values.opening_balance || 0))
    const signedOpeningBalance =
      openingBalanceType === "credit"
        ? -openingBalanceAmount
        : openingBalanceAmount

    const payLoad = {
      ...values,
      opening_balance: String(signedOpeningBalance),
      credit_limit_amount: values.credit_limit_amount || "0",
      billing_state_id: values.billing_state_id
        ? Number(values.billing_state_id)
        : undefined,
      shipping_state_id: values.shipping_state_id
        ? Number(values.shipping_state_id)
        : undefined,
    }

    setIsSubmitting(true)
    try {
      if (isEdit) {
        const response = await editCustomer({ id, payLoad }).unwrap()
        showToast.success(response?.message || "Customer updated successfully.")
      } else {
        const response = await createCustomer(payLoad).unwrap()
        showToast.success(response?.message || "Customer created successfully.")
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
                {isEdit ? "Edit Customer" : "Create Customer"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {customer.isLoading && isEdit ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm">
              <Spinner className="h-5 w-5" />
              Loading customer data...
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="px-4 pt-4">
            <div className="space-y-5">
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Customer Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <ButtonGroup className="mb-4 overflow-hidden rounded-md bg-white">
                      {customerTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant="ghost"
                          className={cn(
                            "min-w-24 text-sm font-semibold border shadow-none hover:bg-gray-50",
                            values.customer_type === type.value &&
                            "bg-blue-600 text-white hover:bg-blue-600 hover:text-white border-0"
                          )}
                          onClick={() =>
                            updateField("customer_type", type.value)
                          }
                        >
                          {type.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </div>

                  <UniFieldInput
                    label="Name"
                    required
                    placeholder="Enter customer name"
                    value={values.name}
                    error={errors.name}
                    onChange={(event) => updateField("name", event.target.value)}
                  />
                  <UniFieldInput
                    label="Phone Number"
                    placeholder="Enter 10 digit phone number"
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
                    label="Email"
                    type="email"
                    placeholder="Enter customer email"
                    value={values.email}
                    error={errors.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                  />
                  <UniFieldInput
                    label="Opening Balance"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="₹"
                    className={cn(
                      openingBalanceType === "credit"
                        ? "text-emerald-700"
                        : "text-red-600"
                    )}
                    prefixClassName={cn(
                      openingBalanceType === "credit"
                        ? "text-emerald-700"
                        : "text-red-600"
                    )}
                    placeholder="Enter opening balance"
                    value={values.opening_balance}
                    onChange={(event) =>
                      updateField("opening_balance", event.target.value)
                    }
                    addonAfter={
                      <OpeningBalanceDropdown
                        value={openingBalanceType}
                        onChange={setOpeningBalanceType}
                      />
                    }
                  />
                  <p
                    className={cn(
                      "-mt-2 text-xs font-semibold md:col-start-2",
                      openingBalanceType === "credit"
                        ? "text-emerald-700"
                        : "text-red-600"
                    )}
                  >
                    {openingBalanceType === "credit"
                      ? `Credit: customer has ₹${values.opening_balance || "0"} advance.`
                      : `Debit: customer owes ₹${values.opening_balance || "0"}.`}
                  </p>
                  <UniFieldInput
                    label="Credit Limit"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="₹"
                    placeholder="Enter credit limit"
                    value={values.credit_limit_amount}
                    onChange={(event) =>
                      updateField("credit_limit_amount", event.target.value)
                    }
                  />
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="mb-4 text-base font-semibold text-gray-900">
                  Company Details
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UniFieldInput
                    label="Company Name"
                    placeholder="Enter company name"
                    value={values.company_name}
                    onChange={(event) =>
                      updateField("company_name", event.target.value)
                    }
                  />
                  <UniFieldInput
                    label="GST Number"
                    placeholder="Enter GST number"
                    value={values.gst_number}
                    onChange={(event) =>
                      updateField("gst_number", event.target.value)
                    }
                  />
                </div>
              </section>

              <CustomerAddressAddon
                openType={addressFormType}
                onOpenChange={setAddressFormType}
                billingAddress={getAddressValues("billing")}
                shippingAddress={getAddressValues("shipping")}
                stateOptions={stateOptions}
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
                  "Update Customer"
                ) : (
                  "Save Customer"
                )}
              </Button>
            </div>
          </footer>
        </form>
      </div>

    </div>
  )
}
