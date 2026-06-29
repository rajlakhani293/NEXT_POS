"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { catalog } from "@/lib/api/catalog"

const fields = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Provide a name to the resource.",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Provide a short description to the tax group.",
    rows: 3,
  },
]

const initialValues = { name: "", description: "" }

export function TaxGroupForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Tax Group"
      fields={fields}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateTaxGroupMutation}
      editHook={(catalog as any).useEditTaxGroupMutation}
      getByIdHook={(catalog as any).useGetTaxGroupByIdMutation}
      buildPayload={(values) => ({
        name: values.name,
        description: values.description || "",
      })}
    />
  )
}
