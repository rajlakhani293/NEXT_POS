"use client"

import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import CustomModal from "@/components/ui/customModal"
import { useTranslation } from "@/lib/contexts/TranslationContext"

type ConfirmDialogOptions = {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

type PendingConfirmation = ConfirmDialogOptions & {
  resolve: (confirmed: boolean) => void
}

export function useConfirmDialog() {
  const { t } = useTranslation()
  const [pending, setPending] = useState<PendingConfirmation | null>(null)
  const pendingRef = useRef<PendingConfirmation | null>(null)

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      const nextPending = { ...options, resolve }
      pendingRef.current = nextPending
      setPending(nextPending)
    })
  }, [])

  const close = (confirmed: boolean) => {
    const current = pendingRef.current
    if (!current) return
    pendingRef.current = null
    current.resolve(confirmed)
    setPending(null)
  }

  const dialog = (
    <CustomModal
      open={Boolean(pending)}
      onOpenChange={(open) => !open && close(false)}
      title={pending?.title || t("Confirm")}
      className="sm:max-w-[420px]"
      bodyClassName="p-4"
      footerClassName="gap-2"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {pending?.cancelLabel || t("Cancel")}
          </Button>
          <Button
            type="button"
            variant={pending?.variant === "destructive" ? "destructive" : "default"}
            onClick={() => close(true)}
          >
            {pending?.confirmLabel || t("Confirm")}
          </Button>
        </>
      }
    >
      <p className="text-sm font-medium text-gray-600">{pending?.description}</p>
    </CustomModal>
  )

  return { confirm, confirmDialog: dialog }
}
