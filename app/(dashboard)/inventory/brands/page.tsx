"use client";

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell";
import { catalog } from "@/lib/api/catalog";
import { BrandForm } from "./createUpdate";

const columns = [
  { key: "name", title: "Name" },
  { key: "description", title: "Description" },
];

export default function BrandsPage() {
  return (
    <CatalogPageShell
      tableTitle="Brands"
      addTitle="Add Brand"
      columns={columns}
      getDataHook={(catalog as any).useGetBrandsDataMutation}
      deleteHook={(catalog as any).useDeleteBrandMutation}
      statusHook={(catalog as any).useUpdateBrandStatusMutation}
      FormComponent={BrandForm}
      deleteTitle="Delete Brand"
      deleteDescription="Are you sure you want to delete this brand?"
    />
  );
}
