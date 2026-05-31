"use client";

import { useState } from "react";

import DynamicTable from "@/components/DynamicTable";
import { CategoryForm } from "@/app/(dashboard)/inventory/categories/createUpdate";
import { catalog } from "@/lib/api/catalog";
import { useTableData } from "@/hooks/useTableData";

const columns = [
  { key: "name", title: "Name" },
  { key: "description", title: "Description" },
];

export default function CategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [deleteCategory] = (catalog as any).useDeleteCategoryMutation();
  const [updateCategoryStatus] = (catalog as any).useUpdateCategoryStatusMutation();

  const {
    orders,
    totalItems,
    isLoading,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    sortableFields,
    handleFilterChange,
    searchTerm,
    itemsPerPage,
    triggerRefresh,
  } = useTableData({
    getMaster: (catalog as any).useGetCategoriesDataMutation,
    itemsPerPage: 10,
  });

  const handleAdd = (open: boolean) => {
    setEditId(null);
    setIsFormOpen(open);
  };

  const handleEdit = (record: any) => {
    setEditId(record.id);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditId(null);
  };

  return (
    <div className="h-full space-y-4">
      <DynamicTable
        data={orders}
        columns={columns}
        tableTitle="Categories"
        title="Add Category"
        showSearch
        searchTerm={searchTerm}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onFilterChange={handleFilterChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        sortableFields={sortableFields}
        isLoading={isLoading}
        setAddEntityOpen={handleAdd}
        showEdit
        onEdit={handleEdit}
        showDelete
        deleteMutation={deleteCategory}
        showStatus
        statusChangeMutation={({ ids, status }: any) =>
          updateCategoryStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle="Delete Category"
        deleteModalDescription="Are you sure you want to delete this category?"
      />

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={triggerRefresh}
        editId={editId}
      />
    </div>
  );
}
