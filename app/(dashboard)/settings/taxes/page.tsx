"use client";

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell";
import { catalog } from "@/lib/api/catalog";
import { TaxForm } from "./createUpdate";

const columns = [
  { key: "name", title: "Name" },
  { key: "tax_group__name", title: "Tax Group" },
  { key: "rate", title: "Rate (%)" },
  {
    key: "is_inclusive",
    title: "Inclusive",
    render: (value: boolean) => (value ? "Yes" : "No"),
  },
];

export default function TaxesPage() {
  return (
    <CatalogPageShell
      tableTitle="Taxes"
      addTitle="Add Tax"
      columns={columns}
      getDataHook={(catalog as any).useGetTaxesDataMutation}
      deleteHook={(catalog as any).useDeleteTaxMutation}
      statusHook={(catalog as any).useUpdateTaxStatusMutation}
      FormComponent={TaxForm}
      deleteTitle="Delete Tax"
      deleteDescription="Are you sure you want to delete this tax?"
    />
  );
}
