"use client"

import { useEffect } from "react"

import DynamicForm from "@/components/DynamicForm"
import { customers } from "@/lib/api/customers"
import { showToast } from "@/lib/toast"

type CustomerFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
}

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
  shipping_address_line_1: string
  shipping_pincode: string
  shipping_city: string
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
  shipping_address_line_1: "",
  shipping_pincode: "",
  shipping_city: "",
}

const buildCustomerFields = () => [
  {
    name: "customer_type",
    label: "Customer Type",
    type: "radio",
    required: true,
    options: [
      { label: "Retail", value: "retail" },
      { label: "Wholesale", value: "wholesale" },
      { label: "Walk In", value: "walk_in" },
    ],
  },
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Enter customer name",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "text",
    placeholder: "Enter 10 digit phone number",
    prefix: "+91",
    prefixPadding: "pl-12",
    maxLength: 10,
    inputMode: "numeric",
    sanitize: (value: string) => value.replace(/\D/g, "").slice(0, 10),
    validate: (value: string) => {
      if (!value) return ""
      if (!/^[6-9]\d{9}$/.test(value)) return "Enter valid Indian phone number"
      return ""
    },
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter customer email",
    validate: (value: string) => {
      if (!value) return ""
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter valid email"
      return ""
    },
  },
  {
    name: "company_name",
    label: "Company Name",
    type: "text",
    placeholder: "Enter company name for B2B customer",
  },
  {
    name: "gst_number",
    label: "GST Number",
    type: "text",
    placeholder: "Enter GST number",
  },
  {
    name: "opening_balance",
    label: "Opening Balance",
    type: "number",
    placeholder: "Enter opening balance",
    prefix: "₹",
  },
  {
    name: "credit_limit_amount",
    label: "Credit Limit",
    type: "number",
    placeholder: "Enter credit limit",
    prefix: "₹",
  },
  {
    name: "billing_address_line_1",
    label: "Billing Address Line 1",
    type: "text",
    placeholder: "Enter billing address",
  },
  {
    name: "billing_pincode",
    label: "Billing Pincode",
    type: "text",
    placeholder: "Enter 6 digit pincode",
    maxLength: 6,
    inputMode: "numeric",
    sanitize: (value: string) => value.replace(/\D/g, "").slice(0, 6),
    validate: (value: string) => {
      if (!value) return ""
      if (!/^\d{6}$/.test(value)) return "Pincode must be 6 digits"
      return ""
    },
  },
  {
    name: "billing_city",
    label: "Billing City",
    type: "text",
    placeholder: "Enter city",
  },
  {
    name: "shipping_address_line_1",
    label: "Shipping Address Line 1",
    type: "text",
    placeholder: "Enter shipping address",
  },
  {
    name: "shipping_pincode",
    label: "Shipping Pincode",
    type: "text",
    placeholder: "Enter 6 digit pincode",
    maxLength: 6,
    inputMode: "numeric",
    sanitize: (value: string) => value.replace(/\D/g, "").slice(0, 6),
    validate: (value: string) => {
      if (!value) return ""
      if (!/^\d{6}$/.test(value)) return "Pincode must be 6 digits"
      return ""
    },
  },
  {
    name: "shipping_city",
    label: "Shipping City",
    type: "text",
    placeholder: "Enter city",
  },
]

export function CustomerForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
}: CustomerFormProps) {
  const [createCustomer] = (customers as any).useCreateCustomerMutation()
  const [editCustomer] = (customers as any).useEditCustomerMutation()
  const [getCustomerById, { data, isLoading }] = (
    customers as any
  ).useGetCustomerByIdMutation()

  useEffect(() => {
    if (isOpen && editId) {
      getCustomerById({ id: editId })
    }
  }, [editId, getCustomerById, isOpen])

  const record = data?.data
  const billingAddress = record?.addresses?.billing || record?.address || {}
  const shippingAddress = record?.addresses?.shipping || {}
  const customerFields = buildCustomerFields()
  const formValues: CustomerFormValues =
    editId && record
      ? {
          name: record.name || "",
          phone: record.phone || "",
          email: record.email || "",
          customer_type: record.customer_type || "retail",
          company_name: record.company_name || "",
          gst_number: record.gst_number || "",
          opening_balance: record.opening_balance
            ? String(record.opening_balance)
            : "",
          credit_limit_amount: record.credit_limit_amount
            ? String(record.credit_limit_amount)
            : "",
          billing_address_line_1: billingAddress.address_line_1 || "",
          billing_pincode: billingAddress.pincode || "",
          billing_city: billingAddress.city || "",
          shipping_address_line_1: shippingAddress.address_line_1 || "",
          shipping_pincode: shippingAddress.pincode || "",
          shipping_city: shippingAddress.city || "",
        }
      : initialValues

  const handleSubmit = async (values: CustomerFormValues) => {
    const payLoad = {
      ...values,
      opening_balance: values.opening_balance || "0",
      credit_limit_amount: values.credit_limit_amount || "0",
    }

    if (editId) {
      const response = await editCustomer({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || "Customer updated successfully.")
    } else {
      const response = await createCustomer(payLoad).unwrap()
      showToast.success(response?.message || "Customer created successfully.")
    }

    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      key={editId || "create-customer"}
      fields={customerFields as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? "Edit Customer" : "Create Customer"}
      isOpen={isOpen}
      formWidth="w-[640px]"
      isLoading={Boolean(editId) && isLoading}
    />
  )
}
