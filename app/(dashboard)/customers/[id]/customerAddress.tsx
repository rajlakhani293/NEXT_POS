"use client"

import { MapPin, PencilLine, Plus } from "lucide-react"

import DynamicForm from "@/components/DynamicForm"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AddressType = "billing" | "shipping"

export type AddressFormValues = {
  address_line_1: string
  pincode: string
  city: string
}

type CustomerAddressAddonProps = {
  openType: AddressType | null
  onOpenChange: (type: AddressType | null) => void
  billingAddress: AddressFormValues
  shippingAddress: AddressFormValues
  onAddressChange: (type: AddressType, address: AddressFormValues) => void
}

const emptyAddressValues: AddressFormValues = {
  address_line_1: "",
  pincode: "",
  city: "",
}

const sanitizePincode = (value: string) => value.replace(/\D/g, "").slice(0, 6)

const hasAddress = (address: AddressFormValues) =>
  Boolean(address.address_line_1 || address.pincode || address.city)

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
      name: "address_line_1",
      label: "Address Line 1",
      type: "text",
      placeholder: `Enter ${openType || ""} address`,
    },
    {
      name: "pincode",
      label: "Pincode",
      type: "text",
      placeholder: "Enter 6 digit pincode",
      maxLength: 6,
      inputMode: "numeric",
      sanitize: sanitizePincode,
      validate: (value: string) => {
        if (!value) return ""
        if (!/^\d{6}$/.test(value)) return "Pincode must be 6 digits"
        return ""
      },
    },
    {
      name: "city",
      label: "City",
      type: "text",
      placeholder: "Enter city",
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
            {address.address_line_1 ? <div>{address.address_line_1}</div> : null}
            <div>
              {[address.city, address.pincode].filter(Boolean).join(", ")}
            </div>
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
