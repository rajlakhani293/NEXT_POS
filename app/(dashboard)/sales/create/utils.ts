import { CartItem, POSProduct, POSUnitQuantity, PaymentRow } from "./types"

export const money = (value: string | number | null | undefined): number =>
  Number(value || 0) || 0

export const parseCouponCodes = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

export const emptyPaymentRow = (): PaymentRow => ({
  id: typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).substring(2),
  payment_type: "",
  amount: "",
  reference_number: "",
  note: "",
})

export const getCartItemDiscount = (item: CartItem): number => {
  const type = item.discount_type || "flat"
  const val = item.discount_value || 0
  if (type === "percentage") {
    return ((item.qty * item.price) * val) / 100
  }
  return val
}

export const shortcutKeyAliases: Record<string, string> = {
  " ": "space",
  esc: "escape",
  escape: "escape",
  control: "ctrl",
  ctrl: "ctrl",
  option: "alt",
  alt: "alt",
  return: "enter",
}

export const normalizeShortcutPart = (value: unknown): string => {
  const key = String(value || "").trim().toLowerCase()
  return shortcutKeyAliases[key] || key
}

export const normalizeShortcut = (shortcut: unknown): string[] => {
  if (!Array.isArray(shortcut)) return []
  return shortcut.map(normalizeShortcutPart).filter(Boolean)
}

export const eventShortcutParts = (event: KeyboardEvent): string[] => {
  const parts: string[] = []
  if (event.ctrlKey || event.metaKey) parts.push("ctrl")
  if (event.shiftKey) parts.push("shift")
  if (event.altKey) parts.push("alt")
  const key = normalizeShortcutPart(event.key)
  if (!["ctrl", "shift", "alt", "meta"].includes(key)) parts.push(key)
  return Array.from(new Set(parts)).sort()
}

export const shortcutMatches = (event: KeyboardEvent, shortcut: unknown): boolean => {
  const expected = normalizeShortcut(shortcut).sort()
  if (expected.length === 0) return false
  const actual = eventShortcutParts(event)
  return expected.length === actual.length && expected.every((key, index) => key === actual[index])
}

export const shouldIgnorePosShortcut = (event: KeyboardEvent): boolean => {
  const target = event.target as HTMLElement | null
  if (!target) return false
  const tagName = target.tagName.toLowerCase()
  return Boolean(
    target.isContentEditable ||
    ["input", "textarea", "select"].includes(tagName) ||
    target.closest("[role='dialog']")
  )
}

export const getFeaturedImage = (product: POSProduct): string => {
  const galleries = product.galleries || []
  return (galleries.find((gallery) => gallery.featured) || galleries[0])?.url || ""
}

export const getDisplayPrice = (posOptions: any, unitQuantity?: POSUnitQuantity): number => {
  if (!unitQuantity) return 0
  if (posOptions.pos_vat === "disabled") return Number(unitQuantity.sale_price || 0)
  if (posOptions.pos_preferred_price === "gross_prices") {
    return Number(unitQuantity.sale_price_gross ?? unitQuantity.sale_price ?? 0)
  }
  return Number(unitQuantity.sale_price_net ?? unitQuantity.sale_price ?? 0)
}

export const getUnitQuantityLabel = (t: (key: string) => string, unitQuantity?: POSUnitQuantity | any): string =>
  unitQuantity?.unit_name ||
  unitQuantity?.unit_short_name ||
  unitQuantity?.unit_identifier ||
  unitQuantity?.name ||
  unitQuantity?.identifier ||
  unitQuantity?.unit?.name ||
  unitQuantity?.unit?.identifier ||
  (unitQuantity?.id ? `${t("Unit")} ${unitQuantity.id}` : "")

export const parseProductUnitsPayload = (payload: unknown): any[] => {
  if (!payload) return []
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload)
      return parseProductUnitsPayload(parsed)
    } catch {
      return []
    }
  }
  if (Array.isArray(payload)) return payload
  if (typeof payload === "object") {
    const objectPayload = payload as Record<string, any>
    if (Array.isArray(objectPayload.selling_group)) return objectPayload.selling_group
    if (Array.isArray(objectPayload.unit_quantities)) return objectPayload.unit_quantities
    if (Array.isArray(objectPayload.units)) return objectPayload.units
  }
  return []
}

export const normalizeUnitQuantity = (unitQuantity?: any): POSUnitQuantity | undefined => {
  if (!unitQuantity) return undefined
  const unit = unitQuantity.unit || {}
  const id = Number(unitQuantity.id || unitQuantity.unit_quantity_id || 0)
  const unitId = Number(unitQuantity.unit_id || unit.id || 0)
  if (!id && !unitId) return undefined
  return {
    ...unitQuantity,
    id: id || unitId,
    unit_id: unitId || id,
    unit,
    unit_name: unitQuantity.unit_name || unitQuantity.unit__name || unitQuantity.name || unit.name,
    unit_short_name: unitQuantity.unit_short_name || unitQuantity.short_name,
    unit_identifier:
      unitQuantity.unit_identifier ||
      unitQuantity.unit__identifier ||
      unitQuantity.identifier ||
      unit.identifier,
    sale_price: Number(
      unitQuantity.sale_price ??
      unitQuantity.sale_price_edit ??
      unitQuantity.selling_price ??
      unitQuantity.price ??
      0
    ),
    sale_price_gross:
      unitQuantity.sale_price_gross ??
      unitQuantity.sale_price ??
      unitQuantity.sale_price_edit ??
      unitQuantity.selling_price,
    sale_price_net:
      unitQuantity.sale_price_net ??
      unitQuantity.sale_price ??
      unitQuantity.sale_price_edit ??
      unitQuantity.selling_price,
    quantity: Number(unitQuantity.quantity ?? unitQuantity.current_stock ?? unitQuantity.stock ?? 0),
    visible: unitQuantity.visible ?? true,
  }
}

export const getProductUnitQuantities = (product?: POSProduct | any): POSUnitQuantity[] => {
  if (!product) return []
  const rawUnits =
    product.unit_quantities ??
    product.unitQuantities ??
    product.selling_units ??
    product.selling_group ??
    product.units_json ??
    product.units ??
    []
  return parseProductUnitsPayload(rawUnits)
    .map((unitQuantity) => normalizeUnitQuantity(unitQuantity))
    .filter((unitQuantity): unitQuantity is POSUnitQuantity => Boolean(unitQuantity))
}

export const normalizeProductForCart = (product: POSProduct | any) => {
  return {
    ...product,
    unit_quantities: getProductUnitQuantities(product),
  }
}
