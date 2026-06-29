"use client"

import { useParams, useRouter } from "next/navigation"

import { TaxGroupForm } from "../../../../settings/tax-groups/createUpdate"

export default function EditTaxGroupPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  return (
    <TaxGroupForm
      isOpen
      editId={params.id}
      onClose={() => router.push("/taxes/groups")}
      onSuccess={() => router.push("/taxes/groups")}
    />
  )
}
