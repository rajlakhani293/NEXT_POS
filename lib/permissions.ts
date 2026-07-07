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
    view: "manage.options",
    update: "manage.options",
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
    labels: "products_labels_create",
  },
  categories: {
    view: "categories_view",
    create: "categories_create",
    update: "categories_update",
    delete: "categories_delete",
  },
  productUnits: {
    view: "product_units_view",
    create: "product_units_create",
    update: "product_units_update",
    delete: "product_units_delete",
  },
  taxes: {
    view: "taxes_view",
    create: "taxes_create",
    update: "taxes_update",
    delete: "taxes_delete",
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
    delete: "purchases_delete",
    receive: "purchases_receive",
    pay: "purchases_pay",
  },
  providers: {
    view: "providers_view",
    create: "providers_create",
    update: "providers_update",
    delete: "providers_delete",
  },
  expenses: {
    view: "expenses_view",
    create: "expenses_create",
    update: "expenses_update",
    delete: "expenses_delete",
  },
  transactionHistory: {
    view: "pos.read.transactions-history",
    create: "pos.create.transactions-history",
    update: "pos.update.transactions-history",
    delete: "pos.delete.transactions-history",
  },
  transactionAccounts: {
    view: "pos.read.transactions-account",
    create: "pos.create.transactions-account",
    update: "pos.update.transactions-account",
    delete: "pos.delete.transactions-account",
  },
  sales: {
    view: "sales_view",
    create: "sales_create",
    update: "sales_update",
    delete: "sales_delete",
    void: "sales_void",
    deliver: "pos.deliver.orders",
  },
  returns: {
    view: "returns_view",
    create: "returns_create",
    approve: "returns_approve",
  },
  payments: {
    view: "payments_view",
    create: "payments_create",
    update: "payments_update",
    delete: "payments_delete",
    collectDue: "payments_collect_due",
  },
  media: {
    view: "media_view",
    upload: "media_upload",
    update: "media_update",
    delete: "media_delete",
  },
  cashRegister: {
    view: "cash_register_view",
    create: "cash_register_create",
    update: "cash_register_update",
    delete: "cash_register_delete",
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
    manageModules: "manage.modules",
    manageProfile: "manage.profile",
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
