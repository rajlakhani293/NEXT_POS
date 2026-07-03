"use client"

import { useRef, useState } from "react"
import { UploadIcon } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import DynamicTable from "@/components/DynamicTable"
import { Button } from "@/components/ui/button"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions } from "@/hooks/use-permissions"
import { useTableData } from "@/hooks/useTableData"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const renameInitialValues = { name: "" }

export default function MediasPage() {
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [renameRecord, setRenameRecord] = useState<any | null>(null)
  const [uploadMedia, uploadState] = (media as any).useUploadMediaMutation()
  const [editMedia] = (media as any).useEditMediaMutation()
  const [deleteMedia] = (media as any).useDeleteMediaMutation()

  const canUpload = hasPermission(PERMISSIONS.media.upload)
  const canUpdate = hasPermission(PERMISSIONS.media.update)
  const canDelete = hasPermission(PERMISSIONS.media.delete)

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
    getMaster: (media as any).useGetMediaDataMutation,
    itemsPerPage: 20,
    disableDateFilter: true,
  })

  const columns = [
    {
      key: "sizes",
      title: t("Preview"),
      render: (value: any, record: any) =>
        value?.thumb || value?.original ? (
          <img
            src={value.thumb || value.original}
            alt={record.name}
            className="h-12 w-12 rounded-md border object-cover"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    { key: "name", title: t("Name") },
    { key: "extension", title: t("Type") },
    {
      key: "user",
      title: t("Author"),
      render: (value: any) => value?.username || "-",
    },
    {
      key: "created_at",
      title: t("Created On"),
      render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
  ]

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await uploadMedia(formData).unwrap()
      showToast.success(response?.message || t("Media uploaded successfully."))
      triggerRefresh()
    } finally {
      event.target.value = ""
    }
  }

  const handleRenameSubmit = async (values: typeof renameInitialValues) => {
    if (!renameRecord) return
    const response = await editMedia({
      id: renameRecord.id,
      payLoad: { name: values.name },
    }).unwrap()
    showToast.success(
      response?.message || t("The media name was successfully updated.")
    )
    setRenameRecord(null)
    triggerRefresh()
  }

  return (
    <PermissionGuard permission={PERMISSIONS.media.view}>
      <div className="h-full space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <DynamicTable
          data={orders}
          columns={columns}
          tableTitle={t("Manage Medias")}
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
          isLoading={isLoading || uploadState.isLoading}
          secondaryActionButton={
            canUpload ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState.isLoading}
              >
                <UploadIcon className="size-4" />
                {t("Upload")}
              </Button>
            ) : undefined
          }
          showEdit={canUpdate}
          onEdit={(record) => setRenameRecord(record)}
          showDelete={canDelete}
          deleteMutation={deleteMedia}
          triggerRefresh={triggerRefresh}
          deleteModalTitle={t("Delete Media")}
          deleteModalDescription={t("Would you like to delete this ?")}
        />

        <DynamicForm
          key={renameRecord?.id || "rename-media"}
          fields={[
            {
              name: "name",
              label: "Name",
              type: "text",
              placeholder: "Provide a label to the resource.",
              required: true,
            },
          ]}
          initialValues={
            renameRecord ? { name: renameRecord.name || "" } : renameInitialValues
          }
          onSubmit={handleRenameSubmit}
          onClose={() => setRenameRecord(null)}
          title="Edit Media"
          isOpen={Boolean(renameRecord)}
          formWidth="w-[420px]"
        />
      </div>
    </PermissionGuard>
  )
}
