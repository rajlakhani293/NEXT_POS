"use client"

import React, { useEffect, useState, useRef } from "react"
import { ImagePlus, Search, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

export const resolveAssetUrl = (value?: string | null) => {
  if (!value) return ""
  if (/^(https?:|data:|blob:)/.test(value)) return value
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "")
  const path = value.startsWith("/") ? value : `/${value}`
  return `${base}${path}`
}

export const mediaImageUrl = (record?: any) =>
  resolveAssetUrl(
    record?.sizes?.original ||
    record?.sizes?.thumb ||
    record?.url ||
    record?.full_url ||
    record?.path ||
    record?.preview_url ||
    ""
  )

interface MediaManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (record: any) => void
  title?: string
  defaultTab?: "gallery" | "upload"
}

export const MediaManagerDialog = ({
  open,
  onOpenChange,
  onSelect,
  title,
  defaultTab = "gallery",
}: MediaManagerDialogProps) => {
  const { t } = useTranslation()
  const [mediaTab, setMediaTab] = useState<"gallery" | "upload">(defaultTab)
  const [mediaSearch, setMediaSearch] = useState("")
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const mediaFileInputRef = useRef<HTMLInputElement>(null)

  const [getMediaData, mediaState] = (media as any).useGetMediaDataMutation()
  const [uploadMedia] = media.useUploadMediaMutation()
  
  const mediaRecords = mediaState.data?.data?.items || mediaState.data?.data?.data || mediaState.data?.data || []

  const loadMediaRecords = (searchQuery: string) => {
    void getMediaData({ page: 1, per_page: 50, search: searchQuery })
  }

  useEffect(() => {
    if (open) {
      setMediaTab(defaultTab)
    }
  }, [open, defaultTab])

  useEffect(() => {
    if (!open || mediaTab !== "gallery") return
    if (mediaSearch === "") {
      loadMediaRecords("")
      return
    }
    const timeout = window.setTimeout(() => {
      loadMediaRecords(mediaSearch)
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [open, mediaTab, mediaSearch])

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ""
    if (!files.length) return

    setIsUploadingMedia(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        await uploadMedia(formData).unwrap()
      }
      showToast.success(t("File uploaded successfully."))
      const prevTab = mediaTab
      setMediaTab("gallery")
      if (prevTab === "gallery") {
        loadMediaRecords(mediaSearch)
      }
    } catch (error: any) {
      showToast.error(error?.data?.message || t("Failed to upload files."))
    } finally {
      setIsUploadingMedia(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] lg:max-w-[85vw] h-[90vh] md:h-[85vh] flex flex-col w-full">
        <DialogHeader>
          <DialogTitle>{title || t("Medias Manager")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mediaTab === "upload" ? "default" : "outline"}
              onClick={() => setMediaTab("upload")}
            >
              <Upload className="size-4" />
              {t("Upload")}
            </Button>
            <Button
              type="button"
              variant={mediaTab === "gallery" ? "default" : "outline"}
              onClick={() => {
                if (mediaTab === "gallery") {
                  loadMediaRecords(mediaSearch)
                } else {
                  setMediaTab("gallery")
                }
              }}
            >
              <ImagePlus className="size-4" />
              {t("Gallery")}
            </Button>
          </div>

          {mediaTab === "upload" ? (
            <div
              className="flex-1 cursor-pointer flex flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50 p-6 text-center"
              onClick={() => mediaFileInputRef.current?.click()}
            >
              <Upload className="mb-3 size-10 text-muted-foreground" />
              <h3 className="text-base font-bold text-gray-900">
                {t("Click here or drop your files to upload.")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("Your uploaded files will displays here.")}
              </p>
              <input
                ref={mediaFileInputRef}
                className="hidden"
                type="file"
                multiple
                onChange={handleMediaUpload}
              />
              {isUploadingMedia ? (
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Spinner />
                  {t("Uploading...")}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <UniFieldInput
                label={t("Search")}
                placeholder={t("Search Medias")}
                value={mediaSearch}
                onChange={(event) => setMediaSearch(event.target.value)}
              />
              <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 content-start">
                {mediaRecords.map((record: any, index: number) => {
                  const imageUrl = mediaImageUrl(record)
                  return (
                    <button
                      key={`media-picker-${record.id || imageUrl || index}`}
                      type="button"
                      className="rounded-lg border bg-white p-2 text-left hover:border-gray-900 h-fit"
                      onClick={() => {
                        onSelect(record)
                        onOpenChange(false)
                      }}
                    >
                      <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={record.name || record.file_name || t("Image")}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImagePlus className="size-6" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 truncate text-xs font-semibold text-gray-700">
                        {record.name || record.file_name || record.url || t("Image")}
                      </div>
                    </button>
                  )
                })}
                {!mediaRecords.length ? (
                  <div className="col-span-full py-8 text-center text-sm text-gray-500">
                    {mediaState.isLoading ? t("Loading...") : t("No media items found.")}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
