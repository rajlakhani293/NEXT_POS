"use client"

import { useParams, useRouter } from "next/navigation"

import { UserForm } from "../../../settings/users/page"

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  return (
    <UserForm
      isOpen
      editId={params.id}
      onClose={() => router.push("/users")}
      onSuccess={() => router.push("/users")}
    />
  )
}
