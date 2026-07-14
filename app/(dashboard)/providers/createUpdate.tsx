"use client"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { purchases } from "@/lib/api/purchases"
import { useTranslation } from "@/lib/contexts/TranslationContext"

const providerInitialValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_1: "",
  address_2: "",
  description: "",
}

export function ProviderForm(props: any) {
  const { t } = useTranslation()

  const fields = [
    {
      name: "first_name",
      label: t("First Name"),
      placeholder: t("Provide a name to the resource."),
      type: "text",
      required: true,
    },
    {
      name: "email",
      label: t("Email"),
      placeholder: t("Provide the provider email. Might be used to send automated email."),
      type: "email",
    },
    {
      name: "last_name",
      label: t("Last Name"),
      placeholder: t("Provider last name if necessary."),
      type: "text",
    },
    {
      name: "phone",
      label: t("Phone"),
      placeholder: t("Contact phone number for the provider. Might be used to send automated SMS notifications."),
      type: "text",
    },
    {
      name: "address_1",
      label: t("Address 1"),
      placeholder: t("First address of the provider."),
      type: "text",
    },
    {
      name: "address_2",
      label: t("Address 2"),
      placeholder: t("Second address of the provider."),
      type: "text",
    },
    {
      name: "description",
      label: t("Description"),
      placeholder: t("Further details about the provider"),
      type: "textarea",
    },
  ]

  return (
    <CatalogMasterForm
      {...props}
      entityName={t("provider")}
      fields={fields}
      initialValues={providerInitialValues}
      createHook={(purchases as any).useCreateProviderMutation}
      editHook={(purchases as any).useEditProviderMutation}
      getByIdHook={(purchases as any).useGetProviderByIdMutation}
      formWidth="w-[560px]"
    />
  )
}
