"use client"

import { useEffect, useRef } from "react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { catalog } from "@/lib/api/catalog"

const initialValues = {
  unit_group_id: "",
  name: "",
  short_name: "",
  factor: "1",
  is_base_unit: false,
}

export function UnitForm(props: any) {
  const hasLoadedUnitGroupsRef = useRef(false)
  const [getUnitGroupsDropdown, unitGroups] = (
    catalog as any
  ).useGetUnitGroupsDropdownMutation()

  useEffect(() => {
    if (!props.isOpen || hasLoadedUnitGroupsRef.current) return
    hasLoadedUnitGroupsRef.current = true
    getUnitGroupsDropdown()
  }, [getUnitGroupsDropdown, props.isOpen])

  const unitGroupOptions = (unitGroups.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))

  const fields = [
    {
      name: "unit_group_id",
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
      name: "short_name",
      label: "Short Name",
      type: "text",
      placeholder: "e.g. kg, pc, ltr",
      required: true,
    },
    {
      name: "factor",
      label: "Factor",
      type: "number",
      placeholder: "1",
      required: true,
    },
    {
      name: "is_base_unit",
      label: "Base Unit",
      type: "switch",
      note: "Only one base unit is allowed inside one unit group.",
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
        unit_group_id: Number(values.unit_group_id),
        name: values.name,
        short_name: values.short_name,
        factor: values.factor || "1",
        is_base_unit: Boolean(values.is_base_unit),
      })}
    />
  )
}
