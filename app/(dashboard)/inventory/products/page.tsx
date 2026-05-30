"use client";

import { CatalogPageShell } from "@/components/catalog/catalog-page-shell";
import { catalog } from "@/lib/api/catalog";
import { ProductForm } from "./createUpdate";

const money = (value: any) => `₹${Number(value || 0).toFixed(2)}`;

const columns = [
  { key: "name", title: "Name" },
  { key: "sku", title: "SKU" },
  { key: "category_name", title: "Category" },
  { key: "brand_name", title: "Brand" },
  { key: "unit_name", title: "Unit" },
  { key: "selling_price", title: "Selling Price", render: money },
  { key: "current_stock", title: "Stock" },
];

export default function ProductsPage() {
  return (
    <CatalogPageShell
      tableTitle="Products"
      addTitle="Add Product"
      columns={columns}
      getDataHook={(catalog as any).useGetProductsDataMutation}
      deleteHook={(catalog as any).useDeleteProductMutation}
      statusHook={(catalog as any).useUpdateProductStatusMutation}
      FormComponent={ProductForm}
      deleteTitle="Delete Product"
      deleteDescription="Are you sure you want to delete this product?"
    />
  );
}
