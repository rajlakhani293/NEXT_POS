"use client"

import { useEffect, useState } from "react"
import { ImagePlus, Search } from "lucide-react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { UnitGroupForm } from "@/app/(dashboard)/inventory/unit-groups/createUpdate"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { catalog } from "@/lib/api/catalog"
import { media } from "@/lib/api/media"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"
import { blankToNull } from "@/lib/utils"

const initialValues = {
  group_id: "",
  name: "",
  identifier: "",
  value: "",
  base_unit: false,
  preview_url: "",
  description: "",
}

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return ""
  if (/^(https?:|data:|blob:)/.test(value)) return value
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "")
  const path = value.startsWith("/") ? value : `/${value}`
  return `${base}${path}`
}

const mediaImageUrl = (record?: any) =>
  resolveAssetUrl(
    record?.sizes?.original ||
    record?.sizes?.thumb ||
    record?.url ||
    record?.full_url ||
    record?.path ||
    record?.preview_url ||
    ""
  )

function UnitPreviewPicker({
  formData,
  handleChange,
}: {
  formData: any
  handleChange: (name: string, value: any) => void
}) {
  const { t } = useTranslation()
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false)
  const [mediaSearch, setMediaSearch] = useState("")
  const [getMediaData, mediaState] = (media as any).useGetMediaDataMutation()
  const mediaRecords = mediaState.data?.data?.items || mediaState.data?.data?.data || mediaState.data?.data || []

  useEffect(() => {
    if (!mediaManagerOpen) return
    const timeout = window.setTimeout(() => {
      void getMediaData({ page: 1, per_page: 50, search: mediaSearch })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [getMediaData, mediaManagerOpen, mediaSearch])

  return (
    <div className="space-y-2">
      <UniFieldInput
        label={t("Preview")}
        placeholder={t("Choose an image from Medias Manager")}
        value={formData.preview_url || ""}
        onChange={(event) => handleChange("preview_url", event.target.value)}
        allowClear
        onClear={() => handleChange("preview_url", "")}
        addonAfter={
          <Button type="button" variant="outline" className="h-10" onClick={() => setMediaManagerOpen(true)}>
            <Search className="size-4" />
            {t("Medias Manager")}
          </Button>
        }
      />
      <p className="text-sm text-gray-500">{t("Provide a preview url to the unit.")}</p>

      <Dialog open={mediaManagerOpen} onOpenChange={setMediaManagerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Medias Manager")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <UniFieldInput
              label={t("Search")}
              placeholder={t("Search Medias")}
              value={mediaSearch}
              onChange={(event) => setMediaSearch(event.target.value)}
            />
            <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-4">
              {mediaRecords.map((record: any, index: number) => {
                const imageUrl = mediaImageUrl(record)
                return (
                  <button
                    key={`unit-media-${record.id || imageUrl || index}`}
                    type="button"
                    className="rounded-lg border bg-white p-2 text-left hover:border-gray-900"
                    onClick={() => {
                      const selectedUrl = mediaImageUrl(record)
                      if (!selectedUrl) {
                        showToast.error(t("Selected media has no image URL."))
                        return
                      }
                      handleChange("preview_url", selectedUrl)
                      setMediaManagerOpen(false)
                    }}
                  >
                    <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                      {imageUrl ? (
                        <img src={imageUrl} alt={record.name || record.file_name || t("Image")} className="h-full w-full object-cover" />
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
                <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm font-medium text-muted-foreground">
                  {t("No record found")}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function UnitForm(props: any) {
  const { t } = useTranslation()
  const [isUnitGroupFormOpen, setIsUnitGroupFormOpen] = useState(false)
  const [getUnitGroupsDropdown, unitGroups] = (catalog as any).useGetUnitGroupsDropdownMutation()

  useEffect(() => {
    if (!props.isOpen) return
    getUnitGroupsDropdown()
  }, [props.isOpen])

  const unitGroupOptions = (unitGroups.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))

  const fields = [
    {
      name: "name",
      label: t("Name"),
      type: "text",
      placeholder: t("Enter unit name"),
      required: true,
    },
    {
      name: "identifier",
      label: t("Identifier"),
      type: "text",
      placeholder: t("Provide a unique value for this unit. Might be composed from a name but shouldn't include space or special characters."),
    },
    {
      name: "preview_url",
      label: t("Preview"),
      custom: ({ formData, handleChange }: any) => (
        <UnitPreviewPicker formData={formData} handleChange={handleChange} />
      ),
    },
    {
      name: "value",
      label: t("Value"),
      type: "number",
      placeholder: t("Enter value"),
      required: true,
    },
    {
      name: "group_id",
      label: t("Unit Group"),
      type: "select",
      placeholder: t("Select unit group"),
      required: true,
      options: unitGroupOptions,
      onAddNew: () => setIsUnitGroupFormOpen(true),
      addNewLabel: t("Add New Unit Group"),
    },
    {
      name: "base_unit",
      label: t("Base Unit"),
      type: "switch",
      note: t("Determine if the unit is the base unit from the group."),
    },
    {
      name: "description",
      label: t("Description"),
      type: "textarea",
      placeholder: t("Provide a short description about the unit."),
    },
  ]

  return (
    <>
      <CatalogMasterForm
        {...props}
        entityName={t("Unit")}
        fields={fields}
        initialValues={initialValues}
        createHook={(catalog as any).useCreateUnitMutation}
        editHook={(catalog as any).useEditUnitMutation}
        getByIdHook={(catalog as any).useGetUnitByIdMutation}
        buildPayload={(values) =>
          blankToNull(
            {
              ...values,
              group_id: Number(values.group_id),
              name: String(values.name || "").trim(),
              value: Number(values.value || 1),
              base_unit: Boolean(values.base_unit),
            },
            ["identifier", "preview_url"]
          )
        }
      />
      <UnitGroupForm
        isOpen={isUnitGroupFormOpen}
        onClose={() => setIsUnitGroupFormOpen(false)}
        onSuccess={() => {
          setIsUnitGroupFormOpen(false)
          getUnitGroupsDropdown()
        }}
        formWidth="w-[440px]"
        nestedDrawer
      />
    </>
  )
}
