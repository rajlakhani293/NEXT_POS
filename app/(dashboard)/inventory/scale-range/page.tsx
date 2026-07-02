"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { catalog } from "@/lib/api/catalog"

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
  return (
    <CatalogMasterForm
      {...props}
      entityName="Scale Range"
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Provide a name for this PLU range.",
          type: "text",
          required: true,
        },
        {
          name: "range_start",
          label: "Range Start",
          placeholder: "The starting PLU code for this range (e.g., 100 for 0100).",
          type: "number",
          required: true,
        },
        {
          name: "range_end",
          label: "Range End",
          placeholder: "The ending PLU code for this range (e.g., 999 for 0999).",
          type: "number",
          required: true,
        },
        {
          name: "next_scale_plu",
          label: "Next PLU",
          placeholder: "The next PLU code to be assigned in this range.",
          type: "number",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Optional description for this PLU range.",
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
  return (
    <CatalogPageShell
      tableTitle="Scale Ranges List"
      addTitle="Add a new scale range"
      columns={columns}
      getDataHook={(catalog as any).useGetScaleRangesDataMutation}
      deleteHook={(catalog as any).useDeleteScaleRangeMutation}
      statusHook={(catalog as any).useUpdateScaleRangeStatusMutation}
      FormComponent={ScaleRangeForm}
      deleteTitle="Delete Scale Range"
      deleteDescription="Would you like to delete this scale range?"
    />
  )
}
