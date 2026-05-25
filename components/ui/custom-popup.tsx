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

interface CustomPopupProps {
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
}

const CustomPopup = ({
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
}: CustomPopupProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className={cn("sm:max-w-[500px]", className)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <div className="no-scrollbar -mx-6 max-h-[60vh] overflow-y-auto px-6 py-4 border-y border-gray-100">
                    {children}
                </div>
                <DialogFooter>
                    {footer ? (
                        footer
                    ) : (
                        <>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                            </DialogClose>
                            <Button type="button" onClick={onSave}>Save</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CustomPopup