"use client"

import { useState } from "react"
import { AlertTriangle, Database, Info, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { settings } from "@/lib/api/settings"
import { showToast } from "@/lib/toast"

export default function ResetPage() {
  const [resetDatabase, { isLoading }] = (settings as any).useResetDatabaseMutation()
  const [confirmText, setConfirmText] = useState("")

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText !== "RESET") {
      showToast.error("Please type 'RESET' to confirm.")
      return
    }

    try {
      const response = await resetDatabase({}).unwrap()
      showToast.success(response?.message || "Branch database reset successfully.")
      setConfirmText("")
    } catch (err: any) {
      console.error("Failed to reset database", err)
      showToast.error(err?.data?.message || "Failed to reset database.")
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Reset Database</h1>
        <p className="text-sm text-slate-500">
          Truncate branch-specific transactions, sales orders, catalog, and custom settings.
        </p>
      </div>

      <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-rose-100 p-2 text-rose-600 mt-0.5">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h2 className="font-bold text-rose-950">Danger Zone: This Action is Irreversible</h2>
            <p className="mt-1 text-sm text-rose-700 leading-relaxed">
              Performing a soft reset will delete all sales records, suppliers, customer details, product catalogs, categories, ledger accounts, cash registers history, and options for this branch.
            </p>
          </div>
        </div>

        <div className="border-t border-rose-100 pt-4 space-y-2">
          <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
            <Info className="size-3.5" />
            Other branches or company configurations will not be affected.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-semibold text-slate-950">Confirm Database Wipe</h3>
          <p className="mt-1 text-sm text-slate-500">
            Please type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">RESET</span> to confirm your intent and wipe the database.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESET"
            className="h-11 rounded-xl border-gray-200 bg-slate-50 font-semibold tracking-wider placeholder:tracking-normal placeholder:font-normal"
            disabled={isLoading}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="destructive"
              className="h-11 px-6 rounded-xl font-bold gap-2"
              disabled={confirmText !== "RESET" || isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Wiping Database...
                </>
              ) : (
                <>
                  <Database className="size-4" />
                  Wipe Branch Database
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
