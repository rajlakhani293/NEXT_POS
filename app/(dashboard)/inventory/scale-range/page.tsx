"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const columns = [
  { key: "name", title: "Name" },
  { key: "range_start", title: "Range Start" },
  { key: "range_end", title: "Range End" },
  { key: "next_scale_plu", title: "Next PLU" },
  { key: "description", title: "Description" },
]

const initialValues = {
  name: "",
  range_start: "",
  range_end: "",
  next_scale_plu: "",
  description: "",
}

function ScaleRangeForm(props: any) {
  const { t } = useTranslation()
  return (
    <CatalogMasterForm
      {...props}
      entityName={t("Scale Range")}
      fields={[
        {
          name: "name",
          label: t("Name"),
          placeholder: t("Provide a name for this PLU range."),
          type: "text",
          required: true,
        },
        {
          name: "range_start",
          label: t("Range Start"),
          placeholder: t("The starting PLU code for this range (e.g., 100 for 0100)."),
          type: "number",
          required: true,
        },
        {
          name: "range_end",
          label: t("Range End"),
          placeholder: t("The ending PLU code for this range (e.g., 999 for 0999)."),
          type: "number",
          required: true,
        },
        {
          name: "next_scale_plu",
          label: t("Next PLU"),
          placeholder: t("The next PLU code to be assigned in this range."),
          type: "number",
          required: true,
        },
        {
          name: "description",
          label: t("Description"),
          placeholder: t("Optional description for this PLU range."),
          type: "textarea",
        },
      ]}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateScaleRangeMutation}
      editHook={(catalog as any).useEditScaleRangeMutation}
      getByIdHook={(catalog as any).useGetScaleRangeByIdMutation}
      buildPayload={(values) => ({
        ...values,
        range_start: Number(values.range_start),
        range_end: Number(values.range_end),
        next_scale_plu: Number(values.next_scale_plu),
      })}
      formWidth="w-[560px]"
    />
  )
}

export default function ScaleRangesPage() {
  const { t } = useTranslation()
  const translatedColumns = columns.map((column) => ({
    ...column,
    title: t(column.title),
  }))

  return (
    <CatalogPageShell
      tableTitle={t("Scale Ranges List")}
      addTitle={t("Add a new scale range")}
      columns={translatedColumns}
      getDataHook={(catalog as any).useGetScaleRangesDataMutation}
      deleteHook={(catalog as any).useDeleteScaleRangeMutation}
      statusHook={(catalog as any).useUpdateScaleRangeStatusMutation}
      FormComponent={ScaleRangeForm}
      deleteTitle={t("Delete Scale Range")}
      deleteDescription={t("Would you like to delete this scale range?")}
    />
  )
}
