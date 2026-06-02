"use client"

import {
  EyeIcon,
  ImageIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IoAddCircleOutline } from "react-icons/io5"

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]
const maxImageSizeInBytes = 2 * 1024 * 1024

type ImageUploadProps = {
  value?: File | null
  initialUrl?: string | null
  onChange: (file: File | null) => void
  label?: string
  error?: string
  onError?: (message: string) => void
  className?: string
}

const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(0)} MB`

export function ImageUpload({
  value,
  initialUrl,
  onChange,
  label,
  error,
  onError,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    if (!value) {
      setObjectUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(value)
    setObjectUrl(nextUrl)

    return () => URL.revokeObjectURL(nextUrl)
  }, [value])

  const previewUrl = useMemo(
    () => objectUrl || initialUrl || "",
    [initialUrl, objectUrl]
  )

  const handleFile = (file?: File) => {
    if (!file) return

    if (!allowedImageTypes.includes(file.type)) {
      onError?.("Only JPG, PNG, or WEBP images are allowed.")
      inputRef.current && (inputRef.current.value = "")
      return
    }

    if (file.size > maxImageSizeInBytes) {
      onError?.(
        `Image size must be less than ${formatSize(maxImageSizeInBytes)}.`
      )
      inputRef.current && (inputRef.current.value = "")
      return
    }

    onError?.("")
    onChange(file)
  }

  const clearImage = () => {
    inputRef.current && (inputRef.current.value = "")
    onError?.("")
    onChange(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
        </div>
      ) : null}

      <div
        className={cn(
          "group relative flex aspect-square h-36 w-36 overflow-hidden rounded-lg border-2 border-dashed border-input bg-white text-left transition hover:border-ring",
          error && "border-red-500"
        )}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-full w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition group-hover:opacity-100">
              <Button
                type="button"
                className="size-8 rounded-full"
                variant="secondary"
                onClick={() => setIsPreviewOpen(true)}
              >
                <EyeIcon className="size-4" />
              </Button>
              <Button
                type="button"
                className="size-8 rounded-full"
                variant="destructive"
                onClick={clearImage}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center p-4 text-center"
          >
            <IoAddCircleOutline size={32} />
            <p className="text-sm font-semibold text-foreground">Upload</p>
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        JPG, PNG, WEBP up to {formatSize(maxImageSizeInBytes)}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={allowedImageTypes.join(",")}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isPreviewOpen && previewUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-6">
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-white text-foreground shadow-lg hover:bg-muted"
          >
            <XIcon className="size-5" />
          </button>
          <img
            src={previewUrl}
            alt={`${label} full preview`}
            className="max-h-[88vh] max-w-[88vw] rounded-lg bg-white object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </div>
  )
}
