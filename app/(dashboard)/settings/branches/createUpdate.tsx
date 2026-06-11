"use client"

import { useEffect, useRef } from "react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { settings } from "@/lib/api/settings"

const initialValues = {
  name: "",
  phone: "",
  address: "",
  city: "",
  state_id: "",
  postal_code: "",
}

const onlyDigits = (value: any, maxLength: number) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, maxLength)

const validateIndianMobile = (value: any) => {
  if (!value) return ""
  const digits = onlyDigits(value, 10)
  if (digits.length !== 10) return "Phone number must be 10 digits"
  if (!/^[6-9]/.test(digits)) {
    return "Phone number must start with 6, 7, 8, or 9"
  }
  return ""
}

export function BranchForm(props: any) {
  const [getStatesDropdown, states] = (settings as any).useGetStatesDropdownMutation()

  useEffect(() => {
    if (!props.isOpen) return
    getStatesDropdown()
  }, [getStatesDropdown, props.isOpen])

  const stateOptions = (states.data?.data || []).map((state: any) => ({
    label: state.name,
    value: state.id,
  }))

  return (
    <CatalogMasterForm
      {...props}
      entityName="Branch"
      fields={[
        {
          name: "name",
          label: "Branch Name",
          placeholder: "Enter branch name",
          type: "text",
          required: true,
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "98765 43210",
          type: "number",
          prefix: "+91",
          prefixPadding: "pl-11",
          maxLength: 10,
          validate: validateIndianMobile,
        },
        {
          name: "address",
          label: "Address",
          placeholder: "Enter address",
          type: "textarea",
          rows: 3,
        },
        {
          name: "city",
          label: "City",
          placeholder: "Enter city",
          type: "text",
        },
        {
          name: "state_id",
          label: "State",
          placeholder: "Select state",
          type: "select",
          options: stateOptions,
        },
        {
          name: "postal_code",
          label: "Postal Code",
          placeholder: "6 digit postal code",
          type: "text",
          inputMode: "numeric",
          maxLength: 6,
          sanitize: (value: any) => onlyDigits(value, 6),
          validate: (value: any) =>
            value && String(value).length !== 6
              ? "Postal code must be 6 digits"
              : "",
        },
      ]}
      initialValues={initialValues}
      createHook={(settings as any).useCreateBranchMutation}
      editHook={(settings as any).useEditBranchMutation}
      getByIdHook={(settings as any).useGetBranchByIdMutation}
      buildPayload={(values) => ({
        ...values,
        phone: values.phone ? onlyDigits(values.phone, 10) : "",
        state_id: values.state_id ? Number(values.state_id) : undefined,
      })}
    />
  )
}
