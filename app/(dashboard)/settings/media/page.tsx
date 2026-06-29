"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FileIcon, ImageIcon, SearchIcon, Trash2Icon, UploadCloudIcon, XIcon } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type MediaResource = {
  id: number
  name: string
  extension: string
  slug: string
  sizes?: {
    original?: string
    thumb?: string
  }
  user?: {
    username?: string
  } | null
  created_at?: string
}

type UploadQueueItem = {
  id: string
  file: File
  progress: number
  uploaded: boolean
  failed: boolean
  error?: string
}

const imageExtensions = new Set(["bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "webp"])

const isImage = (resource?: MediaResource | null) =>
  Boolean(resource?.extension && imageExtensions.has(resource.extension))

export default function MediaPage() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [activePage, setActivePage] = useState<"upload" | "gallery">("gallery")
  const [resources, setResources] = useState<MediaResource[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkSelect, setBulkSelect] = useState(false)
  const [searchField, setSearchField] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [editingName, setEditingName] = useState("")

  const [getMediaData, mediaState] = (media as any).useGetMediaDataMutation()
  const [uploadMedia] = (media as any).useUploadMediaMutation()
  const [editMedia] = (media as any).useEditMediaMutation()
  const [deleteMedia, deleteState] = (media as any).useDeleteMediaMutation()

  const selectedResource = useMemo(
    () => resources.find((resource) => selectedIds.includes(resource.id)) || null,
    [resources, selectedIds]
  )

  const loadGallery = useCallback(
    async (targetPage = page, search = searchField) => {
      const response = await getMediaData({
        page: targetPage,
        limit: 20,
        search,
      }).unwrap()
      const data = response?.data || {}
      setResources(data.items || [])
      setPage(data.currentPage || targetPage)
      setTotalPages(data.totalPages || 1)
      setSelectedIds([])
      setBulkSelect(false)
    },
    [getMediaData, page, searchField]
  )

  useEffect(() => {
    loadGallery(1).catch(() => {
      showToast.error(t("an_error_occurred_while_loading_the_media_gallery"))
    })
  }, [])

  useEffect(() => {
    if (activePage !== "upload") return

    const handlePasteUpload = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files || [])
      const imageFiles = files.filter((file) => file.type.startsWith("image/"))
      if (!imageFiles.length) {
        showToast.error(t("no_valid_image_found_in_clipboard"))
        return
      }
      processFiles(imageFiles)
    }

    window.addEventListener("paste", handlePasteUpload)
    return () => window.removeEventListener("paste", handlePasteUpload)
  }, [activePage])

  const handleSearchChange = (value: string) => {
    setSearchField(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      loadGallery(1, value).catch(() => {
        showToast.error(t("an_error_occurred_while_loading_the_media_gallery"))
      })
    }, 500)
  }

  const selectResource = (resource: MediaResource) => {
    setSelectedIds((current) => {
      if (!bulkSelect) return current.includes(resource.id) ? [] : [resource.id]
      return current.includes(resource.id)
        ? current.filter((id) => id !== resource.id)
        : [...current, resource.id]
    })
    setEditingName(resource.name)
  }

  const uploadSingleFile = async (queueItem: UploadQueueItem) => {
    setUploadQueue((current) =>
      current.map((item) =>
        item.id === queueItem.id ? { ...item, progress: 1, failed: false } : item
      )
    )

    const formData = new FormData()
    formData.append("file", queueItem.file)

    try {
      const response = await uploadMedia(formData).unwrap()
      setUploadQueue((current) =>
        current.map((item) =>
          item.id === queueItem.id
            ? { ...item, progress: 100, uploaded: true, failed: false }
            : item
        )
      )
      showToast.success(response?.message || t("file_uploaded_successfully"))
      await loadGallery(1, searchField)
    } catch (error: any) {
      setUploadQueue((current) =>
        current.map((item) =>
          item.id === queueItem.id
            ? {
                ...item,
                failed: true,
                progress: 0,
                error: error?.data?.message || t("failed_to_upload_file"),
              }
            : item
        )
      )
      showToast.error(error?.data?.message || t("failed_to_upload_file"))
    }
  }

  const processFiles = (files: File[] | FileList) => {
    const nextFiles = Array.from(files)
    if (!nextFiles.length) return

    const queueItems = nextFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      uploaded: false,
      failed: false,
    }))

    setUploadQueue((current) => [...queueItems, ...current])
    queueItems.forEach((item) => {
      uploadSingleFile(item)
    })
  }

  const deleteSelected = async () => {
    if (!selectedIds.length) return
    const response = await deleteMedia({ ids: selectedIds }).unwrap()
    showToast.success(response?.message || t("the_operation_was_successful"))
    await loadGallery(page, searchField)
  }

  const submitNameChange = async () => {
    if (!selectedResource || !editingName.trim() || editingName === selectedResource.name) return
    const response = await editMedia({
      id: selectedResource.id,
      payLoad: { name: editingName.trim() },
    }).unwrap()
    showToast.success(response?.message || t("the_media_name_was_successfully_updated"))
    await loadGallery(page, searchField)
  }

  const renderPreview = (resource: MediaResource, size = "thumb") => {
    if (isImage(resource)) {
      return (
        <img
          src={resource.sizes?.[size as "thumb" | "original"] || resource.sizes?.original}
          alt={resource.name}
          className="h-full w-full object-cover"
        />
      )
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white">
        <FileIcon className="size-12" />
      </div>
    )
  }

  return (
    <PermissionGuard permission={PERMISSIONS.settings.view}>
      <div className="flex h-full min-h-0 overflow-hidden rounded-md border border-slate-200 bg-white">
        <aside className="flex w-48 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
          <h1 className="px-4 py-4 text-center text-lg font-bold text-slate-950">
            {t("medias_manager")}
          </h1>
          <button
            type="button"
            onClick={() => setActivePage("upload")}
            className={cn(
              "border-l-4 px-4 py-3 text-left text-sm font-semibold",
              activePage === "upload"
                ? "border-slate-950 bg-white text-slate-950"
                : "border-transparent text-slate-600 hover:bg-white"
            )}
          >
            {t("upload")}
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePage("gallery")
              loadGallery(page, searchField)
            }}
            className={cn(
              "border-l-4 px-4 py-3 text-left text-sm font-semibold",
              activePage === "gallery"
                ? "border-slate-950 bg-white text-slate-950"
                : "border-transparent text-slate-600 hover:bg-white"
            )}
          >
            {t("gallery")}
          </button>
        </aside>

        {activePage === "upload" ? (
          <section className="flex min-w-0 flex-1 flex-col">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter") fileInputRef.current?.click()
              }}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                processFiles(event.dataTransfer.files)
              }}
              className={cn(
                "m-4 flex flex-1 cursor-pointer flex-col items-center justify-center border border-dashed border-slate-300 p-4",
                isDragging && "border-slate-950 bg-slate-50"
              )}
            >
              <UploadCloudIcon className="mb-4 size-10 text-slate-500" />
              <h2 className="mb-4 text-center text-lg font-bold text-slate-950">
                {t("click_here_or_drop_your_files_to_upload")}
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => processFiles(event.currentTarget.files || [])}
              />
              <div className="h-56 w-full max-w-2xl overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                {uploadQueue.length ? (
                  <ul className="space-y-2">
                    {uploadQueue.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between border-b border-slate-100 p-2 text-sm",
                          item.failed ? "text-red-700" : "text-slate-700"
                        )}
                      >
                        <span className="min-w-0 truncate">{item.file.name}</span>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">
                          {item.failed ? t("failed") : `${item.progress}%`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                    {t("your_uploaded_files_will_displays_here")}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-slate-200 p-2">
              <div className="flex h-10 overflow-hidden rounded-md border border-slate-200">
                <div className="flex w-10 items-center justify-center text-slate-400">
                  <SearchIcon className="size-4" />
                </div>
                <Input
                  value={searchField}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder={t("search_medias")}
                  className="h-full rounded-none border-0 focus-visible:ring-0"
                />
                {searchField ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-full rounded-none"
                    onClick={() => handleSearchChange("")}
                  >
                    {t("cancel")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="min-w-0 flex-1 overflow-y-auto p-2">
                {mediaState.isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Spinner className="size-6" />
                  </div>
                ) : resources.length ? (
                  <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {resources.map((resource) => {
                      const selected = selectedIds.includes(resource.id)
                      return (
                        <button
                          type="button"
                          key={resource.id}
                          onClick={() => selectResource(resource)}
                          className={cn(
                            "aspect-square overflow-hidden border-4 bg-slate-200",
                            selected ? "border-slate-950" : "border-transparent"
                          )}
                          title={resource.name}
                        >
                          {renderPreview(resource)}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <h2 className="text-xl font-bold text-slate-950">
                      {t("nothing_has_already_been_uploaded")}
                    </h2>
                  </div>
                )}
              </div>

              <aside className="hidden w-64 shrink-0 border-l border-slate-200 lg:block">
                {selectedResource && !bulkSelect ? (
                  <>
                    <div className="flex h-64 items-center justify-center bg-slate-800">
                      {renderPreview(selectedResource)}
                    </div>
                    <div className="space-y-4 p-4 text-sm text-slate-700">
                      <div>
                        <strong className="block font-bold">{t("file_name")}:</strong>
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onBlur={submitNameChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <strong className="block font-bold">{t("uploaded_at")}:</strong>
                        <span>
                          {selectedResource.created_at
                            ? new Date(selectedResource.created_at).toLocaleString()
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <strong className="block font-bold">{t("by")}:</strong>
                        <span>{selectedResource.user?.username || "-"}</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </aside>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-slate-200 p-2 text-sm">
              <div className="flex gap-2">
                {bulkSelect ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setBulkSelect(false)
                      setSelectedIds([])
                    }}
                  >
                    <XIcon className="size-4" />
                    {t("cancel")}
                  </Button>
                ) : null}
                {selectedIds.length && !bulkSelect ? (
                  <Button type="button" variant="outline" onClick={() => setBulkSelect(true)}>
                    {t("bulk_select")}
                  </Button>
                ) : null}
                {selectedIds.length ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={deleteSelected}
                    disabled={deleteState.isLoading}
                  >
                    <Trash2Icon className="size-4" />
                    {t("delete")}
                  </Button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => loadGallery(page - 1, searchField)}
                >
                  {t("previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => loadGallery(page + 1, searchField)}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </PermissionGuard>
  )
}
