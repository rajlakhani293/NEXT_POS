export type CartItem = {
  line_id: string
  product_id: string
  unit_quantity_id?: string
  unit_id?: string
  unit_label?: string
  mode?: string
  product_type?: string
  rate?: number
  name: string
  qty: number
  price: number
  available_stock: number
  sku?: string
  discount_type?: "flat" | "percentage"
  discount_value?: number
}

export type POSCategory = {
  id: number
  name: string
  preview_url?: string
}

export type POSUnitQuantity = {
  id: number
  unit_id: number
  unit?: {
    id?: number
    name?: string
    identifier?: string
  }
  unit_name?: string
  unit_short_name?: string
  unit_identifier?: string
  sale_price: number
  sale_price_gross?: number
  sale_price_net?: number
  quantity: number
  visible?: boolean
}

export type POSProduct = {
  id: number
  name: string
  sku?: string
  pinned?: boolean
  stock_management?: string
  type?: string
  accurate_tracking?: boolean | number
  unit_id?: number
  unit_name?: string
  galleries?: { id: number; url: string; featured: boolean }[]
  unit_quantities?: POSUnitQuantity[]
}

export type PendingCartProduct = {
  product: POSProduct | any
  unitQuantity?: POSUnitQuantity | any
}

export type POSGridData = {
  categories: POSCategory[]
  products: POSProduct[]
  pinnedProducts: POSProduct[]
  currentCategory?: POSCategory | null
  previousCategory?: POSCategory | null
}

export type PaymentRow = {
  id: string
  existing_payment_id?: number | string
  payment_type: string
  amount: string
  reference_number: string
  note: string
}
