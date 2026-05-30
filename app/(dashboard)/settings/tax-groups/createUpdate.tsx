"use client";

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form";
import { catalog } from "@/lib/api/catalog";

const fields = [
  { name: "name", label: "Name", type: "text", placeholder: "Enter tax group name", required: true },
  { name: "code", label: "Code", type: "text", placeholder: "Auto generate if blank" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Enter description", rows: 3 },
];

const initialValues = { name: "", code: "", description: "" };

export function TaxGroupForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Tax Group"
      fields={fields}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateTaxGroupMutation}
      editHook={(catalog as any).useEditTaxGroupMutation}
      getByIdHook={(catalog as any).useGetTaxGroupByIdMutation}
      buildPayload={(values) => ({
        name: values.name,
        code: values.code || undefined,
        description: values.description || "",
      })}
    />
  );
}
