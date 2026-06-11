"use client"

import { useEffect, useRef } from "react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { catalog } from "@/lib/api/catalog"

const initialValues = {
  tax_group_id: "",
  name: "",
  rate: "",
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
      name: "tax_group_id",
      label: "Tax Group",
      type: "select",
      placeholder: "Select tax group",
      required: true,
      options: taxGroupOptions,
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter tax name",
      required: true,
    },
    {
      name: "rate",
      label: "Rate (%)",
      type: "number",
      placeholder: "18",
      required: true,
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
        tax_group_id: Number(values.tax_group_id),
        name: values.name,
        rate: values.rate || "0",
      })}
    />
  )
}
