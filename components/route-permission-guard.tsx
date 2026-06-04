"use client"

import { usePathname } from "next/navigation"

import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS, type PermissionRequirement } from "@/lib/permissions"

type RoutePermission = {
  path: string
  permission: PermissionRequirement
  match?: "all" | "any"
}

const routePermissions: RoutePermission[] = [
  { path: "/sales", permission: PERMISSIONS.sales.view },
  { path: "/customers", permission: PERMISSIONS.customers.view },
  { path: "/reports", permission: PERMISSIONS.reports.view },
  { path: "/inventory/products/create", permission: PERMISSIONS.products.create },
  { path: "/inventory/products", permission: PERMISSIONS.products.view },
  { path: "/inventory/categories", permission: PERMISSIONS.products.view },
  { path: "/inventory/brands", permission: PERMISSIONS.products.view },
  { path: "/inventory/unit-groups", permission: PERMISSIONS.products.view },
  { path: "/inventory/units", permission: PERMISSIONS.products.view },
  { path: "/settings/company", permission: PERMISSIONS.settings.view },
  { path: "/settings/branches", permission: PERMISSIONS.branches.view },
  { path: "/settings/users", permission: PERMISSIONS.users.view },
  { path: "/settings/roles/create", permission: PERMISSIONS.roles.create },
  { path: "/settings/roles", permission: PERMISSIONS.roles.view },
  { path: "/settings/tax-groups", permission: PERMISSIONS.products.view },
  { path: "/settings/taxes", permission: PERMISSIONS.products.view },
]

function resolveRoutePermission(
  pathname: string
): Omit<RoutePermission, "path"> | undefined {
  const productEditMatch = pathname.match(/^\/inventory\/products\/([^/]+)$/)
  if (productEditMatch && productEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.products.update }
  }

  const roleEditMatch = pathname.match(/^\/settings\/roles\/([^/]+)$/)
  if (roleEditMatch && roleEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.roles.update }
  }

  return routePermissions.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`)
  )
}

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
