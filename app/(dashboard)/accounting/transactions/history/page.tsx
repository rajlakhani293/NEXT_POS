"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"

export default function AccountingTransactionHistoryRoute() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/settings/accounting/history")
  }, [router])

  return (
    <div className="flex h-full items-center justify-center gap-3 text-sm font-medium text-gray-600">
      <Spinner className="h-5 w-5" />
      Loading transaction history...
    </div>
  )
}
