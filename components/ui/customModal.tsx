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
      <DialogContent className={cn("sm:max-w-[500px]", className)}>
        <DialogHeader className={headerClassName}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div
          className={cn(
            "-mx-6 no-scrollbar max-h-[60vh] overflow-y-auto border-y border-gray-100 px-6 py-4",
            bodyClassName
          )}
        >
          {children}
        </div>
        {showFooter && (
          <DialogFooter className={footerClassName}>
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
