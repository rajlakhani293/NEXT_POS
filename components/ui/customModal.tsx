"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "./button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { cn } from "@/lib/utils"

interface CustomModalProps {
  title: string
  description?: string
  trigger?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  onSave?: () => void
  onClose?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  showFooter?: boolean
}

const CustomModal = ({
  title,
  description,
  trigger,
  children,
  footer,
  onSave,
  onClose,
  open,
  onOpenChange,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  showFooter = true,
}: CustomModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn("sm:max-w-[500px] p-0 gap-0 [&>[data-slot=dialog-close]]:hidden", className)}>
        <DialogHeader className={cn("flex flex-row items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 text-left", headerClassName)}>
          <div className="min-w-0 flex-1 space-y-0.5">
            <DialogTitle className="leading-snug">{title}</DialogTitle>
            {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
          </div>
          <DialogClose className="shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <div
          className={cn(
            "no-scrollbar max-h-[70vh] overflow-y-auto p-4",
            bodyClassName
          )}
        >
          {children}
        </div>
        {showFooter && (
          <DialogFooter className={cn("mt-0 border-t border-gray-200 px-4 py-3", footerClassName)}>
            {footer ? (
              footer
            ) : (
              <>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </DialogClose>
                <Button type="button" onClick={onSave}>
                  Save
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal
