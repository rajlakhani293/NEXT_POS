"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { purchases } from "@/lib/api/purchases"

const initialValues = {
  name: "",
  email: "",
  phone: "",
  contact_person: "",
  tax_number: "",
  address: "",
}

export function SupplierForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Supplier"
      fields={[
        {
          name: "name",
          label: "Supplier Name",
          placeholder: "Enter supplier name",
          type: "text",
          required: true,
        },
        {
          name: "contact_person",
          label: "Contact Person",
          placeholder: "Enter contact person",
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
          name: "tax_number",
          label: "GST / Tax Number",
          placeholder: "Enter GST or tax number",
          type: "text",
        },
        {
          name: "address",
          label: "Address",
          placeholder: "Enter supplier address",
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
