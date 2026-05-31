"use client";

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form";
import { catalog } from "@/lib/api/catalog";

const fields = [
  { name: "name", label: "Name", type: "text", placeholder: "Enter unit group name", required: true },
  { name: "description", label: "Description", type: "textarea", placeholder: "Enter description", rows: 3 },
];

const initialValues = { name: "", description: "" };

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
        description: values.description || "",
      })}
    />
  );
}
