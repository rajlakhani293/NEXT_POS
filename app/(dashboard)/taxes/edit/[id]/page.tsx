"use client"

import { useParams, useRouter } from "next/navigation"

import { TaxForm } from "../../../settings/taxes/createUpdate"

export default function EditTaxPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  return (
    <TaxForm
      isOpen
      editId={params.id}
      onClose={() => router.push("/taxes")}
      onSuccess={() => router.push("/taxes")}
    />
  )
}
