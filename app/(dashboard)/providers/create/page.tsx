"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"

export default function CreateProviderRoute() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/purchases/suppliers/create")
  }, [router])

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
        <Spinner className="h-5 w-5" />
        Loading provider form...
      </div>
    </div>
  )
}
