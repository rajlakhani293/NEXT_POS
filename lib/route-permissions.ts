import { PERMISSIONS, type PermissionRequirement } from "@/lib/permissions"

export type RoutePermission = {
  path: string
  permission: PermissionRequirement
  match?: "all" | "any"
}

export type ResolvedRoutePermission = Omit<RoutePermission, "path">

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: "/dashboard", permission: PERMISSIONS.dashboard.view },
  { path: "/sales/create", permission: PERMISSIONS.sales.create },
  { path: "/sales/assigned", permission: PERMISSIONS.sales.deliver },
  { path: "/sales/instalments", permission: PERMISSIONS.payments.collectDue },
  { path: "/sales/payment-types", permission: PERMISSIONS.payments.view },
  { path: "/sales", permission: PERMISSIONS.sales.view },
  { path: "/customers/groups", permission: PERMISSIONS.customers.view },
  { path: "/customers", permission: PERMISSIONS.customers.view },
  { path: "/rewards-system/create", permission: PERMISSIONS.rewards.create },
  { path: "/rewards-system", permission: PERMISSIONS.rewards.view },
  { path: "/coupons/create", permission: PERMISSIONS.promotions.create },
  { path: "/coupons", permission: PERMISSIONS.promotions.view },
  { path: "/providers", permission: PERMISSIONS.providers.view },
  { path: "/purchases/orders/create", permission: PERMISSIONS.purchases.create },
  { path: "/purchases/products", permission: PERMISSIONS.purchases.view },
  { path: "/purchases", permission: PERMISSIONS.purchases.view },
  {
    path: "/accounting/transactions/create",
    permission: [PERMISSIONS.expenses.create, PERMISSIONS.expenses.update],
    match: "any",
  },
  { path: "/accounting/transactions/history", permission: PERMISSIONS.expenses.view },
  { path: "/accounting/transactions", permission: PERMISSIONS.expenses.view },
  { path: "/accounting/accounts", permission: PERMISSIONS.transactionAccounts.view },
  { path: "/accounting/rules", permission: PERMISSIONS.expenses.update },
  { path: "/registers", permission: PERMISSIONS.cashRegister.view },
  { path: "/inventory/products/create", permission: PERMISSIONS.products.create },
  { path: "/inventory/products", permission: PERMISSIONS.products.view },
  { path: "/inventory/labels", permission: PERMISSIONS.products.labels },
  { path: "/inventory/categories", permission: PERMISSIONS.categories.view },
  { path: "/inventory/unit-groups", permission: PERMISSIONS.productUnits.view },
  { path: "/inventory/units", permission: PERMISSIONS.productUnits.view },
  { path: "/inventory/adjustments", permission: PERMISSIONS.inventory.adjust },
  { path: "/inventory/ledger", permission: PERMISSIONS.products.view },
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
  const exactRoute = ROUTE_PERMISSIONS.find((route) => pathname === route.path)
  if (exactRoute) {
    return exactRoute
  }

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

  const customerEditMatch = pathname.match(/^\/customers\/(\d+)$/)
  if (customerEditMatch && customerEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.customers.update }
  }

  const couponEditMatch = pathname.match(/^\/coupons\/([^/]+)$/)
  if (couponEditMatch && couponEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.promotions.update }
  }

  const rewardSystemEditMatch = pathname.match(/^\/rewards-system\/([^/]+)$/)
  if (rewardSystemEditMatch && rewardSystemEditMatch[1] !== "create") {
    return { permission: PERMISSIONS.rewards.update }
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

  const reportMatch = pathname.match(/^\/reports\/([^/]+)$/)
  if (reportMatch) {
    const reportPermissions: Record<string, ResolvedRoutePermission> = {
      sales: { permission: PERMISSIONS.reports.sales },
      sales_progress: { permission: PERMISSIONS.reports.products },
      customers_statement: { permission: PERMISSIONS.reports.customersStatement },
      low_stock: { permission: PERMISSIONS.reports.lowStock },
      stock_report: {
        permission: [PERMISSIONS.reports.inventory, PERMISSIONS.reports.lowStock],
        match: "any",
      },
      stock_ledger: { permission: PERMISSIONS.reports.stockHistory },
      sold_stock: { permission: PERMISSIONS.reports.sales },
      profit: { permission: PERMISSIONS.reports.sales },
      accounting: { permission: PERMISSIONS.reports.transactions },
      annual: { permission: PERMISSIONS.reports.yearly },
      payment_types: { permission: PERMISSIONS.reports.paymentTypes },
    }
    return reportPermissions[reportMatch[1]]
  }

  if (pathname === "/reports") {
    return {
      permission: [
        PERMISSIONS.reports.sales,
        PERMISSIONS.reports.products,
        PERMISSIONS.reports.customersStatement,
        PERMISSIONS.reports.lowStock,
        PERMISSIONS.reports.inventory,
        PERMISSIONS.reports.stockHistory,
        PERMISSIONS.reports.transactions,
        PERMISSIONS.reports.yearly,
        PERMISSIONS.reports.paymentTypes,
      ],
      match: "any",
    }
  }

  const saleDetailMatch = pathname.match(/^\/sales\/(\d+)$/)
  if (saleDetailMatch && saleDetailMatch[1] !== "history") {
    return { permission: PERMISSIONS.sales.view }
  }

  return ROUTE_PERMISSIONS.find((route) => pathname.startsWith(`${route.path}/`))
}
