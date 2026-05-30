"use client";

import { useEffect } from "react";

import DynamicForm from "@/components/DynamicForm";
import { showToast } from "@/lib/toast";
import { catalog } from "@/lib/api/catalog";

type CategoryFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editId?: number | string | null;
};

type CategoryFormValues = {
  name: string;
  code: string;
  description: string;
};

const initialValues: CategoryFormValues = {
  name: "",
  code: "",
  description: "",
};

const categoryFields = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Enter category name",
    required: true,
  },
  {
    name: "code",
    label: "Code",
    type: "text",
    placeholder: "Auto generate if blank",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
    rows: 3,
  },
];

export function CategoryForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
}: CategoryFormProps) {
  const [createCategory] = (catalog as any).useCreateCategoryMutation();
  const [editCategory] = (catalog as any).useEditCategoryMutation();
  const [getCategoryById, { data, isLoading }] = (catalog as any).useGetCategoryByIdMutation();

  useEffect(() => {
    if (isOpen && editId) {
      getCategoryById({ id: editId });
    }
  }, [editId, getCategoryById, isOpen]);

  const record = data?.data;
  const formValues: CategoryFormValues = editId && record
    ? {
        name: record.name || "",
        code: record.code || "",
        description: record.description || "",
      }
    : initialValues;

  const handleSubmit = async (values: CategoryFormValues) => {
    const payLoad = {
      name: values.name,
      code: values.code || undefined,
      description: values.description || "",
    };

    if (editId) {
      const response = await editCategory({ id: editId, payLoad }).unwrap();
      showToast.success(response?.message || "Category updated successfully.");
    } else {
      const response = await createCategory(payLoad).unwrap();
      showToast.success(response?.message || "Category created successfully.");
    }

    onSuccess();
    onClose();
  };

  return (
    <DynamicForm
      key={editId || "create-category"}
      fields={categoryFields as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? "Edit Category" : "Create Category"}
      isOpen={isOpen}
      formWidth="w-[520px]"
      isLoading={Boolean(editId) && isLoading}
    />
  );
}
