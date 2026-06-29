"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"

export default function SourceStockFlowRecordsRoute() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/inventory/ledger")
  }, [router])

  return (
    <div className="flex h-full items-center justify-center gap-3 text-sm font-medium text-gray-600">
      <Spinner className="h-5 w-5" />
      Loading stock flow records...
    </div>
  )
}
