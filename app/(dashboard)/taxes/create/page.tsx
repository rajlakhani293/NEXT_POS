"use client"

import { useRouter } from "next/navigation"

import { TaxForm } from "../../settings/taxes/createUpdate"

export default function CreateTaxPage() {
  const router = useRouter()

  return (
    <TaxForm
      isOpen
      onClose={() => router.push("/taxes")}
      onSuccess={() => router.push("/taxes")}
    />
  )
}
