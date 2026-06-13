import { PERMISSIONS, type PermissionRequirement } from "@/lib/permissions"

export type RoutePermission = {
  path: string
  permission: PermissionRequirement
  match?: "all" | "any"
}

export type ResolvedRoutePermission = Omit<RoutePermission, "path">

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: "/dashboard", permission: PERMISSIONS.reports.view },
  { path: "/sales", permission: PERMISSIONS.sales.view },
  { path: "/sales/history", permission: PERMISSIONS.sales.view },
  { path: "/sales/receipt", permission: PERMISSIONS.sales.view },
  { path: "/customers/groups", permission: PERMISSIONS.customers.view },
  { path: "/customers/credit", permission: PERMISSIONS.customers.view },
  { path: "/customers/rewards", permission: PERMISSIONS.rewards.view },
  { path: "/customers/coupons", permission: PERMISSIONS.promotions.view },
  { path: "/customers/create", permission: PERMISSIONS.customers.create },
  { path: "/customers", permission: PERMISSIONS.customers.view },
  { path: "/purchases/orders/create", permission: PERMISSIONS.purchases.create },
  { path: "/purchases/products", permission: PERMISSIONS.purchases.view },
  { path: "/purchases/orders", permission: PERMISSIONS.purchases.view },
  { path: "/purchases/suppliers", permission: PERMISSIONS.purchases.view },
  { path: "/purchases", permission: PERMISSIONS.purchases.view },
  { path: "/expenses/categories", permission: PERMISSIONS.expenses.view },
  { path: "/expenses", permission: PERMISSIONS.expenses.view },
  { path: "/registers", permission: PERMISSIONS.cashRegister.view },
  { path: "/reports", permission: PERMISSIONS.reports.view },
  { path: "/inventory/products/create", permission: PERMISSIONS.products.create },
  { path: "/inventory/products", permission: PERMISSIONS.products.view },
  { path: "/inventory/categories", permission: PERMISSIONS.products.view },
  { path: "/inventory/brands", permission: PERMISSIONS.products.view },
  { path: "/inventory/unit-groups", permission: PERMISSIONS.products.view },
  { path: "/inventory/units", permission: PERMISSIONS.products.view },
  { path: "/inventory/adjustments", permission: PERMISSIONS.inventory.view },
  { path: "/inventory/ledger", permission: PERMISSIONS.inventory.view },
  { path: "/settings/company", permission: PERMISSIONS.settings.view },
  { path: "/settings/business", permission: PERMISSIONS.settings.view },
  { path: "/settings/accounting/accounts", permission: PERMISSIONS.reports.view },
  { path: "/settings/accounting/rules", permission: PERMISSIONS.reports.view },
  { path: "/settings/accounting/transactions", permission: PERMISSIONS.reports.view },
  { path: "/settings/accounting/history", permission: PERMISSIONS.reports.view },
  { path: "/settings/accounting/configuration", permission: PERMISSIONS.reports.view },
  { path: "/settings/notifications", permission: PERMISSIONS.settings.view },
  { path: "/settings/media", permission: PERMISSIONS.settings.view },
  { path: "/settings/branches", permission: PERMISSIONS.branches.view },
  { path: "/settings/users", permission: PERMISSIONS.users.view },
  { path: "/settings/roles/create", permission: PERMISSIONS.roles.create },
  { path: "/settings/roles", permission: PERMISSIONS.roles.view },
  { path: "/settings/tax-groups", permission: PERMISSIONS.products.view },
  { path: "/settings/taxes", permission: PERMISSIONS.products.view },
  { path: "/settings/coupons/create", permission: PERMISSIONS.promotions.create },
  { path: "/settings/coupons", permission: PERMISSIONS.promotions.view },
  { path: "/settings/rewards/create", permission: PERMISSIONS.rewards.create },
  { path: "/settings/rewards", permission: PERMISSIONS.rewards.view },
]

export function resolveRoutePermission(
  pathname: string
): ResolvedRoutePermission | undefined {
  const productEditMatch = pathname.match(/^\/inventory\/products\/([^/]+)$/)
  if (productEditMatch && productEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.products.update }
  }

  const roleEditMatch = pathname.match(/^\/settings\/roles\/([^/]+)$/)
  if (roleEditMatch && roleEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.roles.update }
  }

  const couponEditMatch = pathname.match(/^\/settings\/coupons\/([^/]+)$/)
  if (couponEditMatch && couponEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.promotions.update }
  }

  const rewardEditMatch = pathname.match(/^\/settings\/rewards\/([^/]+)$/)
  if (rewardEditMatch && rewardEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.rewards.update }
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

  const saleDetailMatch = pathname.match(/^\/sales\/([^/]+)$/)
  if (saleDetailMatch && saleDetailMatch[1] !== "history") {
    return { permission: PERMISSIONS.sales.view }
  }

  return ROUTE_PERMISSIONS.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`)
  )
}
