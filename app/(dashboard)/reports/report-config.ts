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
}> = [
  {
    key: "sales",
    title: "Sale Report",
    description: "Orders, payment status, totals, paid and due amount.",
    group: "Sales",
  },
  {
    key: "sales_progress",
    title: "Sales Progress",
    description: "Product sales progress with sold quantity and sale amount.",
    group: "Sales",
  },
  {
    key: "customers_statement",
    title: "Customers Statement",
    description: "Customer balances, wallet and credit limit summary.",
    group: "Sales",
  },
  {
    key: "stock_report",
    title: "Stock Report",
    description: "Current stock quantity and stock value by product unit.",
    group: "Inventory",
  },
  {
    key: "stock_ledger",
    title: "Stock History",
    description: "Inventory movement history with quantity and balance.",
    group: "Inventory",
  },
  {
    key: "sold_stock",
    title: "Sold Stock",
    description: "Sold products with quantity, tax, discount and cost.",
    group: "Sales",
  },
  {
    key: "profit",
    title: "Incomes & Losses",
    description: "Sales value, product cost and profit per sold item.",
    group: "Finance",
  },
  {
    key: "accounting",
    title: "Transactions",
    description: "Account transaction history with balance movement.",
    group: "Finance",
  },
  {
    key: "annual",
    title: "Annual Report",
    description: "Monthly breakdown of sales, taxes, expenses and net income for a chosen year.",
    group: "Finance",
  },
  {
    key: "payment_types",
    title: "Sales By Payments",
    description: "Payment collection grouped by cash, bank, card and online.",
    group: "Sales",
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
    { key: "sale_order__code", title: "Order" },
    { key: "payment_type", title: "Payment" },
    { key: "amount", title: "Amount" },
    { key: "paid_at", title: "Paid At" },
    { key: "reference_number", title: "Reference" },
    { key: "note", title: "Note" },
  ],
}

export const isReportKey = (value: string): value is ReportKey =>
  reportTabs.includes(value as ReportKey)
