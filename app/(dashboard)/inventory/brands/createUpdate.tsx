"use client";

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form";
import { catalog } from "@/lib/api/catalog";

const fields = [
  { name: "name", label: "Name", type: "text", placeholder: "Enter brand name", required: true },
  { name: "description", label: "Description", type: "textarea", placeholder: "Enter description", rows: 3 },
];

const initialValues = { name: "", description: "" };

export function BrandForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Brand"
      fields={fields}
      initialValues={initialValues}
      createHook={(catalog as any).useCreateBrandMutation}
      editHook={(catalog as any).useEditBrandMutation}
      getByIdHook={(catalog as any).useGetBrandByIdMutation}
      buildPayload={(values) => ({
        name: values.name,
        description: values.description || "",
      })}
    />
  );
}
