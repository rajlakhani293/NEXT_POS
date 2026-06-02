"use client"

import { ShieldAlertIcon } from "lucide-react"

import { usePermissions } from "@/hooks/use-permissions"
import type { PermissionRequirement } from "@/lib/permissions"

type PermissionGuardProps = {
  permission: PermissionRequirement
  match?: "all" | "any"
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  match = "all",
  children,
}: PermissionGuardProps) {
  const { hasPermission, isSessionLoaded } = usePermissions()

  if (!isSessionLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Checking access...
      </div>
    )
  }

  if (!hasPermission(permission, match)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed bg-white p-8 text-center shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlertIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Access denied
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to open this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
