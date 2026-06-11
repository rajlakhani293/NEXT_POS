export const reportTabs = [
  "sales",
  "sold_stock",
  "profit",
  "payment_types",
  "products",
  "low_stock",
  "stock",
  "cashier",
  "customer_due",
  "supplier_payable",
  "stock_ledger",
  "customer_credit",
  "accounting",
] as const

export type ReportKey = (typeof reportTabs)[number]

export const tabLabels: Record<ReportKey, string> = {
  sales: "Sale Report",
  sold_stock: "Sold Stock",
  profit: "Profit",
  payment_types: "Payment Types",
  products: "Products",
  low_stock: "Low Stock",
  stock: "Stock",
  cashier: "Cashier",
  customer_due: "Customer Due",
  supplier_payable: "Supplier Payable",
  stock_ledger: "Stock Ledger",
  customer_credit: "Customer Credit",
  accounting: "Accounting",
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
    key: "sold_stock",
    title: "Sold Stock",
    description: "Sold products with quantity, tax, discount and cost.",
    group: "Sales",
  },
  {
    key: "profit",
    title: "Profit",
    description: "Sales value, product cost and profit per sold item.",
    group: "Sales",
  },
  {
    key: "payment_types",
    title: "Payment Types",
    description: "Payment collection grouped by cash, bank, card and online.",
    group: "Sales",
  },
  {
    key: "products",
    title: "Products",
    description: "Product master with sold quantity and sale amount.",
    group: "Inventory",
  },
  {
    key: "low_stock",
    title: "Low Stock",
    description: "Items currently below their configured minimum stock.",
    group: "Inventory",
  },
  {
    key: "stock",
    title: "Stock",
    description: "Current stock, opening stock and stock tracking status.",
    group: "Inventory",
  },
  {
    key: "stock_ledger",
    title: "Stock Ledger",
    description: "Inventory movement history with quantity and balance.",
    group: "Inventory",
  },
  {
    key: "cashier",
    title: "Cashier",
    description: "Cashier-wise order count, sales, paid and due amount.",
    group: "People",
  },
  {
    key: "customer_due",
    title: "Customer Due",
    description: "Outstanding receivable amount customer-wise.",
    group: "People",
  },
  {
    key: "supplier_payable",
    title: "Supplier Payable",
    description: "Outstanding payable amount supplier-wise.",
    group: "People",
  },
  {
    key: "customer_credit",
    title: "Customer Credit",
    description: "Customer wallet and credit ledger movement report.",
    group: "People",
  },
  {
    key: "accounting",
    title: "Accounting",
    description: "Account transaction history with balance movement.",
    group: "Finance",
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
  payment_types: [
    { key: "sale_order__code", title: "Order" },
    { key: "payment_type", title: "Payment" },
    { key: "amount", title: "Amount" },
    { key: "paid_at", title: "Paid At" },
    { key: "reference_number", title: "Reference" },
    { key: "note", title: "Note" },
  ],
  products: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "product_type", title: "Type" },
    { key: "current_stock", title: "Stock" },
    { key: "sold_quantity", title: "Sold Qty" },
    { key: "sold_amount", title: "Sold Amount" },
    { key: "selling_price", title: "Selling" },
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
  stock: [
    { key: "name", title: "Product" },
    { key: "sku", title: "SKU" },
    { key: "barcode", title: "Barcode" },
    { key: "product_type", title: "Type" },
    { key: "track_stock", title: "Track" },
    { key: "opening_stock", title: "Opening" },
    { key: "current_stock", title: "Current" },
    { key: "min_stock", title: "Min" },
    { key: "max_stock", title: "Max" },
  ],
  cashier: [
    { key: "cashier__full_name", title: "Cashier" },
    { key: "order_count", title: "Orders" },
    { key: "total_sales", title: "Sales" },
    { key: "total_paid", title: "Paid" },
    { key: "total_due", title: "Due" },
  ],
  customer_due: [
    { key: "name", title: "Customer" },
    { key: "phone", title: "Phone" },
    { key: "owed_amount", title: "Owed" },
    { key: "credit_limit_amount", title: "Credit Limit" },
    { key: "wallet_balance", title: "Wallet" },
  ],
  supplier_payable: [
    { key: "name", title: "Supplier" },
    { key: "phone", title: "Phone" },
    { key: "payable_amount", title: "Payable" },
  ],
  stock_ledger: [
    { key: "product__name", title: "Product" },
    { key: "entry_type", title: "Entry" },
    { key: "quantity", title: "Qty" },
    { key: "unit_cost", title: "Cost" },
    { key: "balance_after", title: "Balance" },
  ],
  customer_credit: [
    { key: "customer__name", title: "Customer" },
    { key: "amount", title: "Amount" },
    { key: "direction", title: "Direction" },
    { key: "balance_after", title: "Balance" },
    { key: "reason", title: "Reason" },
  ],
  accounting: [
    { key: "transaction__name", title: "Transaction" },
    { key: "account__name", title: "Account" },
    { key: "action_type", title: "Action" },
    { key: "amount", title: "Amount" },
    { key: "balance_after", title: "Balance" },
    { key: "source_type", title: "Source" },
  ],
}

export const isReportKey = (value: string): value is ReportKey =>
  reportTabs.includes(value as ReportKey)
