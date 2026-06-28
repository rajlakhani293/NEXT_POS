"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { purchases } from "@/lib/api/purchases"

const initialValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_1: "",
  address_2: "",
  description: "",
}

export function SupplierForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Supplier"
      fields={[
        {
          name: "first_name",
          label: "First Name",
          placeholder: "Enter first name",
          type: "text",
          required: true,
        },
        {
          name: "last_name",
          label: "Last Name",
          placeholder: "Enter last name",
          type: "text",
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Enter phone number",
          type: "text",
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter email address",
          type: "email",
        },
        {
          name: "address_1",
          label: "Address 1",
          placeholder: "Enter address line 1",
          type: "text",
        },
        {
          name: "address_2",
          label: "Address 2",
          placeholder: "Enter address line 2",
          type: "text",
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Enter supplier details...",
          type: "textarea",
        },
      ]}
      initialValues={initialValues}
      createHook={(purchases as any).useCreateSupplierMutation}
      editHook={(purchases as any).useEditSupplierMutation}
      getByIdHook={(purchases as any).useGetSupplierByIdMutation}
      formWidth="w-[560px]"
    />
  )
}
