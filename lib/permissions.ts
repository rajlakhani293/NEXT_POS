export const PERMISSIONS = {
  users: {
    view: "users_view",
    create: "users_create",
    update: "users_update",
    delete: "users_delete",
  },
  roles: {
    view: "roles_view",
    create: "roles_create",
    update: "roles_update",
    delete: "roles_delete",
  },
  settings: {
    view: "settings_view",
    update: "settings_update",
  },
  branches: {
    view: "branches_view",
    create: "branches_create",
    update: "branches_update",
    delete: "branches_delete",
  },
  customers: {
    view: "customers_view",
    create: "customers_create",
    update: "customers_update",
    delete: "customers_delete",
  },
  products: {
    view: "products_view",
    create: "products_create",
    update: "products_update",
    delete: "products_delete",
  },
  inventory: {
    view: "inventory_view",
    adjust: "inventory_adjust",
    transfer: "inventory_transfer",
    count: "inventory_count",
  },
  purchases: {
    view: "purchases_view",
    create: "purchases_create",
    update: "purchases_update",
    receive: "purchases_receive",
    pay: "purchases_pay",
  },
  sales: {
    view: "sales_view",
    create: "sales_create",
    update: "sales_update",
    void: "sales_void",
  },
  returns: {
    view: "returns_view",
    create: "returns_create",
    approve: "returns_approve",
  },
  payments: {
    view: "payments_view",
    create: "payments_create",
    collectDue: "payments_collect_due",
  },
  cashRegister: {
    view: "cash_register_view",
    open: "cash_register_open",
    close: "cash_register_close",
    cashIn: "cash_register_cash_in",
    cashOut: "cash_register_cash_out",
  },
  rewards: {
    view: "rewards_view",
    create: "rewards_create",
    update: "rewards_update",
    delete: "rewards_delete",
  },
  promotions: {
    view: "promotions_view",
    create: "promotions_create",
    update: "promotions_update",
    delete: "promotions_delete",
  },
  reports: {
    view: "reports_view",
    export: "reports_export",
  },
  special: {
    refundOrder: "refund_order",
    priceOverride: "price_override",
    manualDiscount: "manual_discount",
    viewProfitReport: "view_profit_report",
    shiftDifferenceClose: "shift_difference_close",
  },
} as const

export type PermissionRequirement = string | string[] | undefined

export function normalizePermissionCodes(permissions: unknown): string[] {
  if (!Array.isArray(permissions)) return []

  return permissions
    .map((permission) => {
      if (typeof permission === "string") return permission
      if (
        permission &&
        typeof permission === "object" &&
        "codename" in permission &&
        typeof permission.codename === "string"
      ) {
        return permission.codename
      }
      return null
    })
    .filter((permission): permission is string => Boolean(permission))
}

export function userHasPermission(
  user: any,
  required: PermissionRequirement,
  match: "all" | "any" = "all"
) {
  if (!required || (Array.isArray(required) && required.length === 0))
    return true
  if (!user) return false
  if (user.is_superuser) return true

  const permissions = new Set(
    normalizePermissionCodes(user.permissions || user.user_permissions)
  )

  if (permissions.has("*")) return true

  const requiredPermissions = Array.isArray(required) ? required : [required]
  return match === "any"
    ? requiredPermissions.some((permission) => permissions.has(permission))
    : requiredPermissions.every((permission) => permissions.has(permission))
}
