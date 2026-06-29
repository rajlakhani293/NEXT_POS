"use client"

import { FormEvent, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, UploadIcon } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

export default function UploadModulePage() {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedName, setSelectedName] = useState("")
  const [uploadModule, uploadState] = (settings as any).useUploadModuleMutation()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      showToast.error(t("Choose the zip file you would like to upload"))
      return
    }

    const formData = new FormData()
    formData.append("module", file)
    const response = await uploadModule({ payLoad: formData }).unwrap()
    showToast.success(response?.message || t("The module has been uploaded successfully."))
    setSelectedName("")
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <PermissionGuard permission={PERMISSIONS.special.manageModules}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button asChild type="button" variant="outline">
            <Link href="/modules">
              <ArrowLeftIcon className="size-4" />
              {t("Go Back")}
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md rounded-md border bg-white shadow-sm">
          <div className="space-y-2 p-4">
            <label htmlFor="upload-file" className="text-sm font-semibold text-slate-950">
              {t("Your Module")}
            </label>
            <input
              ref={fileRef}
              id="upload-file"
              name="module"
              type="file"
              accept=".zip,application/zip"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
              onChange={(event) => setSelectedName(event.target.files?.[0]?.name || "")}
            />
            <p className="text-sm text-slate-500">
              {selectedName || t("Choose the zip file you would like to upload")}
            </p>
          </div>
          <div className="flex justify-end border-t p-3">
            <Button type="submit" disabled={uploadState.isLoading}>
              {uploadState.isLoading ? <Spinner /> : <UploadIcon className="size-4" />}
              {t("Upload")}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  )
}
