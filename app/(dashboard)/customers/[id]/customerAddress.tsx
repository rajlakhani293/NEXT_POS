"use client"

import { MapPin, PencilLine, Plus } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AddressType = "billing" | "shipping"

export type AddressFormValues = {
  first_name: string
  last_name: string
  phone: string
  email: string
  address_1: string
  address_2: string
  country: string
  city: string
  pobox: string
  company_name: string
}

type CustomerAddressAddonProps = {
  openType: AddressType | null
  onOpenChange: (type: AddressType | null) => void
  billingAddress: AddressFormValues
  shippingAddress: AddressFormValues
  onAddressChange: (type: AddressType, address: AddressFormValues) => void
}

const emptyAddressValues: AddressFormValues = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  address_1: "",
  address_2: "",
  country: "",
  city: "",
  pobox: "",
  company_name: "",
}

const hasAddress = (address: AddressFormValues) =>
  Boolean(
    address.first_name ||
      address.last_name ||
      address.phone ||
      address.email ||
      address.address_1 ||
      address.address_2 ||
      address.country ||
      address.city ||
      address.pobox ||
      address.company_name
  )

export function CustomerAddressAddon({
  openType,
  onOpenChange,
  billingAddress,
  shippingAddress,
  onAddressChange,
}: CustomerAddressAddonProps) {
  const getAddressValues = (type: AddressType) =>
    type === "billing" ? billingAddress : shippingAddress

  const activeAddressValues = openType
    ? getAddressValues(openType)
    : emptyAddressValues

  const addressFields = [
    {
      name: "first_name",
      label: "First Name",
      type: "text",
      placeholder: "Enter first name",
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      placeholder: "Enter last name",
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      placeholder: "Enter phone number",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email address",
    },
    {
      name: "address_1",
      label: "Address Line 1",
      type: "text",
      placeholder: "Enter address line 1",
    },
    {
      name: "address_2",
      label: "Address Line 2",
      type: "text",
      placeholder: "Enter address line 2",
    },
    {
      name: "country",
      label: "Country",
      type: "text",
      placeholder: "Enter country",
    },
    {
      name: "city",
      label: "City",
      type: "text",
      placeholder: "Enter city",
    },
    {
      name: "pobox",
      label: "PO.Box",
      type: "text",
      placeholder: "Enter postal address / PO box",
    },
    {
      name: "company_name",
      label: "Company",
      type: "text",
      placeholder: "Enter company name",
    },
  ]

  const handleAddressSubmit = async (address: AddressFormValues) => {
    if (!openType) return
    onAddressChange(openType, address)
    onOpenChange(null)
  }

  const renderAddressCard = (type: AddressType, title: string) => {
    const address = getAddressValues(type)
    const isAdded = hasAddress(address)

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <MapPin className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {isAdded ? "Address added" : "No address added yet"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={isAdded ? "outline" : "default"}
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              !isAdded && "bg-black text-white hover:bg-black/90"
            )}
            onClick={() => onOpenChange(type)}
          >
            {isAdded ? (
              <PencilLine className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {isAdded ? "Edit" : "Add"}
          </Button>
        </div>

        {isAdded ? (
          <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm font-medium leading-6 text-gray-600">
            {address.first_name || address.last_name || address.company_name ? (
              <div className="font-semibold text-gray-900">
                {`${address.first_name || ""} ${address.last_name || ""}`.trim()}
                {address.company_name ? ` (${address.company_name})` : ""}
              </div>
            ) : null}
            {address.address_1 ? <div>{address.address_1}</div> : null}
            {address.address_2 ? <div>{address.address_2}</div> : null}
            <div>
              {[address.city, address.pobox, address.country].filter(Boolean).join(", ")}
            </div>
            {address.phone || address.email ? (
              <div className="mt-1 text-xs text-gray-500">
                {[address.phone, address.email].filter(Boolean).join(" | ")}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Addresses
            </h2>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Add billing and shipping address from side forms.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {renderAddressCard("billing", "Billing Address")}
          {renderAddressCard("shipping", "Shipping Address")}
        </div>
      </section>

      <DynamicForm<AddressFormValues>
        key={openType || "address-form"}
        fields={addressFields as any}
        initialValues={activeAddressValues}
        onSubmit={handleAddressSubmit}
        onClose={() => onOpenChange(null)}
        title={openType === "shipping" ? "Shipping Address" : "Billing Address"}
        note="Add address details for this customer."
        isOpen={Boolean(openType)}
        formWidth="w-[460px]"
      />
    </>
  )
}
