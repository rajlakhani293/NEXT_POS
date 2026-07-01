"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { settings } from "@/lib/api/settings"

const initialValues = {
  name: "",
  code: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
}

export function BranchForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Branch"
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Branch Name",
          type: "text",
          required: true,
        },
        {
          name: "code",
          label: "Code",
          placeholder: "Code",
          type: "text",
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Phone",
          type: "text",
        },
        {
          name: "address",
          label: "Address",
          placeholder: "Address",
          type: "textarea",
          rows: 3,
        },
        {
          name: "city",
          label: "City",
          placeholder: "City",
          type: "text",
        },
        {
          name: "state",
          label: "State",
          placeholder: "State",
          type: "text",
        },
        {
          name: "postal_code",
          label: "Postal Code",
          placeholder: "Postal Code",
          type: "text",
        },
      ]}
      initialValues={initialValues}
      createHook={(settings as any).useCreateBranchMutation}
      editHook={(settings as any).useEditBranchMutation}
      getByIdHook={(settings as any).useGetBranchByIdMutation}
      buildPayload={(values) => ({
        name: values.name,
        code: values.code || "",
        phone: values.phone || "",
        address: values.address || "",
        city: values.city || "",
        state: values.state || "",
        postal_code: values.postal_code || "",
      })}
    />
  )
}
