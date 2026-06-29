"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"

export default function CustomerAccountHistoryRoute() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/customers/credit?customer_id=${id}`)
    }
  }, [id, router])

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
        <Spinner className="h-5 w-5" />
        Loading account history...
      </div>
    </div>
  )
}
