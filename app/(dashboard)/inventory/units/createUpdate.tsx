"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { UnitGroupForm } from "@/app/(dashboard)/inventory/unit-groups/createUpdate"
import { Button } from "@/components/ui/button"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { MediaManagerDialog, mediaImageUrl } from "@/components/media-manager"
import { catalog } from "@/lib/api/catalog"
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

// Helpers resolved from @/components/media-manager

function UnitPreviewPicker({
  formData,
  handleChange,
}: {
  formData: any
  handleChange: (name: string, value: any) => void
}) {
  const { t } = useTranslation()
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false)

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

      <MediaManagerDialog
        open={mediaManagerOpen}
        onOpenChange={setMediaManagerOpen}
        onSelect={(record) => {
          const selectedUrl = mediaImageUrl(record)
          if (!selectedUrl) {
            showToast.error(t("Selected media has no image URL."))
            return
          }
          handleChange("preview_url", selectedUrl)
        }}
      />
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
