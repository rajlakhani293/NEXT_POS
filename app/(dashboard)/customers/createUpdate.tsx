"use client"

import { useEffect, useState } from "react"

import DynamicForm from "@/components/DynamicForm"
import { customers } from "@/lib/api/customers"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type CustomerFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
}

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

const buildCustomerFields = (
  groups: { id: number | string; name: string }[],
  t: (key: string) => string
) => [
  {
    name: "first_name",
    label: t("Customer Name"),
    type: "text",
    placeholder: t("Provide a unique name for the customer."),
    required: true,
  },
  {
    name: "last_name",
    label: t("Last Name"),
    type: "text",
    placeholder: t("Provide the customer last name"),
  },
  {
    name: "credit_limit_amount",
    label: t("Credit Limit"),
    type: "number",
    placeholder: t("Set what should be the limit of the purchase on credit."),
    prefix: "₹",
  },
  {
    name: "group_id",
    label: t("Group"),
    type: "select",
    placeholder: t("Assign the customer to a group"),
    required: true,
    options: groups.map((group) => ({
      label: group.name,
      value: group.id,
    })),
  },
  {
    name: "birth_date",
    label: t("Birth Date"),
    type: "date",
    placeholder: t("Displays the customer birth date"),
  },
  {
    name: "phone",
    label: t("Phone Number"),
    type: "text",
    placeholder: t("Enter 10 digit phone number"),
    prefix: "+91",
    prefixPadding: "pl-12",
    maxLength: 10,
    inputMode: "numeric",
    sanitize: (value: string) => value.replace(/\D/g, "").slice(0, 10),
    validate: (value: string) => {
      if (!value) return ""
      if (value.length > 0 && value.length < 6) return t("The phone number provided is too short.")
      return ""
    },
  },
  {
    name: "email",
    label: t("Email"),
    type: "email",
    placeholder: t("Enter customer email"),
    validate: (value: string) => {
      if (!value) return ""
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("Enter valid email")
      return ""
    },
  },
  {
    name: "pobox",
    label: t("PO Box"),
    type: "text",
    placeholder: t("Provide the customer PO.Box"),
  },
  {
    name: "gender",
    label: t("Gender"),
    type: "select",
    placeholder: t("Provide the customer gender"),
    allowClear: true,
    options: [
      { label: t("Not Defined"), value: "not_defined" },
      { label: t("Male"), value: "male" },
      { label: t("Female"), value: "female" },
    ],
  },
  {
    name: "billing_first_name",
    label: t("Billing First Name"),
    type: "text",
  },
  {
    name: "billing_last_name",
    label: t("Billing Last Name"),
    type: "text",
  },
  {
    name: "billing_phone",
    label: t("Billing Phone"),
    type: "text",
  },
  {
    name: "billing_email",
    label: t("Billing Email"),
    type: "email",
  },
  {
    name: "billing_address_1",
    label: t("Billing Address 1"),
    type: "text",
  },
  {
    name: "billing_address_2",
    label: t("Billing Address 2"),
    type: "text",
  },
  {
    name: "billing_country",
    label: t("Billing Country"),
    type: "text",
  },
  {
    name: "billing_city",
    label: t("Billing City"),
    type: "text",
  },
  {
    name: "billing_pobox",
    label: t("Billing PO.Box"),
    type: "text",
  },
  {
    name: "billing_company_name",
    label: t("Billing Company"),
    type: "text",
  },
  {
    name: "shipping_first_name",
    label: t("Shipping First Name"),
    type: "text",
  },
  {
    name: "shipping_last_name",
    label: t("Shipping Last Name"),
    type: "text",
  },
  {
    name: "shipping_phone",
    label: t("Shipping Phone"),
    type: "text",
  },
  {
    name: "shipping_email",
    label: t("Shipping Email"),
    type: "email",
  },
  {
    name: "shipping_address_1",
    label: t("Shipping Address 1"),
    type: "text",
  },
  {
    name: "shipping_address_2",
    label: t("Shipping Address 2"),
    type: "text",
  },
  {
    name: "shipping_country",
    label: t("Shipping Country"),
    type: "text",
  },
  {
    name: "shipping_city",
    label: t("Shipping City"),
    type: "text",
  },
  {
    name: "shipping_pobox",
    label: t("Shipping PO.Box"),
    type: "text",
  },
  {
    name: "shipping_company_name",
    label: t("Shipping Company"),
    type: "text",
  },
]

export function CustomerForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
}: CustomerFormProps) {
  const { t } = useTranslation()
  const [createCustomer] = (customers as any).useCreateCustomerMutation()
  const [editCustomer] = (customers as any).useEditCustomerMutation()
  const [getCustomerById, { data, isLoading }] = (
    customers as any
  ).useGetCustomerByIdMutation()
  const [getCustomerGroupsDropdown] = (
    customers as any
  ).useGetCustomerGroupsDropdownMutation()
  const [groups, setGroups] = useState<{ id: number | string; name: string }[]>([])

  useEffect(() => {
    if (isOpen && editId) {
      getCustomerById({ id: editId })
    }
  }, [editId, getCustomerById, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const loadGroups = async () => {
      const response = await getCustomerGroupsDropdown().unwrap()
      setGroups(response?.data || [])
    }

    loadGroups()
  }, [getCustomerGroupsDropdown, isOpen])

  const record = data?.data
  const billingAddress = record?.addresses?.billing || record?.address || {}
  const shippingAddress = record?.addresses?.shipping || {}
  const customerFields = buildCustomerFields(groups, t)
  const formValues: CustomerFormValues =
    editId && record
      ? {
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
          gender: record.gender || "not_defined",
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
        }
      : initialValues

  const handleSubmit = async (values: CustomerFormValues) => {
    const payLoad = {
      ...values,
      group_id: values.group_id ? Number(values.group_id) : null,
      credit_limit_amount: values.credit_limit_amount || "0",
      gender: values.gender === "not_defined" ? "" : values.gender,
    }

    if (editId) {
      const response = await editCustomer({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || t("Customer updated successfully."))
    } else {
      const response = await createCustomer(payLoad).unwrap()
      showToast.success(response?.message || t("Customer created successfully."))
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
      title={editId ? t("Edit customer") : t("Create a new customer")}
      isOpen={isOpen}
      formWidth="w-[640px]"
      isLoading={Boolean(editId) && isLoading}
    />
  )
}
