"use client"

import * as React from "react"
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
      <DialogContent className={cn("sm:max-w-[500px] p-0 gap-0 [&>[data-slot=dialog-close]]:top-3 [&>[data-slot=dialog-close]]:right-3 [&>[data-slot=dialog-close]]:p-2", className)}>
        <DialogHeader className={cn("border-b border-gray-200 p-4 text-left", headerClassName)}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div
          className={cn(
            "no-scrollbar max-h-[70vh] overflow-y-auto p-2",
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
