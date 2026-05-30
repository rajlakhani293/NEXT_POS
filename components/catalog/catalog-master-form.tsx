"use client";

import { useEffect } from "react";

import DynamicForm from "@/components/DynamicForm";
import { showToast } from "@/lib/toast";

type CatalogMasterFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editId?: number | string | null;
  entityName: string;
  fields: any[];
  initialValues: Record<string, any>;
  createHook: any;
  editHook: any;
  getByIdHook: any;
  formWidth?: string;
  buildPayload?: (values: Record<string, any>) => Record<string, any>;
};

export function CatalogMasterForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
  entityName,
  fields,
  initialValues,
  createHook,
  editHook,
  getByIdHook,
  formWidth = "w-[520px]",
  buildPayload,
}: CatalogMasterFormProps) {
  const [createRecord] = createHook();
  const [editRecord] = editHook();
  const [getRecordById, { data, isLoading }] = getByIdHook();

  useEffect(() => {
    if (isOpen && editId) {
      getRecordById({ id: editId });
    }
  }, [editId, getRecordById, isOpen]);

  const record = data?.data;
  const normalizeValues = (values: Record<string, any>) => {
    return fields.reduce(
      (current, field) => {
        if (field.type === "select" && current[field.name] !== undefined && current[field.name] !== null) {
          current[field.name] = String(current[field.name]);
        }
        return current;
      },
      { ...values },
    );
  };

  const formValues = normalizeValues(editId && record ? { ...initialValues, ...record } : initialValues);

  const handleSubmit = async (values: Record<string, any>) => {
    const payLoad = buildPayload ? buildPayload(values) : values;

    if (editId) {
      const response = await editRecord({ id: editId, payLoad }).unwrap();
      showToast.success(response?.message || `${entityName} updated successfully.`);
    } else {
      const response = await createRecord(payLoad).unwrap();
      showToast.success(response?.message || `${entityName} created successfully.`);
    }

    onSuccess();
    onClose();
  };

  return (
    <DynamicForm
      key={editId || `create-${entityName}`}
      fields={fields}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? `Edit ${entityName}` : `Create ${entityName}`}
      isOpen={isOpen}
      formWidth={formWidth}
      isLoading={Boolean(editId) && isLoading}
    />
  );
}
