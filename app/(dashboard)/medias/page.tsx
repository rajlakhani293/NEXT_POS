"use client"

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileIcon,
  FileTextIcon,
  Info,
  Loader2,
  Search,
  SearchIcon,
  Trash2Icon,
  UploadCloud,
  XIcon
} from "lucide-react"

import { useConfirmDialog } from "@/components/confirm-dialog"
import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { usePermissions } from "@/hooks/use-permissions"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDate } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/toast"
import { DashboardPage } from "@/components/dashboard/dashboard-page"

type MediaRecord = {
  id: number
  name: string
  extension?: string
  sizes?: {
    thumb?: string
    original?: string
  }
  user?: {
    id?: number
    username?: string
    full_name?: string
  } | null
  created_at?: string
  selected?: boolean
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

type FilterType = "all" | "images" | "documents" | "archives" | "others"

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
  const posOptions = usePosOptions()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { hasPermission } = usePermissions()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastGalleryRequestRef = useRef("")
  const dragCounter = useRef(0)

  const [searchField, setSearchField] = useState("")
  const [galleryQuery, setGalleryQuery] = useState<GalleryQuery>({ page: 1, search: "" })
  const [bulkSelect, setBulkSelect] = useState(false)
  const [resources, setResources] = useState<MediaRecord[]>([])
  const [galleryMeta, setGalleryMeta] = useState<GalleryResponse>({})
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadQueueItem[]>([])
  const [uploadQueueCollapsed, setUploadQueueCollapsed] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")

  const [getMediaData, galleryState] = (media as any).useGetMediaDataMutation()
  const [uploadMedia] = (media as any).useUploadMediaMutation()
  const [editMedia] = (media as any).useEditMediaMutation()
  const [deleteMedia, deleteState] = (media as any).useDeleteMediaMutation()

  const canUpload = hasPermission(PERMISSIONS.media.upload)
  const canUpdate = hasPermission(PERMISSIONS.media.update)
  const canDelete = hasPermission(PERMISSIONS.media.delete)

  const selectedResources = useMemo(() => resources.filter((resource) => resource.selected), [resources])
  const hasOneSelected = selectedResources.length > 0

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
      }))
      setResources(items)
      setGalleryMeta(data)
      setBulkSelect(false)
    },
    [galleryQuery.page, galleryQuery.search, getMediaData]
  )

  useEffect(() => {
    loadGallery(galleryQuery.page, galleryQuery.search).catch((error: any) => {
      showToast.error(error?.data?.message || t("An error occurred while loading the media gallery."))
    })
  }, [galleryQuery, loadGallery, t])

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
      if (!canUpload) return
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return
      }
      const pastedFiles: File[] = []
      Array.from(event.clipboardData?.items || []).forEach((item) => {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) pastedFiles.push(file)
        }
      })
      if (pastedFiles.length > 0) {
        processFiles(pastedFiles)
      }
    }

    window.addEventListener("paste", handlePasteUpload)
    return () => window.removeEventListener("paste", handlePasteUpload)
  }, [canUpload])

  const isImage = (resource: MediaRecord) =>
    Boolean(resource.extension && imageExtensions.has(resource.extension.toLowerCase()))

  const uploadQueue = async (queue: UploadQueueItem[]) => {
    setUploadQueueCollapsed(false)
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

  // Robust drag and drop counter handlers
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current++
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFiles(event.dataTransfer.files)
    }
  }

  const selectResource = (resource: MediaRecord) => {
    setResources((current) =>
      current.map((item) => {
        const isTarget = item.id === resource.id
        if (!bulkSelect && !isTarget) return { ...item, selected: false }
        if (!isTarget) return item
        return { ...item, selected: !item.selected }
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
      title: t("Delete Permanent"),
      description: t("You're about to delete selected resources. This action cannot be undone. Would you like to proceed?"),
      confirmLabel: t("Delete"),
      variant: "destructive",
    })
    if (!confirmed) return
    try {
      const response = await deleteMedia({ ids: selectedResources.map((resource) => resource.id) }).unwrap()
      showToast.success(response?.message || t("The operation was successful."))
      await loadGallery(currentPage, searchField, true)
    } catch (err: any) {
      showToast.error(err?.data?.message || t("Failed to delete resources."))
    }
  }

  const showFileError = (fileData: UploadQueueItem) => {
    showToast.error(fileData.error?.message || t("An unexpected error occurred."))
  }

  // File categories client-side logic
  const filteredResources = useMemo(() => {
    if (filter === "all") return resources
    return resources.filter((resource) => {
      const ext = (resource.extension || "").toLowerCase()
      if (filter === "images") {
        return imageExtensions.has(ext)
      }
      if (filter === "documents") {
        return ["pdf", "txt", "csv", "doc", "docx", "xls", "xlsx"].includes(ext)
      }
      if (filter === "archives") {
        return ["zip", "rar", "7z", "tar", "gz"].includes(ext)
      }
      return !imageExtensions.has(ext) && !["pdf", "txt", "csv", "doc", "docx", "xls", "xlsx", "zip", "rar", "7z"].includes(ext)
    })
  }, [resources, filter])

  const getFileIcon = (ext?: string) => {
    const e = (ext || "").toLowerCase()
    if (["pdf"].includes(e)) return <FileIcon className="size-12 text-rose-500" />
    if (["csv", "xls", "xlsx"].includes(e)) return <FileTextIcon className="size-12 text-emerald-500" />
    if (["zip", "rar", "7z", "tar", "gz"].includes(e)) return <FileIcon className="size-12 text-amber-500" />
    return <FileIcon className="size-12 text-slate-400" />
  }

  const filterTags: { value: FilterType; label: string }[] = [
    { value: "all", label: t("All Files") },
    { value: "images", label: t("Images") },
    { value: "documents", label: t("Documents") },
    { value: "archives", label: t("Archives") },
    { value: "others", label: t("Others") },
  ]

  return (
    <DashboardPage padding="none">
      <PermissionGuard permission={PERMISSIONS.media.view}>
        <div
          className="flex flex-col h-full min-h-[640px] bg-slate-50/50 overflow-hidden relative"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
        >
          {/* Workspace Drag Overlay */}
          {isDragging && (
            <div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-2xl m-2 transition-all duration-300 animate-in fade-in"
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center border border-slate-100">
                <div className="size-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600 animate-bounce">
                  <UploadCloud className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {t("Drop to upload files")}
                </h3>
                <p className="text-sm text-slate-500">
                  {t("Release your files here to automatically upload them to your library.")}
                </p>
              </div>
            </div>
          )}

          {/* Top Hub Bar */}
          <header className="bg-white border-b border-slate-100 px-4 py-2 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {t("Media Assets")}
                {galleryMeta.total !== undefined && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {galleryMeta.total} {t("Items")}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                {t("Manage and upload images, catalogs, and documentation files.")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search bar */}
              <div className="w-full sm:w-64">
                <UniFieldInput
                  id="search"
                  value={searchField}
                  onChange={(event) => setSearchField(event.target.value)}
                  placeholder={t("Search by filename...")}
                  className="h-9 w-full pr-9 pl-9"
                  prefix={<Search className="h-4 w-4" />}
                  allowClear
                  onClear={() => setSearchField("")}
                />
              </div>

              {canUpload && (
                <>
                  <input ref={fileInputRef} className="hidden" type="file" multiple onChange={handleFileChange} />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 h-10 px-4 transition-all duration-200 shadow-sm shadow-indigo-600/10 shrink-0"
                  >
                    <UploadCloud className="size-4" />
                    {t("Upload Files")}
                  </Button>
                </>
              )}
            </div>
          </header>

          {/* Toolbar & Filters (Line Tabs) */}
          <section className="bg-white px-5 shrink-0 z-10">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
              <TabsList variant="line" className="-mb-px w-full justify-start overflow-x-auto">
                {filterTags.map((tag) => (
                  <TabsTrigger key={tag.value} value={tag.value}>
                    {tag.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </section>

          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0 overflow-hidden relative">

            {/* Gallery Grid Container */}
            <main className="flex-1 flex flex-col min-w-0 p-5 overflow-y-auto">
              {galleryState.isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <Loader2 className="size-8 text-indigo-600 animate-spin" />
                  <p className="text-sm text-slate-400 mt-2">{t("Loading media library...")}</p>
                </div>
              ) : filteredResources.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                  {filteredResources.map((resource) => {
                    const imageUrl = mediaImageUrl(resource)
                    return (
                      <div
                        key={resource.id}
                        className={cn(
                          "group relative aspect-square rounded-lg overflow-hidden border bg-white transition-all duration-300 select-none cursor-pointer flex flex-col",
                          resource.selected
                            ? "border-indigo-600 ring-2 ring-indigo-600/20"
                            : "border-slate-200 hover:border-slate-350"
                        )}
                        onClick={() => selectResource(resource)}
                      >
                        {/* Checkbox Trigger Overlay */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!bulkSelect) {
                              setBulkSelect(true)
                              setResources((current) =>
                                current.map((item) =>
                                  item.id === resource.id ? { ...item, selected: true } : { ...item, selected: false }
                                )
                              )
                            } else {
                              selectResource(resource)
                            }
                          }}
                          className={cn(
                            "absolute top-3 left-3 z-30 size-5 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm",
                            resource.selected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-white/90 border-slate-300 text-transparent hover:bg-white hover:border-slate-400 opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Check className="size-3 stroke-[3]" />
                        </div>

                        {/* Pill Extension Badge */}
                        {resource.extension && (
                          <span className="absolute top-3 right-3 z-30 text-[9px] font-bold tracking-wider uppercase bg-white/90 text-slate-700 px-2 py-0.5 rounded-full shadow-sm border border-slate-100/50 backdrop-blur-sm">
                            {resource.extension}
                          </span>
                        )}

                        {/* Display Area */}
                        <div className="flex-1 min-h-0 bg-slate-100/50 flex items-center justify-center relative overflow-hidden p-2">
                          {isImage(resource) && imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={resource.name}
                              className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="transition-transform duration-300 group-hover:scale-105">
                              {getFileIcon(resource.extension)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-950/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>

                        {/* Info Footer */}
                        <div className="p-3 border-t border-slate-100 bg-white">
                          <p className="text-xs font-semibold text-slate-700 truncate" title={resource.name}>
                            {resource.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span>{formatBusinessDate(resource.created_at, posOptions)}</span>
                            <span>{resource.user?.full_name || resource.user?.username || ""}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                    <Info className="size-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700 mb-1">
                    {t("No files found")}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs">
                    {searchField
                      ? t("Try adjusting your keywords or clearing the search filter.")
                      : t("Get started by uploading your first files to this library.")}
                  </p>
                </div>
              )}
            </main>
          </div>

          {/* Footer Navigation & Actions Control */}
          {(lastPage > 1 || bulkSelect || hasOneSelected) && (
            <footer className="bg-white border-t border-slate-100 px-5 py-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
              {/* Actions Area */}
              <div className="flex items-center gap-2">
                {bulkSelect ? (
                  <Button type="button" variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs flex items-center gap-1.5" onClick={cancelBulkSelect}>
                    <XIcon className="size-3.5" />
                    {t("Cancel Selection")}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs flex items-center gap-1.5" onClick={() => setBulkSelect(true)}>
                    <CheckCircle2 className="size-3.5" />
                    {t("Bulk Select")}
                  </Button>
                )}

                {hasOneSelected && canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-lg text-xs flex items-center gap-1.5 animate-in fade-in duration-200"
                    onClick={deleteSelected}
                    disabled={deleteState.isLoading}
                  >
                    {deleteState.isLoading ? <Spinner className="size-3.5" /> : <Trash2Icon className="size-3.5" />}
                    {t("Delete Selected")}
                  </Button>
                )}
              </div>

              {/* Page count */}
              {lastPage > 1 && (
                <div className="text-xs text-slate-400">
                  {t("Page")} <span className="font-semibold text-slate-700">{currentPage}</span> {t("of")}{" "}
                  <span className="font-semibold text-slate-700">{lastPage}</span>
                </div>
              )}

              {/* Page buttons */}
              {lastPage > 1 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-slate-200 text-xs flex items-center gap-1"
                    disabled={currentPage <= 1 || galleryState.isLoading}
                    onClick={() => setGalleryQuery({ page: currentPage - 1, search: searchField })}
                  >
                    <ChevronLeft className="size-3.5" />
                    {t("Previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-slate-200 text-xs flex items-center gap-1"
                    disabled={currentPage >= lastPage || galleryState.isLoading}
                    onClick={() => setGalleryQuery({ page: currentPage + 1, search: searchField })}
                  >
                    {t("Next")}
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </footer>
          )}

          {/* Floating Upload Progress Box */}
          {files.length > 0 && (
            <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-300">
              {/* Queue Header */}
              <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
                <span className="text-xs font-semibold flex items-center gap-2">
                  <UploadCloud className="size-4 animate-bounce" />
                  {t("Upload Queue")} ({files.filter((f) => !f.uploaded && !f.failed).length} {t("remaining")})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setUploadQueueCollapsed(!uploadQueueCollapsed)}
                    className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
                  >
                    {uploadQueueCollapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                  <button
                    onClick={() => setFiles([])}
                    className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              </div>

              {/* List entries */}
              {!uploadQueueCollapsed && (
                <div className="max-h-60 overflow-y-auto p-2 divide-y divide-slate-100">
                  {files.map((fileData) => (
                    <div key={fileData.id} className="py-2 px-1.5 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-700" title={fileData.file.name}>
                          {fileData.file.name}
                        </p>
                        {!fileData.uploaded && !fileData.failed && (
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${fileData.progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {fileData.uploaded && (
                          <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[10px]">
                            <CheckCircle2 className="size-3.5" />
                            {t("Done")}
                          </span>
                        )}
                        {fileData.failed && (
                          <button
                            onClick={() => showFileError(fileData)}
                            className="text-rose-600 hover:underline flex items-center gap-1 font-semibold text-[10px]"
                          >
                            <AlertCircle className="size-3.5" />
                            {t("Error")}
                          </button>
                        )}
                        {!fileData.uploaded && !fileData.failed && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            {fileData.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {confirmDialog}
      </PermissionGuard>
    </DashboardPage>
  )
}
