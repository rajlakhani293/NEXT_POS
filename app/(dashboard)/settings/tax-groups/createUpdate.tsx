"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { catalog } from "@/lib/api/catalog"

const fields = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Enter tax group name",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
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
