"use client"

import { useEffect, useState } from "react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { UnitGroupForm } from "@/app/(dashboard)/inventory/unit-groups/createUpdate"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { blankToNull } from "@/lib/utils"

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
  const { t } = useTranslation()
  const [isUnitGroupFormOpen, setIsUnitGroupFormOpen] = useState(false)
  const [getUnitGroupsDropdown, unitGroups] = (catalog as any).useGetUnitGroupsDropdownMutation()

  useEffect(() => {
    if (!props.isOpen) return
    getUnitGroupsDropdown()
  }, [props.isOpen])

  const unitGroupOptions = (unitGroups.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))
  const formInitialValues = {
    ...initialValues,
    group_id: unitGroupOptions[0]?.value
      ? String(unitGroupOptions[0].value)
      : initialValues.group_id,
  }

  const fields = [
    {
      name: "name",
      label: t("Name"),
      type: "text",
      placeholder: t("Enter unit name"),
      required: true,
    },
    {
      name: "identifier",
      label: t("Identifier"),
      type: "text",
      placeholder: t("Provide a unique value for this unit. Might be composed from a name but shouldn't include space or special characters."),
      // required: true,
    },
    {
      name: "preview_url",
      label: t("Preview URL"),
      type: "text",
      placeholder: t("Preview of the unit."),
    },
    {
      name: "value",
      label: t("Value"),
      type: "number",
      placeholder: "1",
      required: true,
    },
    {
      name: "group_id",
      label: t("Unit Group"),
      type: "select",
      placeholder: t("Select unit group"),
      required: true,
      options: unitGroupOptions,
      onAddNew: () => setIsUnitGroupFormOpen(true),
      addNewLabel: t("Add New Unit Group"),
    },
    {
      name: "base_unit",
      label: t("Base Unit"),
      type: "switch",
      note: t("Determine if the unit is the base unit from the group."),
    },
    {
      name: "description",
      label: t("Description"),
      type: "textarea",
      placeholder: t("Provide a short description about the unit."),
    },
  ]

  return (
    <>
      <CatalogMasterForm
        {...props}
        entityName={t("Unit")}
        fields={fields}
        initialValues={formInitialValues}
        createHook={(catalog as any).useCreateUnitMutation}
        editHook={(catalog as any).useEditUnitMutation}
        getByIdHook={(catalog as any).useGetUnitByIdMutation}
        buildPayload={(values) =>
          blankToNull(
            {
              ...values,
              group_id: Number(values.group_id),
              name: String(values.name || "").trim(),
              value: Number(values.value || 1),
              base_unit: Boolean(values.base_unit),
            },
            ["identifier", "preview_url"]
          )
        }
      />
      <UnitGroupForm
        isOpen={isUnitGroupFormOpen}
        onClose={() => setIsUnitGroupFormOpen(false)}
        onSuccess={() => {
          setIsUnitGroupFormOpen(false)
          getUnitGroupsDropdown()
        }}
        formWidth="w-[440px]"
        nestedDrawer
      />
    </>
  )
}
