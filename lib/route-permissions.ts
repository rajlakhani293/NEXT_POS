import { PERMISSIONS, type PermissionRequirement } from "@/lib/permissions"

export type RoutePermission = {
  path: string
  permission: PermissionRequirement
  match?: "all" | "any"
}

export type ResolvedRoutePermission = Omit<RoutePermission, "path">

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: "/dashboard", permission: PERMISSIONS.reports.view },
  { path: "/sales/create", permission: PERMISSIONS.sales.create },
  { path: "/sales/payment-types", permission: PERMISSIONS.payments.view },
  { path: "/sales", permission: PERMISSIONS.sales.view },
  { path: "/sales/history", permission: PERMISSIONS.sales.view },
  { path: "/sales/receipt", permission: PERMISSIONS.sales.view },
  { path: "/customers/groups", permission: PERMISSIONS.customers.view },
  { path: "/customers/rewards-system", permission: PERMISSIONS.rewards.view },
  { path: "/customers/credit", permission: PERMISSIONS.customers.view },
  { path: "/customers/coupons", permission: PERMISSIONS.promotions.view },
  { path: "/customers/coupons-generated", permission: PERMISSIONS.promotions.view },
  { path: "/customers/rewards", permission: PERMISSIONS.rewards.view },
  { path: "/customers", permission: PERMISSIONS.customers.view },
  { path: "/providers", permission: PERMISSIONS.providers.view },
  { path: "/purchases/orders/create", permission: PERMISSIONS.purchases.create },
  { path: "/purchases/products", permission: PERMISSIONS.purchases.view },
  { path: "/purchases/orders", permission: PERMISSIONS.purchases.view },
  { path: "/purchases", permission: PERMISSIONS.purchases.view },
  {
    path: "/accounting/transactions/create",
    permission: [PERMISSIONS.expenses.create, PERMISSIONS.expenses.update],
    match: "any",
  },
  { path: "/accounting/transactions/history", permission: PERMISSIONS.expenses.view },
  { path: "/accounting/transactions", permission: PERMISSIONS.expenses.view },
  { path: "/accounting/accounts", permission: PERMISSIONS.expenses.view },
  { path: "/accounting/rules", permission: PERMISSIONS.expenses.update },
  { path: "/registers", permission: PERMISSIONS.cashRegister.view },
  { path: "/reports", permission: PERMISSIONS.reports.view },
  { path: "/inventory/products/create", permission: PERMISSIONS.products.create },
  { path: "/inventory/products", permission: PERMISSIONS.products.view },
  { path: "/inventory/labels", permission: PERMISSIONS.products.view },
  { path: "/inventory/categories", permission: PERMISSIONS.products.view },
  { path: "/inventory/brands", permission: PERMISSIONS.products.view },
  { path: "/inventory/unit-groups", permission: PERMISSIONS.products.view },
  { path: "/inventory/units", permission: PERMISSIONS.products.view },
  { path: "/inventory/adjustments", permission: PERMISSIONS.inventory.adjust },
  { path: "/inventory/ledger", permission: PERMISSIONS.inventory.view },
  { path: "/inventory/scale-range", permission: PERMISSIONS.inventory.adjust },
  { path: "/modules/upload", permission: PERMISSIONS.special.manageModules },
  { path: "/modules", permission: PERMISSIONS.special.manageModules },
  { path: "/medias", permission: PERMISSIONS.media.view },
  { path: "/settings/users/profile", permission: PERMISSIONS.special.manageProfile },
  { path: "/settings/roles/permissions-manager", permission: PERMISSIONS.roles.update },
  { path: "/settings/roles/new", permission: PERMISSIONS.roles.create },
  { path: "/settings/roles", permission: PERMISSIONS.roles.view },
  { path: "/settings/users", permission: PERMISSIONS.users.view },
  { path: "/settings/general", permission: PERMISSIONS.settings.view },
  { path: "/settings/company", permission: PERMISSIONS.settings.view },
  { path: "/settings/branches", permission: PERMISSIONS.branches.view },
  { path: "/settings/pos", permission: PERMISSIONS.settings.view },
  { path: "/settings/customers", permission: PERMISSIONS.settings.view },
  { path: "/settings/orders", permission: PERMISSIONS.settings.view },
  { path: "/settings/reports", permission: PERMISSIONS.settings.view },
  { path: "/settings/invoices", permission: PERMISSIONS.settings.view },
  { path: "/settings/workers", permission: PERMISSIONS.settings.view },
  { path: "/settings/reset", permission: PERMISSIONS.settings.view },
  { path: "/settings/about", permission: PERMISSIONS.settings.view },
  { path: "/settings/accounting", permission: PERMISSIONS.settings.view },
  { path: "/settings/tax-groups", permission: PERMISSIONS.taxes.view },
  { path: "/settings/taxes", permission: PERMISSIONS.taxes.view },
  { path: "/settings", permission: PERMISSIONS.settings.view },
]

export function resolveRoutePermission(
  pathname: string
): ResolvedRoutePermission | undefined {
  if (pathname === "/sales/create") {
    return { permission: PERMISSIONS.sales.create }
  }

  const productEditMatch = pathname.match(/^\/inventory\/products\/([^/]+)$/)
  if (productEditMatch && productEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.products.update }
  }

  const roleEditMatch = pathname.match(/^\/settings\/roles\/([^/]+)$/)
  if (
    roleEditMatch &&
    roleEditMatch[1] !== "create" &&
    roleEditMatch[1] !== "new"
  ) {
    return { permission: PERMISSIONS.roles.update }
  }

  const customerEditMatch = pathname.match(/^\/customers\/([^/]+)$/)
  if (customerEditMatch && customerEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.customers.update }
  }

  const purchaseOrderEditMatch = pathname.match(/^\/purchases\/orders\/([^/]+)$/)
  if (purchaseOrderEditMatch && purchaseOrderEditMatch[1] !== "create") {
    return {
      permission: [
        PERMISSIONS.purchases.update,
        PERMISSIONS.purchases.receive,
        PERMISSIONS.purchases.pay,
      ],
      match: "any",
    }
  }

  if (pathname === "/sales/instalments") {
    return { permission: PERMISSIONS.payments.collectDue }
  }

  const saleDetailMatch = pathname.match(/^\/sales\/([^/]+)$/)
  if (saleDetailMatch && saleDetailMatch[1] !== "history") {
    return { permission: PERMISSIONS.sales.view }
  }

  return ROUTE_PERMISSIONS.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`)
  )
}
