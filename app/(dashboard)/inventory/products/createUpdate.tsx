"use client";

import { useEffect } from "react";

import DynamicForm from "@/components/DynamicForm";
import { catalog } from "@/lib/api/catalog";
import { showToast } from "@/lib/toast";

type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editId?: number | string | null;
};

const productTypes = [
  { label: "Stock", value: "stock" },
  { label: "Service", value: "service" },
];

const initialValues = {
  name: "",
  sku: "",
  barcode: "",
  slug: "",
  image: null,
  weight: "0",
  category_id: "none",
  brand_id: "none",
  tax_group_id: "none",
  unit_id: "",
  product_type: "stock",
  description: "",
  purchase_price: "0",
  selling_price: "0",
  mrp: "0",
  wholesale_price: "0",
  is_tax_inclusive: false,
  opening_stock: "0",
  min_stock: "0",
  max_stock: "0",
  reorder_level: "0",
  track_stock: true,
  allow_decimal_qty: false,
  stock_alert_enabled: true,
  expiry_tracking_enabled: false,
};

const toOption = (items: any[] = []) =>
  items.map((item) => ({
    label: item.short_name ? `${item.name} (${item.short_name})` : item.name,
    value: item.id,
  }));

const optionalOptions = (items: any[] = [], label: string) => [
  { label, value: "none" },
  ...toOption(items),
];

const appendIfPresent = (formData: FormData, key: string, value: any) => {
  if (value === undefined || value === null || value === "" || value === "none") return;
  formData.append(key, String(value));
};

function buildProductFormData(values: Record<string, any>, isEdit: boolean) {
  const formData = new FormData();

  appendIfPresent(formData, "name", values.name);
  appendIfPresent(formData, "sku", values.sku);
  appendIfPresent(formData, "barcode", values.barcode);
  appendIfPresent(formData, "slug", values.slug);
  appendIfPresent(formData, "weight", values.weight || "0");
  appendIfPresent(formData, "category_id", values.category_id);
  appendIfPresent(formData, "brand_id", values.brand_id);
  appendIfPresent(formData, "tax_group_id", values.tax_group_id);
  appendIfPresent(formData, "unit_id", values.unit_id);
  appendIfPresent(formData, "product_type", values.product_type || "stock");
  appendIfPresent(formData, "description", values.description);
  appendIfPresent(formData, "purchase_price", values.purchase_price || "0");
  appendIfPresent(formData, "selling_price", values.selling_price || "0");
  appendIfPresent(formData, "mrp", values.mrp || "0");
  appendIfPresent(formData, "wholesale_price", values.wholesale_price || "0");
  appendIfPresent(formData, "min_stock", values.min_stock || "0");
  appendIfPresent(formData, "max_stock", values.max_stock || "0");
  appendIfPresent(formData, "reorder_level", values.reorder_level || "0");

  if (!isEdit) {
    appendIfPresent(formData, "opening_stock", values.opening_stock || "0");
  }

  formData.append("is_tax_inclusive", String(Boolean(values.is_tax_inclusive)));
  formData.append("track_stock", String(Boolean(values.track_stock)));
  formData.append("allow_decimal_qty", String(Boolean(values.allow_decimal_qty)));
  formData.append("stock_alert_enabled", String(Boolean(values.stock_alert_enabled)));
  formData.append("expiry_tracking_enabled", String(Boolean(values.expiry_tracking_enabled)));

  if (values.image instanceof File) {
    formData.append("image", values.image);
  }

  return formData;
}

export function ProductForm({ isOpen, onClose, onSuccess, editId }: ProductFormProps) {
  const [createProduct] = (catalog as any).useCreateProductMutation();
  const [editProduct] = (catalog as any).useEditProductMutation();
  const [getProductById, { data, isLoading }] = (catalog as any).useGetProductByIdMutation();
  const [getCategoriesDropdown, categories] = (catalog as any).useGetCategoriesDropdownMutation();
  const [getBrandsDropdown, brands] = (catalog as any).useGetBrandsDropdownMutation();
  const [getTaxGroupsDropdown, taxGroups] = (catalog as any).useGetTaxGroupsDropdownMutation();
  const [getUnitsDropdown, units] = (catalog as any).useGetUnitsDropdownMutation();

  useEffect(() => {
    if (!isOpen) return;
    getCategoriesDropdown();
    getBrandsDropdown();
    getTaxGroupsDropdown();
    getUnitsDropdown();
    if (editId) {
      getProductById({ id: editId });
    }
  }, [
    editId,
    getBrandsDropdown,
    getCategoriesDropdown,
    getProductById,
    getTaxGroupsDropdown,
    getUnitsDropdown,
    isOpen,
  ]);

  const record = data?.data;
  const formValues = editId && record
    ? {
        ...initialValues,
        ...record,
        image: null,
        category_id: record.category_id ? String(record.category_id) : "none",
        brand_id: record.brand_id ? String(record.brand_id) : "none",
        tax_group_id: record.tax_group_id ? String(record.tax_group_id) : "none",
        unit_id: record.unit_id ? String(record.unit_id) : "",
      }
    : initialValues;

  const fields = [
    { name: "name", label: "Name", type: "text", placeholder: "Enter product name", required: true },
    { name: "sku", label: "SKU", type: "text", placeholder: "Auto generate if blank" },
    { name: "barcode", label: "Barcode", type: "text", placeholder: "Enter barcode" },
    { name: "slug", label: "Slug", type: "text", placeholder: "Auto generate if blank" },
    { name: "image", label: "Image", type: "file" },
    { name: "weight", label: "Weight", type: "number", placeholder: "0" },
    {
      name: "category_id",
      label: "Category",
      type: "select",
      options: optionalOptions(categories.data?.data, "No Category"),
    },
    {
      name: "brand_id",
      label: "Brand",
      type: "select",
      options: optionalOptions(brands.data?.data, "No Brand"),
    },
    {
      name: "tax_group_id",
      label: "Tax Group",
      type: "select",
      options: optionalOptions(taxGroups.data?.data, "No Tax"),
    },
    {
      name: "unit_id",
      label: "Unit",
      type: "select",
      placeholder: "Select unit",
      required: true,
      options: toOption(units.data?.data),
    },
    {
      name: "product_type",
      label: "Product Type",
      type: "select",
      required: true,
      options: productTypes,
    },
    { name: "description", label: "Description", type: "textarea", rows: 3 },
    { name: "purchase_price", label: "Purchase Price", type: "number" },
    { name: "selling_price", label: "Selling Price", type: "number", required: true },
    { name: "mrp", label: "MRP", type: "number" },
    { name: "wholesale_price", label: "Wholesale Price", type: "number" },
    { name: "is_tax_inclusive", label: "Tax Inclusive", type: "switch" },
    ...(!editId ? [{ name: "opening_stock", label: "Opening Stock", type: "number" }] : []),
    { name: "min_stock", label: "Min Stock", type: "number" },
    { name: "max_stock", label: "Max Stock", type: "number" },
    { name: "reorder_level", label: "Reorder Level", type: "number" },
    { name: "track_stock", label: "Track Stock", type: "switch" },
    { name: "allow_decimal_qty", label: "Allow Decimal Qty", type: "switch" },
    { name: "stock_alert_enabled", label: "Stock Alert", type: "switch" },
    { name: "expiry_tracking_enabled", label: "Expiry Tracking", type: "switch" },
  ];

  const handleSubmit = async (values: Record<string, any>) => {
    const payLoad = buildProductFormData(values, Boolean(editId));

    if (editId) {
      const response = await editProduct({ id: editId, payLoad }).unwrap();
      showToast.success(response?.message || "Product updated successfully.");
    } else {
      const response = await createProduct(payLoad).unwrap();
      showToast.success(response?.message || "Product created successfully.");
    }

    onSuccess();
    onClose();
  };

  return (
    <DynamicForm
      key={editId || "create-product"}
      fields={fields as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? "Edit Product" : "Create Product"}
      isOpen={isOpen}
      formWidth="w-[680px]"
      isLoading={Boolean(editId) && isLoading}
    />
  );
}
