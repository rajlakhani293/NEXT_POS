"use client"

import { useEffect } from "react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { catalog } from "@/lib/api/catalog"

const initialValues = {
  name: "",
  tax_group_id: "",
  rate: "",
  description: "",
}

export function TaxForm(props: any) {
  const [getTaxGroupsDropdown, taxGroups] = (
    catalog as any
  ).useGetTaxGroupsDropdownMutation()

  useEffect(() => {
    if (!props.isOpen) return
    getTaxGroupsDropdown()
  }, [getTaxGroupsDropdown, props.isOpen])

  const taxGroupOptions = (taxGroups.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))

  const fields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Provide a name to the tax.",
      required: true,
    },
    {
      name: "tax_group_id",
      label: "Parent",
      type: "select",
      placeholder: "Assign the tax to a tax group.",
      required: true,
      options: taxGroupOptions,
    },
    {
      name: "rate",
      label: "Rate",
      type: "number",
      placeholder: "Define the rate value for the tax.",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Provide a description to the tax.",
      rows: 3,
    },
  ]

  return (
    <CatalogMasterForm
      {...props}
      entityName="Tax"
      fields={fields}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateTaxMutation}
      editHook={(catalog as any).useEditTaxMutation}
      getByIdHook={(catalog as any).useGetTaxByIdMutation}
      buildPayload={(values) => ({
        name: values.name,
        tax_group_id: Number(values.tax_group_id),
        rate: Number(values.rate || "0"),
        description: values.description || "",
      })}
    />
  )
}
