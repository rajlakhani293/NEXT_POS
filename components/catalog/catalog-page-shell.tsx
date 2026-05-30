"use client";

import { useState } from "react";

import DynamicTable from "@/components/DynamicTable";
import { useTableData } from "@/hooks/useTableData";

type CatalogPageShellProps = {
  tableTitle: string;
  addTitle: string;
  columns: { key: string; title: string; render?: any }[];
  getDataHook: any;
  deleteHook: any;
  statusHook: any;
  FormComponent: React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: number | string | null;
  }>;
  deleteTitle: string;
  deleteDescription: string;
};

export function CatalogPageShell({
  tableTitle,
  addTitle,
  columns,
  getDataHook,
  deleteHook,
  statusHook,
  FormComponent,
  deleteTitle,
  deleteDescription,
}: CatalogPageShellProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [deleteRecord] = deleteHook();
  const [updateStatus] = statusHook();

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
    getMaster: getDataHook,
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
        tableTitle={tableTitle}
        title={addTitle}
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
        deleteMutation={deleteRecord}
        showStatus
        statusChangeMutation={({ ids, status }: any) =>
          updateStatus({ payLoad: { ids, status } })
        }
        triggerRefresh={triggerRefresh}
        deleteModalTitle={deleteTitle}
        deleteModalDescription={deleteDescription}
      />

      <FormComponent
        isOpen={isFormOpen}
        onClose={handleClose}
        onSuccess={triggerRefresh}
        editId={editId}
      />
    </div>
  );
}
