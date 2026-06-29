"use client"

import { useRouter } from "next/navigation"

import { UserForm } from "../../settings/users/page"

export default function CreateUserPage() {
  const router = useRouter()

  return (
    <UserForm
      isOpen
      onClose={() => router.push("/users")}
      onSuccess={() => router.push("/users")}
    />
  )
}
