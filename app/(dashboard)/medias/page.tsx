"use client"

import { ChangeEvent, DragEvent, FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CheckCircleIcon, FileIcon, ImageIcon, SearchIcon, Trash2Icon, UploadIcon, XIcon } from "lucide-react"

import { useConfirmDialog } from "@/components/confirm-dialog"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/hooks/use-permissions"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/toast"

type MediaRecord = {
  id: number
  name: string
  extension?: string
  sizes?: {
    thumb?: string
    original?: string
  }
  user?: {
    username?: string
  } | null
  created_at?: string
  selected?: boolean
  fileEdit?: boolean
}

type GalleryQuery = {
  page: number
  search: string
}

type GalleryResponse = {
  items?: MediaRecord[]
  data?: MediaRecord[]
  current_page?: number
  page?: number
  last_page?: number
  total_pages?: number
  total?: number
}

type UploadQueueItem = {
  id: string
  file: File
  uploaded: boolean
  failed: boolean
  progress: number
  error?: { message?: string }
}

const imageExtensions = new Set(["bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "webp"])

const supportedMimeTypes = new Set([
  "image/bmp",
  "image/gif",
  "image/vnd.microsoft.icon",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-7z-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

const responseData = (response: any): GalleryResponse => response?.data || response || {}

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return ""
  if (/^(https?:|data:|blob:)/.test(value)) return value
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "")
  const path = value.startsWith("/") ? value : `/${value}`
  return `${base}${path}`
}

const mediaImageUrl = (resource?: MediaRecord | null) =>
  resolveAssetUrl(resource?.sizes?.thumb || resource?.sizes?.original || "")

export default function MediasPage() {
  const { t } = useTranslation()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { hasPermission } = usePermissions()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastGalleryRequestRef = useRef("")
  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("gallery")
  const [searchField, setSearchField] = useState("")
  const [galleryQuery, setGalleryQuery] = useState<GalleryQuery>({ page: 1, search: "" })
  const [bulkSelect, setBulkSelect] = useState(false)
  const [resources, setResources] = useState<MediaRecord[]>([])
  const [galleryMeta, setGalleryMeta] = useState<GalleryResponse>({})
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadQueueItem[]>([])

  const [getMediaData, galleryState] = (media as any).useGetMediaDataMutation()
  const [uploadMedia] = (media as any).useUploadMediaMutation()
  const [editMedia] = (media as any).useEditMediaMutation()
  const [deleteMedia, deleteState] = (media as any).useDeleteMediaMutation()

  const canUpload = hasPermission(PERMISSIONS.media.upload)
  const canUpdate = hasPermission(PERMISSIONS.media.update)
  const canDelete = hasPermission(PERMISSIONS.media.delete)

  const selectedResources = useMemo(() => resources.filter((resource) => resource.selected), [resources])
  const hasOneSelected = selectedResources.length > 0
  const selectedResource = selectedResources[0]
  const panelOpened = !bulkSelect && Boolean(selectedResource)
  const currentPage = Number(galleryMeta.current_page || galleryMeta.page || galleryQuery.page || 1)
  const lastPage = Number(galleryMeta.last_page || galleryMeta.total_pages || 1)

  const loadGallery = useCallback(
    async (page = galleryQuery.page, search = galleryQuery.search, force = false) => {
      const requestKey = `${page}:${search}`
      if (!force && lastGalleryRequestRef.current === requestKey) return
      lastGalleryRequestRef.current = requestKey
      const response = await getMediaData({ page, per_page: 20, search }).unwrap()
      const data = responseData(response)
      const items = (data.items || data.data || []).map((resource) => ({
        ...resource,
        selected: false,
        fileEdit: false,
      }))
      setResources(items)
      setGalleryMeta(data)
      setBulkSelect(false)
    },
    [galleryQuery.page, galleryQuery.search, getMediaData]
  )

  useEffect(() => {
    if (activeTab !== "gallery") return
    loadGallery(galleryQuery.page, galleryQuery.search).catch((error: any) => {
      showToast.error(error?.data?.message || t("An error occurred while loading the media gallery."))
    })
  }, [activeTab, galleryQuery, loadGallery, t])

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setGalleryQuery((current) =>
        current.page === 1 && current.search === searchField
          ? current
          : { page: 1, search: searchField }
      )
    }, 500)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchField])

  useEffect(() => {
    const handlePasteUpload = (event: ClipboardEvent) => {
      if (activeTab !== "upload" || !canUpload) return
      const pastedFiles: File[] = []
      Array.from(event.clipboardData?.items || []).forEach((item) => {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) pastedFiles.push(file)
        }
      })
      if (pastedFiles.length > 0) {
        processFiles(pastedFiles)
      } else if (event.clipboardData?.items?.length) {
        showToast.error(t("No valid image found in clipboard."))
      }
    }

    window.addEventListener("paste", handlePasteUpload)
    return () => window.removeEventListener("paste", handlePasteUpload)
  }, [activeTab, canUpload])

  const isImage = (resource: MediaRecord) =>
    Boolean(resource.extension && imageExtensions.has(resource.extension.toLowerCase()))

  const uploadQueue = async (queue: UploadQueueItem[]) => {
    for (const queuedFile of queue) {
      setFiles((current) =>
        current.map((item) => (item.id === queuedFile.id ? { ...item, progress: 1 } : item))
      )

      try {
        const formData = new FormData()
        formData.append("file", queuedFile.file)
        const response = await uploadMedia(formData).unwrap()
        setFiles((current) =>
          current.map((item) =>
            item.id === queuedFile.id ? { ...item, uploaded: true, failed: false, progress: 100 } : item
          )
        )
        showToast.success(response?.message || t("File uploaded successfully."))
        await loadGallery(1, searchField, true)
      } catch (error: any) {
        setFiles((current) =>
          current.map((item) =>
            item.id === queuedFile.id
              ? { ...item, failed: true, progress: 0, error: { message: error?.data?.message || t("Failed to upload file.") } }
              : item
          )
        )
        showToast.error(error?.data?.message || t("Failed to upload file."))
      }
    }
  }

  const processFiles = (fileList: FileList | File[]) => {
    const incomingFiles = Array.from(fileList)
    const validFiles = incomingFiles.filter((file) => supportedMimeTypes.has(file.type))
    const invalidCount = incomingFiles.length - validFiles.length

    if (invalidCount > 0) {
      showToast.error(
        invalidCount === 1
          ? t("1 file was rejected due to invalid file type.")
          : t("%s files were rejected due to invalid file type.").replace("%s", String(invalidCount))
      )
    }

    if (validFiles.length === 0) {
      if (incomingFiles.length > 0) {
        showToast.error(t("No valid files selected. Please select supported file types."))
      }
      return
    }

    const queue = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      uploaded: false,
      failed: false,
      progress: 0,
    }))
    setFiles((current) => [...queue, ...current])
    uploadQueue(queue)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) processFiles(event.target.files)
    event.target.value = ""
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (event.dataTransfer.files) processFiles(event.dataTransfer.files)
  }

  const selectResource = (resource: MediaRecord) => {
    setResources((current) =>
      current.map((item) => {
        const isTarget = item.id === resource.id
        if (!bulkSelect && !isTarget) return { ...item, selected: false, fileEdit: false }
        if (!isTarget) return item
        return { ...item, selected: !item.selected, fileEdit: false }
      })
    )
  }

  const cancelBulkSelect = () => {
    setBulkSelect(false)
    setResources((current) => current.map((resource) => ({ ...resource, selected: false })))
  }

  const deleteSelected = async () => {
    if (!canDelete || selectedResources.length === 0) return
    const confirmed = await confirm({
      title: t("Delete"),
      description: t("You're about to delete selected resources. Would you like to proceed?"),
      confirmLabel: t("Delete"),
      variant: "destructive",
    })
    if (!confirmed) return
    const response = await deleteMedia({ ids: selectedResources.map((resource) => resource.id) }).unwrap()
    showToast.success(response?.message || t("The operation was successful."))
    await loadGallery(currentPage, searchField, true)
  }

  const submitChange = async (event: FocusEvent<HTMLSpanElement>, resource: MediaRecord) => {
    if (!canUpdate) return
    const name = event.currentTarget.textContent?.trim() || ""
    if (!name || name === resource.name) {
      setResources((current) => current.map((item) => (item.id === resource.id ? { ...item, fileEdit: false } : item)))
      return
    }
    const response = await editMedia({ id: resource.id, payLoad: { name } }).unwrap()
    showToast.success(response?.message || t("The media name was successfully updated."))
    setResources((current) =>
      current.map((item) => (item.id === resource.id ? { ...item, name, fileEdit: false } : item))
    )
  }

  const showFileError = (fileData: UploadQueueItem) => {
    showToast.error(fileData.error?.message || t("An unexpected error occurred."))
  }

  return (
    <PermissionGuard permission={PERMISSIONS.media.view}>
      <div className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-md border bg-white md:flex-row">
        <aside className="w-full shrink-0 border-b bg-slate-50 md:w-48 md:border-b-0 md:border-r">
          <h1 className="my-4 text-center text-xl font-bold text-slate-950">{t("Medias Manager")}</h1>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "gallery")} orientation="vertical">
            <TabsList className="mx-3 mb-3 flex h-auto w-auto flex-row md:flex-col">
              {canUpload ? (
                <TabsTrigger value="upload" className="w-full justify-start">
                  <UploadIcon className="size-4" />
                  {t("Upload")}
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="gallery" className="w-full justify-start">
                <ImageIcon className="size-4" />
                {t("Gallery")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </aside>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "gallery")} className="min-h-0 flex-1">
          <TabsContent value="upload" className="m-0 flex min-h-0 flex-1">
            <div
              className={cn(
                "m-2 flex flex-1 flex-col items-center justify-center border border-transparent p-2",
                isDragging && "border-dashed border-blue-500 bg-blue-50"
              )}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("[data-upload-list]")) return
                fileInputRef.current?.click()
              }}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <h2 className="mb-4 cursor-pointer text-center text-lg font-bold text-slate-700">
                {t("Click here or drop your files to upload.")}
              </h2>
              <input ref={fileInputRef} className="hidden" type="file" multiple onChange={handleFileChange} />
              <div data-upload-list className="w-full rounded-md border bg-white p-2 shadow-sm md:w-2/3">
                <div className="h-56 overflow-y-auto">
                  {files.length > 0 ? (
                    <ul>
                      {files.map((fileData) => (
                        <li
                          key={fileData.id}
                          className={cn(
                            "mb-2 flex items-center justify-between border-b-2 p-2 text-sm",
                            fileData.failed ? "border-rose-300" : "border-blue-200"
                          )}
                        >
                          <span className="min-w-0 truncate pr-3">{fileData.file.name}</span>
                          {fileData.failed ? (
                            <button
                              type="button"
                              className="flex items-center rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700"
                              onClick={() => showFileError(fileData)}
                            >
                              <ImageIcon className="mr-2 size-4" />
                              {t("See Error")}
                            </button>
                          ) : (
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                              {fileData.progress}%
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                      {t("Your uploaded files will displays here.")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex min-w-0 flex-1 flex-col border-r">
                <div className="border-b p-2">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="search"
                      value={searchField}
                      onChange={(event) => setSearchField(event.target.value)}
                      placeholder={t("Search Medias")}
                      className="h-10 pl-9 pr-24"
                    />
                    {searchField.length > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-8 -translate-y-1/2"
                        onClick={() => setSearchField("")}
                      >
                        {t("Cancel")}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {galleryState.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <Spinner />
                    </div>
                  ) : resources.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      {resources.map((resource) => {
                        const imageUrl = mediaImageUrl(resource)
                        return (
                        <button
                          key={resource.id}
                          type="button"
                          className={cn(
                            "flex aspect-square items-center justify-center overflow-hidden border-4 bg-slate-100",
                            resource.selected ? "border-blue-500" : "border-transparent"
                          )}
                          onClick={() => selectResource(resource)}
                        >
                          {isImage(resource) && imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={resource.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileIcon className="size-14 text-slate-500" />
                          )}
                        </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <h2 className="text-center text-2xl font-bold text-slate-700">{t("Nothing has already been uploaded")}</h2>
                    </div>
                  )}
                </div>
              </div>

              <aside className="hidden w-64 shrink-0 lg:block">
                {panelOpened && selectedResource ? (
                  <>
                    <div className="flex h-64 items-center justify-center bg-slate-800">
                      {isImage(selectedResource) && mediaImageUrl(selectedResource) ? (
                        <img
                          src={mediaImageUrl(selectedResource)}
                          alt={selectedResource.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileIcon className="size-20 text-white" />
                      )}
                    </div>
                    <div className="p-4 text-sm text-slate-700">
                      <p className="mb-2 flex flex-col">
                        <strong className="font-bold">{t("File Name")}: </strong>
                        <span
                          suppressContentEditableWarning
                          contentEditable={canUpdate && selectedResource.fileEdit}
                          className={cn("p-2", selectedResource.fileEdit && "border-b bg-slate-50")}
                          onClick={() =>
                            canUpdate &&
                            setResources((current) =>
                              current.map((item) =>
                                item.id === selectedResource.id ? { ...item, fileEdit: true } : item
                              )
                            )
                          }
                          onBlur={(event) => submitChange(event, selectedResource)}
                        >
                          {selectedResource.name}
                        </span>
                      </p>
                      <p className="mb-2 flex flex-col">
                        <strong className="font-bold">{t("Uploaded At")}:</strong>
                        <span>{selectedResource.created_at || "-"}</span>
                      </p>
                      <p className="mb-2 flex flex-col">
                        <strong className="font-bold">{t("By")} :</strong>
                        <span>{selectedResource.user?.username || "-"}</span>
                      </p>
                    </div>
                  </>
                ) : null}
              </aside>
            </div>

            <div className="flex shrink-0 justify-between gap-3 border-t p-2 text-sm">
              <div className="flex flex-wrap gap-2">
                {bulkSelect ? (
                  <Button type="button" variant="outline" onClick={cancelBulkSelect}>
                    <XIcon className="size-4" />
                    {t("Cancel")}
                  </Button>
                ) : null}
                {hasOneSelected && !bulkSelect ? (
                  <Button type="button" variant="outline" onClick={() => setBulkSelect(true)}>
                    <CheckCircleIcon className="size-4" />
                    {t("Bulk Select")}
                  </Button>
                ) : null}
                {hasOneSelected && canDelete ? (
                  <Button type="button" variant="destructive" onClick={deleteSelected} disabled={deleteState.isLoading}>
                    {deleteState.isLoading ? <Spinner /> : <Trash2Icon className="size-4" />}
                    {t("Delete")}
                  </Button>
                ) : null}
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage <= 1 || galleryState.isLoading}
                  onClick={() => setGalleryQuery({ page: currentPage - 1, search: searchField })}
                >
                  {t("Previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage >= lastPage || galleryState.isLoading}
                  onClick={() => setGalleryQuery({ page: currentPage + 1, search: searchField })}
                >
                  {t("Next")}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {confirmDialog}
    </PermissionGuard>
  )
}
