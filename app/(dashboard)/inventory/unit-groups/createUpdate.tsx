"use client";

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form";
import { catalog } from "@/lib/api/catalog";

const fields = [
  { name: "name", label: "Name", type: "text", placeholder: "Enter unit group name", required: true },
  { name: "code", label: "Code", type: "text", placeholder: "Auto generate if blank" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Enter description", rows: 3 },
];

const initialValues = { name: "", code: "", description: "" };

export function UnitGroupForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Unit Group"
      fields={fields}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateUnitGroupMutation}
      editHook={(catalog as any).useEditUnitGroupMutation}
      getByIdHook={(catalog as any).useGetUnitGroupByIdMutation}
      buildPayload={(values) => ({
        name: values.name,
        code: values.code || undefined,
        description: values.description || "",
      })}
    />
  );
}
