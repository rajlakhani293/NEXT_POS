"use client"

import { useState } from "react"

import DynamicTable from "@/components/DynamicTable"
import DynamicForm from "@/components/DynamicForm"
import { PermissionGuard } from "@/components/permission-guard"
import { media } from "@/lib/api/media"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { useTableData } from "@/hooks/useTableData"

const columns = [
  { key: "original_name", title: "Name" },
  { key: "folder", title: "Folder" },
  { key: "mime_type", title: "Type" },
  { key: "file_size", title: "Size" },
  { key: "entity_type", title: "Entity" },
  {
    key: "file_url",
    title: "Preview",
    render: (value: string) =>
      value ? (
        <a className="font-semibold text-blue-600" href={value} target="_blank">
          View
        </a>
      ) : (
        "-"
      ),
  },
]

export default function MediaPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [deleteMedia] = (media as any).useDeleteMediaMutation()
  const [uploadMedia] = (media as any).useUploadMediaMutation()
  const table = useTableData({
    getMaster: (media as any).useGetMediaDataMutation,
    itemsPerPage: 10,
  })

  const submitUpload = async (values: any) => {
    const formData = new FormData()
    formData.append("file", values.file)
    formData.append("folder", values.folder || "general")
    formData.append("entity_type", values.entity_type || "")
    if (values.entity_id) formData.append("entity_id", values.entity_id)
    formData.append("alt_text", values.alt_text || "")
    const response = await uploadMedia(formData).unwrap()
    showToast.success(response?.message || "Media uploaded successfully.")
    setIsUploadOpen(false)
    table.triggerRefresh()
  }

  return (
    <PermissionGuard permission={PERMISSIONS.settings.view}>
      <>
        <DynamicTable
          data={table.orders}
          columns={columns}
          tableTitle="Media"
          title="Upload Media"
          showSearch
          searchTerm={table.searchTerm}
          currentPage={table.currentPage}
          itemsPerPage={table.itemsPerPage}
          totalItems={table.totalItems}
          onPageChange={table.setCurrentPage}
          onFilterChange={table.handleFilterChange}
          sortConfig={table.sortConfig}
          onSort={table.handleSort}
          sortableFields={table.sortableFields}
          isLoading={table.isLoading}
          setAddEntityOpen={() => setIsUploadOpen(true)}
          showEdit={false}
          showDelete
          deleteMutation={deleteMedia}
          triggerRefresh={table.triggerRefresh}
          deleteModalTitle="Delete Media"
          deleteModalDescription="Are you sure you want to delete this media file?"
        />

        <DynamicForm
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="Upload Media"
          initialValues={{
            file: null,
            folder: "general",
            entity_type: "",
            entity_id: "",
            alt_text: "",
          }}
          fields={[
            {
              name: "file",
              label: "File",
              type: "file",
              required: true,
            },
            {
              name: "folder",
              label: "Folder",
              placeholder: "general",
              required: true,
            },
            {
              name: "entity_type",
              label: "Entity Type",
              placeholder: "product, company, customer...",
            },
            {
              name: "entity_id",
              label: "Entity ID",
              type: "number",
              placeholder: "Enter entity id",
            },
            {
              name: "alt_text",
              label: "Alt Text",
              placeholder: "Enter alt text",
            },
          ]}
          onSubmit={submitUpload}
        />
      </>
    </PermissionGuard>
  )
}
