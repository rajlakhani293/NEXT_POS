import { PERMISSIONS, type PermissionRequirement } from "@/lib/permissions"

export const reportTabs = [
  "sales",
  "sales_progress",
  "customers_statement",
  "low_stock",
  "stock_report",
  "stock_ledger",
  "sold_stock",
  "profit",
  "accounting",
  "annual",
  "payment_types",
] as const

export type ReportKey = (typeof reportTabs)[number]

export const tabLabels: Record<ReportKey, string> = {
  sales: "Sale Report",
  sales_progress: "Sales Progress",
  customers_statement: "Customers Statement",
  low_stock: "Low Stock",
  stock_report: "Stock Report",
  stock_ledger: "Stock History",
  sold_stock: "Sold Stock",
  profit: "Incomes & Losses",
  accounting: "Transactions",
  annual: "Annual Report",
  payment_types: "Sales By Payments",
}

export const reportCards: Array<{
  key: ReportKey
  title: string
  description: string
  group: string
  permission: PermissionRequirement
  permissionMatch?: "all" | "any"
}> = [
  {
    key: "sales",
    title: "Sale Report",
    description: "Provides an overview over the sales during a specific period",
    group: "Sales",
    permission: PERMISSIONS.reports.sales,
  },
  {
    key: "sales_progress",
    title: "Sales Progress",
    description: "Provides an overview over the best products sold during a specific period.",
    group: "Sales",
    permission: PERMISSIONS.reports.products,
  },
  {
    key: "customers_statement",
    title: "Customers Statement",
    description: "Display the complete customer statement.",
    group: "Customers",
    permission: PERMISSIONS.reports.customersStatement,
  },
  {
    key: "stock_report",
    title: "Stock Report",
    description: "Provides an overview of the products stock.",
    group: "Inventory",
    permission: [PERMISSIONS.reports.inventory, PERMISSIONS.reports.lowStock],
    permissionMatch: "any",
  },
  {
    key: "stock_ledger",
    title: "Stock History",
    description: "Provides a combined report for every transactions on products.",
    group: "Inventory",
    permission: PERMISSIONS.reports.stockHistory,
  },
  {
    key: "sold_stock",
    title: "Sold Stock",
    description: "Provides an overview over the sold stock during a specific period.",
    group: "Sales",
    permission: PERMISSIONS.reports.sales,
  },
  {
    key: "profit",
    title: "Incomes & Losses",
    description: "Provides an overview of the provide of the products sold.",
    group: "Finance",
    permission: PERMISSIONS.reports.sales,
  },
  {
    key: "accounting",
    title: "Transactions",
    description: "Provides an overview on the activity for a specific period.",
    group: "Finance",
    permission: PERMISSIONS.reports.transactions,
  },
  {
    key: "annual",
    title: "Annual Report",
    description: "Provides an overview over the sales during a specific period",
    group: "Finance",
    permission: PERMISSIONS.reports.yearly,
  },
  {
    key: "payment_types",
    title: "Sales By Payments",
    description: "Provide a report of the sales by payment types, for a specific period.",
    group: "Sales",
    permission: PERMISSIONS.reports.paymentTypes,
  },
]

export const reportGroups = Array.from(
  new Set(reportCards.map((report) => report.group))
)

export const reportColumns: Record<ReportKey, any[]> = {
  sales: [
    { key: "code", title: "Order" },
    { key: "customer__name", title: "Customer" },
    { key: "cashier__full_name", title: "Cashier" },
    { key: "order_type", title: "Type" },
    { key: "payment_status", title: "Payment" },
    { key: "total", title: "Total" },
    { key: "tendered_amount", title: "Paid" },
    { key: "due_amount", title: "Due" },
    { key: "created_at", title: "Date" },
  ],
  sales_progress: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "product_type", title: "Type" },
    { key: "current_stock", title: "Stock" },
    { key: "sold_quantity", title: "Sold Qty" },
    { key: "sold_amount", title: "Sold Amount" },
    { key: "selling_price", title: "Selling" },
  ],
  customers_statement: [
    { key: "operation", title: "Operation" },
    { key: "amount", title: "Amount" },
    { key: "previous_amount", title: "Previous Amount" },
    { key: "next_amount", title: "Next Amount" },
    { key: "description", title: "Description" },
    { key: "created_at", title: "Date" },
  ],
  low_stock: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "current_stock", title: "Stock" },
    { key: "min_stock", title: "Min" },
    { key: "max_stock", title: "Max" },
    { key: "purchase_price", title: "Purchase" },
    { key: "selling_price", title: "Selling" },
  ],
  stock_ledger: [
    { key: "product__name", title: "Product" },
    { key: "unit__name", title: "Unit" },
    { key: "initial_quantity", title: "Initial Quantity" },
    { key: "procured_quantity", title: "Procured Quantity" },
    { key: "sold_quantity", title: "Sold Quantity" },
    { key: "defective_quantity", title: "Defective Quantity" },
    { key: "final_quantity", title: "Final Quantity" },
    { key: "date", title: "Date" },
  ],
  stock_report: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "product_type", title: "Type" },
    { key: "current_stock", title: "Quantity" },
    { key: "selling_price", title: "Price" },
    { key: "stock_value", title: "Total Price" },
    { key: "purchase_price", title: "Purchase" },
  ],
  sold_stock: [
    { key: "sale_order__code", title: "Order" },
    { key: "product__name", title: "Product" },
    { key: "quantity", title: "Qty" },
    { key: "unit_price", title: "Price" },
    { key: "discount_amount", title: "Discount" },
    { key: "tax_amount", title: "Tax" },
    { key: "total", title: "Total" },
    { key: "cost_price", title: "Cost" },
    { key: "created_at", title: "Date" },
  ],
  profit: [
    { key: "sale_order__code", title: "Order" },
    { key: "product__name", title: "Product" },
    { key: "quantity", title: "Qty" },
    { key: "total", title: "Sales" },
    { key: "cost_total", title: "Cost" },
    { key: "profit_amount", title: "Profit" },
    { key: "created_at", title: "Date" },
  ],
  accounting: [
    { key: "name", title: "Account" },
    { key: "debits", title: "Debit" },
    { key: "credits", title: "Credit" },
  ],
  annual: [
    { key: "label", title: "Month" },
    { key: "total_sales", title: "Sales" },
    { key: "total_taxes", title: "Taxes" },
    { key: "total_expenses", title: "Expenses" },
    { key: "net_income", title: "Net Income" },
    { key: "order_count", title: "Orders" },
  ],
  payment_types: [
    { key: "label", title: "Summary" },
    { key: "total", title: "Total" },
  ],
}

export const isReportKey = (value: string): value is ReportKey =>
  reportTabs.includes(value as ReportKey)
