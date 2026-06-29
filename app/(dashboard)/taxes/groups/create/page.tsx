"use client"

import { useRouter } from "next/navigation"

import { TaxGroupForm } from "../../../settings/tax-groups/createUpdate"

export default function CreateTaxGroupPage() {
  const router = useRouter()

  return (
    <TaxGroupForm
      isOpen
      onClose={() => router.push("/taxes/groups")}
      onSuccess={() => router.push("/taxes/groups")}
    />
  )
}
