"use client"

import { usePathname } from "next/navigation"

import { PermissionGuard } from "@/components/permission-guard"
import { resolveRoutePermission } from "@/lib/route-permissions"

export function RoutePermissionGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const route = resolveRoutePermission(pathname)

  if (!route) return <>{children}</>

  return (
    <PermissionGuard permission={route.permission} match={route.match}>
      {children}
    </PermissionGuard>
  )
}
