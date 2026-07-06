"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const initialValues = { name: "", description: "" }

export function UnitGroupForm(props: any) {
  const { t } = useTranslation()
  const fields = [
    {
      name: "name",
      label: t("Name"),
      type: "text",
      placeholder: t("Provide a name to the resource."),
      required: true,
    },
    {
      name: "description",
      label: t("Description"),
      type: "textarea",
      placeholder: t("Enter description"),
      rows: 3,
    },
  ]

  return (
    <CatalogMasterForm
      {...props}
      entityName={t("Unit Group")}
      fields={fields}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateUnitGroupMutation}
      editHook={(catalog as any).useEditUnitGroupMutation}
      getByIdHook={(catalog as any).useGetUnitGroupByIdMutation}
      buildPayload={(values) => ({
        name: values.name,
        description: values.description || "",
      })}
    />
  )
}
