"use client"

import { useEffect } from "react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { catalog } from "@/lib/api/catalog"

const initialValues = {
  group_id: "",
  name: "",
  identifier: "",
  value: "1",
  base_unit: false,
  preview_url: "",
  description: "",
}

export function UnitForm(props: any) {
  const [getUnitGroupsDropdown, unitGroups] = (catalog as any).useGetUnitGroupsDropdownMutation()

  useEffect(() => {
    if (!props.isOpen) return
    getUnitGroupsDropdown()
  }, [props.isOpen])

  const unitGroupOptions = (unitGroups.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))

  const fields = [
    {
      name: "group_id",
      label: "Unit Group",
      type: "select",
      placeholder: "Select unit group",
      required: true,
      options: unitGroupOptions,
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter unit name",
      required: true,
    },
    {
      name: "identifier",
      label: "Identifier (Short Name)",
      type: "text",
      placeholder: "e.g. kg, pc, ltr",
      required: true,
    },
    {
      name: "value",
      label: "Value",
      type: "number",
      placeholder: "1",
      required: true,
    },
    {
      name: "base_unit",
      label: "Base Unit",
      type: "switch",
      note: "Only one base unit is allowed inside one unit group.",
    },
    {
      name: "preview_url",
      label: "Preview URL",
      type: "text",
      placeholder: "Enter preview URL",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
    },
  ]

  return (
    <CatalogMasterForm
      {...props}
      entityName="Unit"
      fields={fields}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateUnitMutation}
      editHook={(catalog as any).useEditUnitMutation}
      getByIdHook={(catalog as any).useGetUnitByIdMutation}
      buildPayload={(values) => ({
        ...values,
        group_id: Number(values.group_id),
        value: Number(values.value || 1),
        base_unit: Boolean(values.base_unit),
      })}
    />
  )
}
