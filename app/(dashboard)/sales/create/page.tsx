"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BanknoteArrowDown,
  Ban,
  ChevronRight,
  CreditCard,
  Folder,
  Home,
  ImageIcon,
  MessageSquare,
  Package,
  Pause,
  Percent,
  Settings,
  ShoppingCart,
  Tags,
  Trash2,
  User,
  WalletCards,
  Search,
} from "lucide-react"

import { useConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import SalesModals from "./SalesModals"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { catalog } from "@/lib/api/catalog"
import { customers } from "@/lib/api/customers"
import { payments } from "@/lib/api/payments"
import { promotions } from "@/lib/api/promotions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessMoney } from "@/lib/format"
import { usePosOptions } from "@/lib/options"
import { PERMISSIONS } from "@/lib/permissions"
import { registers } from "@/lib/api/registers"
import { rewards } from "@/lib/api/rewards"
import { sales } from "@/lib/api/sales"
import { showToast } from "@/lib/toast"

type CartItem = {
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


type POSCategory = {
  id: number
  name: string
  preview_url?: string
}

type POSUnitQuantity = {
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

type PendingCartProduct = {
  product: POSProduct | any
  unitQuantity?: POSUnitQuantity | any
}

type POSProduct = {
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

type POSGridData = {
  categories: POSCategory[]
  products: POSProduct[]
  pinnedProducts: POSProduct[]
  currentCategory?: POSCategory | null
  previousCategory?: POSCategory | null
}

type PaymentRow = {
  id: string
  existing_payment_id?: number | string
  payment_type: string
  amount: string
  reference_number: string
  note: string
}

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

const parseCouponCodes = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const emptyPaymentRow = (): PaymentRow => ({
  id: crypto.randomUUID(),
  payment_type: "cash-payment",
  amount: "",
  reference_number: "",
  note: "",
})

const getCartItemDiscount = (item: CartItem) => {
  const type = item.discount_type || "flat"
  const val = item.discount_value || 0
  if (type === "percentage") {
    return ((item.qty * item.price) * val) / 100
  }
  return val
}

const shortcutKeyAliases: Record<string, string> = {
  " ": "space",
  esc: "escape",
  escape: "escape",
  control: "ctrl",
  ctrl: "ctrl",
  option: "alt",
  alt: "alt",
  return: "enter",
}

const normalizeShortcutPart = (value: unknown) => {
  const key = String(value || "").trim().toLowerCase()
  return shortcutKeyAliases[key] || key
}

const normalizeShortcut = (shortcut: unknown) => {
  if (!Array.isArray(shortcut)) return []
  return shortcut.map(normalizeShortcutPart).filter(Boolean)
}

const eventShortcutParts = (event: KeyboardEvent) => {
  const parts = []
  if (event.ctrlKey || event.metaKey) parts.push("ctrl")
  if (event.shiftKey) parts.push("shift")
  if (event.altKey) parts.push("alt")
  const key = normalizeShortcutPart(event.key)
  if (!["ctrl", "shift", "alt", "meta"].includes(key)) parts.push(key)
  return Array.from(new Set(parts)).sort()
}

const shortcutMatches = (event: KeyboardEvent, shortcut: unknown) => {
  const expected = normalizeShortcut(shortcut).sort()
  if (expected.length === 0) return false
  const actual = eventShortcutParts(event)
  return expected.length === actual.length && expected.every((key, index) => key === actual[index])
}

const shouldIgnorePosShortcut = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return false
  const tagName = target.tagName.toLowerCase()
  return Boolean(
    target.isContentEditable ||
    ["input", "textarea", "select"].includes(tagName) ||
    target.closest("[role='dialog']")
  )
}


export default function SalesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { confirm, confirmDialog } = useConfirmDialog()
  const loadedRef = useRef(false)
  const loadedShiftRef = useRef("")
  const loadedRewardCustomerRef = useRef("")
  const posOptions = usePosOptions()
  const cashRegistersEnabled = posOptions.enable_cash_registers
  const ordersAllowUnpaid = posOptions.orders_allow_unpaid
  const ordersAllowPartial = posOptions.orders_allow_partial
  const allowDecimalQuantities = posOptions.allow_decimal_quantities
  const showQuantity = posOptions.show_quantity
  const hideEmptyCategories = posOptions.hide_empty_categories
  const hideExhaustedProducts = posOptions.hide_exhausted_products
  const pinnedProductsEnabled = posOptions.enable_pinned_products
  const pinnedPreviewEnabled = posOptions.show_preview_pinned_products
  const [itemsMergeEnabled, setItemsMergeEnabled] = useState(Boolean(posOptions.items_merge))
  const [forceAutoFocus, setForceAutoFocus] = useState(Boolean(posOptions.force_autofocus))
  const formatMoney = useCallback(
    (value: number | string | null | undefined) => formatBusinessMoney(value, posOptions),
    [posOptions]
  )
  const playPosAudio = useCallback((audioUrl?: string) => {
    if (!audioUrl || typeof window === "undefined") return
    const audio = new Audio(audioUrl)
    audio.play().catch(() => undefined)
  }, [])
  const { hasPermission } = usePermissions()

  const [shift, setShift] = useState<any>(null)
  const [isOpenShiftDialogOpen, setIsOpenShiftDialogOpen] = useState(false)
  const [isRegisterOptionsOpen, setIsRegisterOptionsOpen] = useState(false)
  const [isRegisterHistoryOpen, setIsRegisterHistoryOpen] = useState(false)
  const [registerHistory, setRegisterHistory] = useState<any>(null)
  const [shiftAction, setShiftAction] = useState<
    "cash_in" | "cash_out" | "close" | null
  >(null)
  const [selectedRegisterId, setSelectedRegisterId] = useState("")
  const [openingCash, setOpeningCash] = useState("")
  const [openingNote, setOpeningNote] = useState("")
  const [movementAmount, setMovementAmount] = useState("")
  const [movementNote, setMovementNote] = useState("")
  const [declaredCash, setDeclaredCash] = useState("")
  const [closingNote, setClosingNote] = useState("")

  const [customerId, setCustomerId] = useState("")
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "customer" | "order_type" | "shipping" | "payment">("idle")
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [draftId, setDraftId] = useState("")
  const [activeSaleId, setActiveSaleId] = useState("")
  const [barcode, setBarcode] = useState("")
  const [couponInput, setCouponInput] = useState("")
  const [selectedCouponId, setSelectedCouponId] = useState("")
  const [loadedCoupon, setLoadedCoupon] = useState<any | null>(null)
  const [orderTitle, setOrderTitle] = useState("")
  const [orderType, setOrderType] = useState("")
  const [isShippingBillingOpen, setIsShippingBillingOpen] = useState(false)
  const [shippingBillingTab, setShippingBillingTab] = useState<"general" | "shipping" | "billing">("general")
  const [shippingInfo, setShippingInfo] = useState({
    shipping: "",
    shipping_type: "flat",
    use_customer_shipping: false,
    use_customer_billing: false,
    shipping_first_name: "",
    shipping_last_name: "",
    shipping_phone: "",
    shipping_address_1: "",
    shipping_address_2: "",
    shipping_country: "",
    shipping_city: "",
    shipping_pobox: "",
    shipping_company: "",
    shipping_email: "",
    billing_first_name: "",
    billing_last_name: "",
    billing_phone: "",
    billing_address_1: "",
    billing_address_2: "",
    billing_country: "",
    billing_city: "",
    billing_pobox: "",
    billing_company: "",
    billing_email: "",
  })
  const [saleNote, setSaleNote] = useState("")
  const [cartTaxGroupId, setCartTaxGroupId] = useState("")
  const [cartTaxType, setCartTaxType] = useState("exclusive")

  // POS Grid state
  const [gridData, setGridData] = useState<POSGridData>({
    categories: [],
    products: [],
    pinnedProducts: [],
    currentCategory: null,
    previousCategory: null,
  })
  const [gridLoading, setGridLoading] = useState(false)
  const [gridBreadcrumbs, setGridBreadcrumbs] = useState<POSCategory[]>([])
  const [unitPickerProduct, setUnitPickerProduct] = useState<POSProduct | null>(null)
  const [unitPickerMode, setUnitPickerMode] = useState<"quantity" | "direct">("quantity")
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false)
  const [pendingCartProduct, setPendingCartProduct] = useState<PendingCartProduct | null>(null)
  const [quantityInput, setQuantityInput] = useState("1")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartQuantityDrafts, setCartQuantityDrafts] = useState<Record<string, string>>({})
  const [invalidQuantityLineId, setInvalidQuantityLineId] = useState<string | null>(null)
  const [activePriceItem, setActivePriceItem] = useState<CartItem | null>(null)
  const [priceInput, setPriceInput] = useState("")
  const [paymentsRows, setPaymentsRows] = useState<PaymentRow[]>([
    emptyPaymentRow(),
  ])
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [activePaymentType, setActivePaymentType] = useState("cash-payment")
  const [paymentAmountInput, setPaymentAmountInput] = useState("")
  const [isHeldCartDialogOpen, setIsHeldCartDialogOpen] = useState(false)
  const [isOrderTypeOpen, setIsOrderTypeOpen] = useState(false)
  const [pendingOrdersTab, setPendingOrdersTab] = useState<"hold" | "unpaid" | "partially_paid">("hold")
  const [pendingOrderSearch, setPendingOrderSearch] = useState("")
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [previewPendingOrder, setPreviewPendingOrder] = useState<any | null>(null)
  const [isHoldReferenceDialogOpen, setIsHoldReferenceDialogOpen] = useState(false)
  const [holdReference, setHoldReference] = useState("")
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isCouponsDialogOpen, setIsCouponsDialogOpen] = useState(false)
  const [isOrderSettingsOpen, setIsOrderSettingsOpen] = useState(false)
  const [isTaxesDialogOpen, setIsTaxesDialogOpen] = useState(false)
  const [isCartDiscountDialogOpen, setIsCartDiscountDialogOpen] = useState(false)
  const [isLayawayDialogOpen, setIsLayawayDialogOpen] = useState(false)
  const [layawayCount, setLayawayCount] = useState("0")
  const [layawayLines, setLayawayLines] = useState<{ date: string; amount: string }[]>([])
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const [productSearchResults, setProductSearchResults] = useState<POSProduct[]>([])
  const [activeDiscountItem, setActiveDiscountItem] = useState<CartItem | null>(null)
  const [itemDiscountVal, setItemDiscountVal] = useState("")
  const [itemDiscountType, setItemDiscountType] = useState<"flat" | "percentage">("flat")
  const [cartDiscountVal, setCartDiscountVal] = useState("")
  const [cartDiscountType, setCartDiscountType] = useState<"flat" | "percentage">("flat")


  const [getCurrentShift, { isLoading: isCheckingShift }] = (
    registers as any
  ).useGetCurrentShiftMutation()
  const [openShift, { isLoading: isOpeningShift }] = (
    registers as any
  ).useOpenShiftMutation()
  const [closeShift, { isLoading: isClosingShift }] = (
    registers as any
  ).useCloseShiftMutation()
  const [cashIn, { isLoading: isCashingIn }] = (
    registers as any
  ).useCashInMutation()
  const [cashOut, { isLoading: isCashingOut }] = (
    registers as any
  ).useCashOutMutation()
  const [getRegisterSessionHistory, registerHistoryState] = (
    registers as any
  ).useGetRegisterSessionHistoryMutation()
  const [
    getRegistersDropdown,
    { data: registersDropdownData, isLoading: isRegistersLoading },
  ] = (registers as any).useGetRegistersDropdownMutation()
  const [getCustomersDropdown, { data: customersData, isLoading: isCustomersLoading }] =
    (customers as any).useGetCustomersDropdownMutation()
  const [getCustomerDetailsById] = (customers as any).useGetCustomerByIdMutation()
  const [loadCustomerCouponForPos, loadCustomerCouponState] = (
    customers as any
  ).useLoadCustomerCouponForPosMutation()
  const [getPaymentTypesDropdown, { data: paymentTypesData, isLoading: isPaymentTypesLoading }] =
    (payments as any).useGetPaymentTypesDropdownMutation()
  const [getCouponsDropdown, { data: couponsData, isLoading: isCouponsLoading }] =
    (promotions as any).useGetCouponsDropdownMutation()
  const [getPOSGrid] = (catalog as any).useGetPOSGridMutation()
  const [getPOSGridByCategory] = (catalog as any).useGetPOSGridByCategoryMutation()
  const [getTaxGroupsDropdown, { data: taxGroupsData }] = (catalog as any).useGetTaxGroupsDropdownMutation()
  const [getProductsData, productSearchState] = (catalog as any).useGetProductsDataMutation()
  const [getProductById] = (catalog as any).useGetProductByIdMutation()
  const [getProductUnitQuantitiesData] = (catalog as any).useGetProductUnitQuantitiesMutation()
  const [getCustomerRewardBalance, rewardBalanceState] = (
    rewards as any
  ).useGetCustomerRewardBalanceMutation()
  const [redeemCustomerReward, redeemRewardState] = (
    rewards as any
  ).useRedeemCustomerRewardMutation()
  const [createSale, { isLoading: isCreatingSale }] = (
    sales as any
  ).useCreateSaleMutation()
  const [editSale] = (sales as any).useEditSaleMutation()
  const [getSalesData] = (sales as any).useGetSalesDataMutation()
  const [getSaleById] = (sales as any).useGetSaleByIdMutation()
  const [voidSale] = (sales as any).useVoidSaleMutation()
  const [holdSale, { isLoading: isHoldingSale }] = (
    sales as any
  ).useHoldSaleMutation()
  const [getHeldSalesData, heldSalesState] = (
    sales as any
  ).useGetHeldSalesDataMutation()
  const [getHeldSaleById] = (sales as any).useGetHeldSaleByIdMutation()
  const [deleteHeldSale] = (sales as any).useDeleteHeldSaleMutation()

  const customerOptions = customersData?.data || []
  const paymentTypeOptions = paymentTypesData?.data || []
  const couponOptions = couponsData?.data || []
  const registerOptions = registersDropdownData?.data || []
  const taxGroupOptions = taxGroupsData?.data || []
  const selectedCustomer = useMemo(() => {
    const dropdownCustomer = customerOptions.find((customer: any) => String(customer.id) === String(customerId))
    if (!selectedCustomerDetails || String(selectedCustomerDetails.id) !== String(customerId)) {
      return dropdownCustomer
    }
    return {
      ...dropdownCustomer,
      ...selectedCustomerDetails,
      group: selectedCustomerDetails.group || dropdownCustomer?.group,
      group_name: selectedCustomerDetails.group_name || dropdownCustomer?.group_name,
      billing: selectedCustomerDetails.billing || dropdownCustomer?.billing,
      shipping: selectedCustomerDetails.shipping || dropdownCustomer?.shipping,
      addresses: selectedCustomerDetails.addresses || dropdownCustomer?.addresses,
    }
  }, [customerOptions, customerId, selectedCustomerDetails])
  const selectedTaxGroup = useMemo(
    () => taxGroupOptions.find((taxGroup: any) => String(taxGroup.id) === String(cartTaxGroupId)),
    [taxGroupOptions, cartTaxGroupId]
  )
  const rewardBalances = rewardBalanceState.data?.data || []
  const redeemableReward = rewardBalances.find(
    (balance: any) =>
      Number(balance.points || 0) >= Number(balance.target_points || 0) &&
      Number(balance.target_points || 0) > 0
  )
  const heldSales = heldSalesState.data?.data?.items || []
  const categoriesForGrid = hideEmptyCategories
    ? gridData.categories.filter((category: POSCategory & { products_count?: number; products?: unknown[]; children_count?: number }) => {
      if (category.products_count === undefined && category.children_count === undefined && category.products === undefined) return true
      return Boolean(category.products_count || category.children_count || category.products?.length)
    })
    : gridData.categories
  const productsForGrid = hideExhaustedProducts
    ? gridData.products.filter((product) => {
      const quantities = getProductUnitQuantities(product)
      if (!quantities.length) return true
      return quantities.some((quantity) => Number(quantity.quantity || 0) > 0)
    })
    : gridData.products
  const pinnedProductsForGrid = pinnedProductsEnabled
    ? (
      hideExhaustedProducts
        ? gridData.pinnedProducts.filter((product) => {
          const quantities = getProductUnitQuantities(product)
          if (!quantities.length) return true
          return quantities.some((quantity) => Number(quantity.quantity || 0) > 0)
        })
        : gridData.pinnedProducts
    )
    : []

  const getFeaturedImage = (product: POSProduct) => {
    const galleries = product.galleries || []
    return (galleries.find((gallery) => gallery.featured) || galleries[0])?.url || ""
  }

  const getDisplayPrice = (unitQuantity?: POSUnitQuantity) => {
    if (!unitQuantity) return 0
    if (posOptions.pos_vat === "disabled") return Number(unitQuantity.sale_price || 0)
    if (posOptions.preferred_price === "gross_prices") {
      return Number(unitQuantity.sale_price_gross ?? unitQuantity.sale_price ?? 0)
    }
    return Number(unitQuantity.sale_price_net ?? unitQuantity.sale_price ?? 0)
  }
  const getUnitQuantityLabel = (unitQuantity?: POSUnitQuantity | any) =>
    unitQuantity?.unit_name ||
    unitQuantity?.unit_short_name ||
    unitQuantity?.unit_identifier ||
    unitQuantity?.name ||
    unitQuantity?.identifier ||
    unitQuantity?.unit?.name ||
    unitQuantity?.unit?.identifier ||
    (unitQuantity?.id ? `${t("Unit")} ${unitQuantity.id}` : "")

  function parseProductUnitsPayload(payload: unknown): any[] {
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

  function normalizeUnitQuantity(unitQuantity?: any): POSUnitQuantity | undefined {
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

  function getProductUnitQuantities(product?: POSProduct | any): POSUnitQuantity[] {
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

  function normalizeProductForCart(product: POSProduct | any) {
    return {
      ...product,
      unit_quantities: getProductUnitQuantities(product),
    }
  }

  const getProductWithSellingUnits = async (product: POSProduct | any) => {
    const detailResponse = await getProductById({ id: product.id }).unwrap()
    let fullProduct = normalizeProductForCart(detailResponse?.data || product)
    if (!fullProduct.unit_quantities.length) {
      const unitsResponse = await getProductUnitQuantitiesData({ productId: product.id }).unwrap()
      fullProduct = normalizeProductForCart({
        ...fullProduct,
        unit_quantities: unitsResponse?.data || [],
      })
    }
    return fullProduct
  }

  const itemsSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + (item.qty * item.price - getCartItemDiscount(item)),
        0
      ),
    [cartItems]
  )
  const cartDiscount = useMemo(() => {
    const value = Math.max(Number(cartDiscountVal || 0), 0)
    if (cartDiscountType === "percentage") {
      return (itemsSubtotal * value) / 100
    }
    return Math.min(value, itemsSubtotal)
  }, [cartDiscountType, cartDiscountVal, itemsSubtotal])
  const taxableSubtotal = Math.max(itemsSubtotal - cartDiscount, 0)
  const orderTaxBreakdown = useMemo(() => {
    if (String(posOptions.pos_vat) === "disabled" || !selectedTaxGroup?.taxes?.length) return []
    return selectedTaxGroup.taxes
      .filter((tax: any) => Number(tax.rate || 0) > 0)
      .map((tax: any) => ({
        ...tax,
        tax_value: (taxableSubtotal * Number(tax.rate || 0)) / 100,
      }))
  }, [posOptions.pos_vat, selectedTaxGroup, taxableSubtotal])
  const orderTaxAmount = useMemo(
    () => orderTaxBreakdown.reduce((sum: number, tax: any) => sum + Number(tax.tax_value || 0), 0),
    [orderTaxBreakdown]
  )
  const subtotal = taxableSubtotal + (cartTaxType === "exclusive" ? orderTaxAmount : 0)
  const enabledOrderTypes = useMemo(() => {
    const configured = posOptions.order_types.length ? posOptions.order_types : ["takeaway", "delivery"]
    return [
      { value: "takeaway", label: t("Take Away") },
      { value: "delivery", label: t("Delivery") },
    ].filter((item) => configured.includes(item.value))
  }, [posOptions.order_types, t])
  const activeOrderType = enabledOrderTypes.length === 1
    ? enabledOrderTypes[0]?.value || ""
    : enabledOrderTypes.some((type) => type.value === orderType)
      ? orderType
      : ""

  const couponCodes = useMemo(() => parseCouponCodes(couponInput), [couponInput])
  const totalPaid = useMemo(
    () =>
      paymentsRows.reduce((sum, row) => sum + money(row.amount), 0),
    [paymentsRows]
  )
  const dueAmount = Math.max(subtotal - totalPaid, 0)
  const changeAmount = Math.max(totalPaid - subtotal, 0)
  const estimatedPaymentStatus =
    totalPaid >= subtotal && subtotal > 0
      ? "paid"
      : totalPaid > 0
        ? "partially_paid"
        : "unpaid"
  const hasUnsavedSaleChanges =
    cartItems.length > 0 ||
    Boolean(saleNote.trim()) ||
    paymentsRows.some((row) => money(row.amount) > 0) ||
    money(cartDiscountVal) > 0 ||
    Boolean(couponInput.trim())
  const activePaymentLabel = useMemo(() => {
    const payment = paymentTypeOptions.find(
      (item: any) => (item.value || item.identifier) === activePaymentType
    )
    return payment?.label || activePaymentType || t("Payment")
  }, [activePaymentType, paymentTypeOptions, t])
  const paymentAmountShortcuts = useMemo(
    () =>
      String(posOptions.pos_amount_shortcut || "")
        .split("|")
        .map((amount) => Number(amount.trim()))
        .filter((amount) => Number.isFinite(amount) && amount > 0),
    [posOptions.pos_amount_shortcut]
  )
  const registerHistoryEntries = registerHistory?.history || []
  const registerHistorySummary = registerHistory?.summary || []
  const registerTotalIn = registerHistoryEntries
    .filter((history: any) =>
      ["register-opening", "register-order-payment", "register-cash-in"].includes(history.action || history.entry_type)
    )
    .reduce((total: number, history: any) => total + money(history.value), 0)
  const registerTotalOut = registerHistoryEntries
    .filter((history: any) =>
      ["register-order-change", "register-closing", "register-close", "register-refund", "register-cash-out"].includes(history.action || history.entry_type)
    )
    .reduce((total: number, history: any) => total + money(history.value), 0)

  const loadShift = async () => {
    if (!cashRegistersEnabled) {
      setShift(null)
      setIsOpenShiftDialogOpen(false)
      return
    }

    const response = await getCurrentShift().unwrap()
    const activeShift = response?.data || null
    setShift(activeShift)
    setIsOpenShiftDialogOpen(!activeShift)
  }

  const loadGrid = useCallback(async (category?: POSCategory | null) => {
    setGridLoading(true)
    try {
      const res = category?.id
        ? await getPOSGridByCategory({ parentId: category.id }).unwrap()
        : await getPOSGrid().unwrap()
      const data: POSGridData = res?.data || { categories: [], products: [], pinnedProducts: [] }
      setGridData(data)
    } catch {
      // silently ignore
    } finally {
      setGridLoading(false)
    }
  }, [getPOSGrid, getPOSGridByCategory])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    getCustomersDropdown()
    getPaymentTypesDropdown()
    getCouponsDropdown()
    getTaxGroupsDropdown()
    loadGrid()
  }, [
    getCouponsDropdown,
    getCurrentShift,
    getCustomersDropdown,
    getPaymentTypesDropdown,
    getTaxGroupsDropdown,
    loadGrid,
  ])

  useEffect(() => {
    setItemsMergeEnabled(Boolean(posOptions.items_merge))
    setForceAutoFocus(Boolean(posOptions.force_autofocus))
  }, [posOptions.force_autofocus, posOptions.items_merge])

  useEffect(() => {
    if (!customerId) {
      setSelectedCustomerDetails(null)
      return
    }
    let isCurrent = true
    getCustomerDetailsById({ id: Number(customerId) })
      .unwrap()
      .then((response: any) => {
        if (isCurrent) {
          setSelectedCustomerDetails(response?.data || null)
        }
      })
      .catch(() => {
        if (isCurrent) {
          setSelectedCustomerDetails(null)
        }
      })
    return () => {
      isCurrent = false
    }
  }, [customerId, getCustomerDetailsById])

  useEffect(() => {
    setCartTaxGroupId(posOptions.pos_tax_group ? String(posOptions.pos_tax_group) : "")
    setCartTaxType(posOptions.pos_tax_type ? String(posOptions.pos_tax_type) : "exclusive")
  }, [posOptions.pos_tax_group, posOptions.pos_tax_type])

  useEffect(() => {
    if (!forceAutoFocus) return
    const focusTimer = window.setInterval(() => {
      if (document.querySelector('[role="dialog"]')) return
      barcodeInputRef.current?.focus()
    }, 500)
    return () => window.clearInterval(focusTimer)
  }, [forceAutoFocus])

  useEffect(() => {
    if (cashRegistersEnabled === undefined) return
    const shiftKey = String(cashRegistersEnabled)
    if (loadedShiftRef.current === shiftKey) return
    loadedShiftRef.current = shiftKey
    if (cashRegistersEnabled) {
      getRegistersDropdown()
    }
    loadShift()
  }, [cashRegistersEnabled])

  useEffect(() => {
    if (!selectedCouponId) return
    const selectedCoupon = couponOptions.find(
      (coupon: any) => String(coupon.id) === selectedCouponId
    )
    if (!selectedCoupon?.code) return

    setCouponInput((current) => {
      const existing = parseCouponCodes(current)
      if (existing.includes(selectedCoupon.code)) return current
      return [...existing, selectedCoupon.code].join(", ")
    })
    setSelectedCouponId("")
  }, [couponOptions, selectedCouponId])

  useEffect(() => {
    if (activePaymentType || !paymentTypeOptions.length) return
    const firstPayment = paymentTypeOptions[0]
    setActivePaymentType(firstPayment.value || firstPayment.identifier || "cash-payment")
  }, [activePaymentType, paymentTypeOptions])

  const drillIntoCategory = useCallback((category: POSCategory) => {
    setGridBreadcrumbs((prev) => [...prev, category])
    loadGrid(category)
  }, [loadGrid])

  const navigateBreadcrumb = useCallback((index: number) => {
    // index -1 = root
    const newBreadcrumbs = index < 0 ? [] : gridBreadcrumbs.slice(0, index + 1)
    setGridBreadcrumbs(newBreadcrumbs)
    const targetCategory = newBreadcrumbs.length > 0 ? newBreadcrumbs[newBreadcrumbs.length - 1] : null
    loadGrid(targetCategory)
  }, [gridBreadcrumbs, loadGrid])

  useEffect(() => {
    if (!customerId) {
      loadedRewardCustomerRef.current = ""
      return
    }
    if (loadedRewardCustomerRef.current === customerId) return
    loadedRewardCustomerRef.current = customerId
    getCustomerRewardBalance({ id: customerId })
  }, [customerId, getCustomerRewardBalance])

  const handleOpenShift = async () => {
    if (!selectedRegisterId) {
      showToast.error(t("Please select a cash register."))
      return
    }

    const response = await openShift({
      register_id: Number(selectedRegisterId),
      opening_cash: openingCash || "0",
      note: openingNote || "",
    }).unwrap()
    setShift(response?.data || null)
    setSelectedRegisterId("")
    setOpeningCash("")
    setOpeningNote("")
    setIsOpenShiftDialogOpen(false)
    showToast.success(response?.message || t("Shift opened successfully."))
  }

  const handleCloseShift = async () => {
    const response = await closeShift({
      shift_id: shift?.id,
      declared_cash: declaredCash || shift?.expected_cash || "0",
      note: closingNote || "",
    }).unwrap()
    setShift(null)
    setDeclaredCash("")
    setClosingNote("")
    setShiftAction(null)
    setIsRegisterOptionsOpen(false)
    setCartItems([])
    setCartQuantityDrafts({})
    setInvalidQuantityLineId(null)
    setCouponInput("")
    setSaleNote("")
    setIsOpenShiftDialogOpen(true)
    showToast.success(response?.message || "Shift closed successfully.")
  }

  const handleCashMovement = async () => {
    if (!movementAmount || Number(movementAmount) <= 0) {
      showToast.error(t("Amount must be greater than 0."))
      return
    }

    const mutation = shiftAction === "cash_out" ? cashOut : cashIn
    const response = await mutation({
      shift_id: shift?.id,
      amount: movementAmount,
      note: movementNote || "",
    }).unwrap()

    setMovementAmount("")
    setMovementNote("")
    setShiftAction(null)
    setIsRegisterOptionsOpen(false)
    await loadShift()
    showToast.success(response?.message || t("Cash movement recorded."))
  }

  const openRegisterHistory = async () => {
    if (!shift?.id) {
      showToast.error(t("The register is not yet loaded."))
      return
    }
    const response = await getRegisterSessionHistory({ id: shift.id }).unwrap()
    setRegisterHistory(response?.data || null)
    setIsRegisterHistoryOpen(true)
  }

  const getCartStockUsage = (productId: number | string, unitQuantityId?: number | string) =>
    cartItems.reduce((total, item) => {
      if (
        item.product_id === String(productId) &&
        (item.unit_quantity_id || "") === (unitQuantityId ? String(unitQuantityId) : "")
      ) {
        return total + Number(item.qty || 0)
      }
      return total
    }, 0)

  const validateProductQuantity = (
    product: POSProduct | any,
    unitQuantity: POSUnitQuantity | any,
    quantity: number
  ) => {
    if (!quantity || quantity <= 0) {
      showToast.error(t("Please provide a quantity"))
      return false
    }
    if (!allowDecimalQuantities && !Number.isInteger(quantity)) {
      showToast.error(t("Decimal quantities are not allowed."))
      return false
    }

    const stockManaged =
      product.stock_management !== "disabled" && product.type !== "dematerialized"
    if (!stockManaged || !unitQuantity?.id) return true

    const holdQuantity = getCartStockUsage(product.id, unitQuantity.id)
    const remaining = Number(unitQuantity.quantity || 0) - holdQuantity
    if (quantity > remaining) {
      showToast.error(
        t("Unable to add the product, there is not enough stock. Remaining %s").replace(
          "%s",
          String(Math.max(remaining, 0))
        )
      )
      return false
    }
    return true
  }

  const addProductToCart = (product: POSProduct | any, unitQuantity?: POSUnitQuantity | any, initialQty = 1) => {
    if (!product) return false
    const normalizedProduct = normalizeProductForCart(product)
    const selectedUnitQuantity = normalizeUnitQuantity(unitQuantity) || normalizedProduct.unit_quantities[0]
    const stockManaged =
      normalizedProduct.stock_management !== "disabled" && normalizedProduct.type !== "dematerialized"

    if (stockManaged && !selectedUnitQuantity?.id) {
      showToast.error(t("Select a selling unit before adding this product."))
      return false
    }
    const price = getDisplayPrice(selectedUnitQuantity)
    const availableStock = Number(selectedUnitQuantity?.quantity || 0)
    const unitQuantityId = selectedUnitQuantity?.id ? String(selectedUnitQuantity.id) : ""
    const unitLabel =
      getUnitQuantityLabel(selectedUnitQuantity) ||
      normalizedProduct.unit_name ||
      ""
    const existingCartItem = cartItems.find(
      (item) =>
        item.product_id === String(normalizedProduct.id) &&
        (item.unit_quantity_id || "") === unitQuantityId
    )
    const requestedQuantity = existingCartItem && itemsMergeEnabled
      ? existingCartItem.qty + initialQty
      : initialQty

    if (!validateProductQuantity(normalizedProduct, selectedUnitQuantity, requestedQuantity)) return false

    setCartItems((items) => {
      const existing = items.find(
        (item) =>
          item.product_id === String(normalizedProduct.id) &&
          (item.unit_quantity_id || "") === unitQuantityId
      )
      if (existing && itemsMergeEnabled) {
        return items.map((item) =>
          item.product_id === String(normalizedProduct.id) &&
            (item.unit_quantity_id || "") === unitQuantityId
            ? { ...item, qty: item.qty + initialQty }
            : item
        )
      }

      return [
        ...items,
        {
          line_id: crypto.randomUUID(),
          product_id: String(normalizedProduct.id),
          unit_quantity_id: unitQuantityId || undefined,
          unit_id: selectedUnitQuantity?.unit_id
            ? String(selectedUnitQuantity.unit_id)
            : normalizedProduct.unit_id
              ? String(normalizedProduct.unit_id)
              : undefined,
          unit_label: unitLabel,
          mode: normalizedProduct.mode || "normal",
          product_type: normalizedProduct.product_type || "product",
          rate: Number(normalizedProduct.rate || 0),
          name: normalizedProduct.name,
          qty: initialQty,
          price,
          available_stock: availableStock,
          sku: normalizedProduct.sku,
        },
      ]
    })
    playPosAudio(posOptions.pos_new_item_audio)
    return true
  }

  const handleGridProductClick = (product: POSProduct) => {
    const normalizedProduct = normalizeProductForCart(product)
    const unitQuantities = normalizedProduct.unit_quantities
    if (unitQuantities.length === 0) {
      openQuantityDialog(normalizedProduct, undefined)
      return
    }
    if (unitQuantities.length === 1) {
      openQuantityDialog(normalizedProduct, unitQuantities[0])
      return
    }
    // Multiple units — open picker
    setUnitPickerMode("quantity")
    setUnitPickerProduct(normalizedProduct)
    setIsUnitPickerOpen(true)
  }

  const handleUnitPickerSelect = (unitQuantity: POSUnitQuantity | any) => {
    if (!unitPickerProduct) return
    const product = normalizeProductForCart(unitPickerProduct)
    const selectedUnitQuantity = normalizeUnitQuantity(unitQuantity)
    setIsUnitPickerOpen(false)
    setUnitPickerProduct(null)
    if (unitPickerMode === "direct") {
      const added = addProductToCart(product, selectedUnitQuantity, 1)
      if (added) {
        setBarcode("")
        setProductSearchResults([])
        setIsSearchDropdownOpen(false)
        showToast.success(t("{product} added to cart.").replace("{product}", product.name))
      }
      setUnitPickerMode("quantity")
      return
    }
    setUnitPickerMode("quantity")
    openQuantityDialog(product, selectedUnitQuantity)
  }

  const openQuantityDialog = (product: POSProduct | any, unitQuantity?: POSUnitQuantity | any, initialQty = 1) => {
    if (!showQuantity) {
      const added = addProductToCart(product, unitQuantity, initialQty)
      if (added) showToast.success(t("{product} added to cart.").replace("{product}", product.name))
      return
    }
    setPendingCartProduct({ product, unitQuantity })
    setQuantityInput(String(initialQty || product.quantity || 1))
  }

  const handleConfirmQuantity = () => {
    if (!pendingCartProduct) return
    const quantity = Number(quantityInput || 0)
    const added = addProductToCart(
      pendingCartProduct.product,
      pendingCartProduct.unitQuantity,
      quantity
    )
    if (!added) return
    showToast.success(t("{product} added to cart.").replace("{product}", pendingCartProduct.product.name))
    setPendingCartProduct(null)
    setQuantityInput("1")
  }

  const handleProductSearch = async (query = barcode) => {
    const search = query.trim()
    if (!search) return
    const response = await getProductsData({
      page: 1,
      limit: 20,
      search,
    }).unwrap()
    const products = response?.data?.items || response?.data || []
    setProductSearchResults(products)
    setIsSearchDropdownOpen(true)
  }

  const handleProductSearchPick = async (product: POSProduct | any) => {
    if (Number(product.accurate_tracking || 0) === 1) {
      showToast.error(
        t("The product \"{product}\" can't be added from a search field, as \"Accurate Tracking\" is enabled. Would you like to learn more ?")
          .replace("{product}", product.name)
      )
      return
    }
    const fullProduct = await getProductWithSellingUnits(product)
    const unitQuantities = fullProduct.unit_quantities
    if (unitQuantities.length > 1) {
      setUnitPickerMode("direct")
      setUnitPickerProduct(fullProduct)
      setIsUnitPickerOpen(true)
      setIsSearchDropdownOpen(false)
      return
    }
    const matchedUnitQuantity = normalizeUnitQuantity(fullProduct.matched_unit_quantity) || unitQuantities[0]
    const added = addProductToCart(fullProduct, matchedUnitQuantity, 1)
    if (!added) return
    setBarcode("")
    setProductSearchResults([])
    setIsSearchDropdownOpen(false)
    showToast.success(t("{product} added to cart.").replace("{product}", fullProduct.name))
  }

  useEffect(() => {
    const search = barcode.trim()
    if (!search) {
      setProductSearchResults([])
      setIsSearchDropdownOpen(false)
      return
    }
    const searchTimer = window.setTimeout(() => {
      handleProductSearch(search)
    }, 500)
    return () => window.clearTimeout(searchTimer)
  }, [barcode])

  const updateQuantity = (lineId: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.line_id === lineId
          ? { ...item, qty: Math.max(item.qty + delta, 0) }
          : item
      )
    )
    setCartQuantityDrafts((current) => {
      const next = { ...current }
      delete next[lineId]
      return next
    })
    setInvalidQuantityLineId((current) => (current === lineId ? null : current))
  }

  const removeItem = (lineId: string) => {
    setCartItems((items) => items.filter((item) => item.line_id !== lineId))
    setCartQuantityDrafts((current) => {
      const next = { ...current }
      delete next[lineId]
      return next
    })
    setInvalidQuantityLineId((current) => (current === lineId ? null : current))
  }

  const updateItemQuantityInput = (lineId: string, rawValue: string) => {
    setCartQuantityDrafts((current) => ({ ...current, [lineId]: rawValue }))
    if (rawValue.trim() === "") {
      setInvalidQuantityLineId(lineId)
      return
    }
    const nextQuantity = Number(rawValue)
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      setInvalidQuantityLineId(lineId)
      return
    }
    if (!allowDecimalQuantities && !Number.isInteger(nextQuantity)) {
      setInvalidQuantityLineId(lineId)
      return
    }
    setInvalidQuantityLineId((current) => (current === lineId ? null : current))
    setCartItems((prev) =>
      prev.map((item) =>
        item.line_id === lineId ? { ...item, qty: nextQuantity } : item
      )
    )
  }

  const validateCartQuantities = () => {
    const invalidItem = cartItems.find((item) => {
      const draft = cartQuantityDrafts[item.line_id]
      const draftQuantity = Number(draft)
      return draft !== undefined
        ? draft.trim() === "" || !Number.isFinite(draftQuantity) || draftQuantity <= 0
        || (!allowDecimalQuantities && !Number.isInteger(draftQuantity))
        : !Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0
        || (!allowDecimalQuantities && !Number.isInteger(Number(item.qty)))
    })
    if (!invalidItem) return true
    setInvalidQuantityLineId(invalidItem.line_id)
    showToast.error(t("Please provide a valid quantity."))
    return false
  }

  const openItemPriceDialog = (item: CartItem) => {
    if (!posOptions.unit_price_editable) return
    setActivePriceItem(item)
    setPriceInput(String(item.price))
  }

  const handleApplyItemPrice = () => {
    if (!activePriceItem) return
    const nextPrice = Number(priceInput)
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      showToast.error(t("Please provide a valid price."))
      return
    }
    setCartItems((prev) =>
      prev.map((cartItem) =>
        cartItem.line_id === activePriceItem.line_id
          ? { ...cartItem, price: nextPrice, mode: "custom" }
          : cartItem
      )
    )
    setActivePriceItem(null)
    setPriceInput("")
  }

  const openItemDiscountDialog = (item: CartItem) => {
    if (!posOptions.products_discount) {
      showToast.error(t("You're not allowed to add a discount on the product."))
      return
    }
    setActiveDiscountItem(item)
    setItemDiscountVal(String(item.discount_value || ""))
    setItemDiscountType(item.discount_type || "flat")
  }

  const handleApplyItemDiscount = () => {
    if (!activeDiscountItem) return
    const value = Math.max(Number(itemDiscountVal || 0), 0)
    if (itemDiscountType === "percentage" && value > 100) {
      showToast.error(t("Percentage cannot be greater than 100."))
      return
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (
          item.product_id === activeDiscountItem.product_id &&
          (item.unit_quantity_id || "") === (activeDiscountItem.unit_quantity_id || "") &&
          item.line_id === activeDiscountItem.line_id
        ) {
          return {
            ...item,
            discount_type: itemDiscountType,
            discount_value: value,
          }
        }
        return item
      })
    )
    setActiveDiscountItem(null)
  }

  const openCartDiscountDialog = () => {
    if (!posOptions.cart_discount) {
      showToast.error(t("You're not allowed to add a discount on the cart."))
      return
    }
    setIsCartDiscountDialogOpen(true)
  }

  const handleApplyCartDiscount = () => {
    const value = Math.max(Number(cartDiscountVal || 0), 0)
    if (cartDiscountType === "percentage" && value > 100) {
      showToast.error(t("Percentage cannot be greater than 100."))
      return
    }
    setCartDiscountVal(String(value))
    setIsCartDiscountDialogOpen(false)
    showToast.success(t("The discount has been set to the cart subtotal."))
  }

  const openOrderSettingsDialog = () => {
    if (!posOptions.edit_settings) {
      showToast.error(t("You're not allowed to edit the order settings."))
      return
    }
    setIsOrderSettingsOpen(true)
  }

  const handleVoidCart = async () => {
    if (activeSaleId) {
      const proceed = await confirm({
        title: t("Confirm Your Action"),
        description: t("The current order will be void. This action will be recorded. Consider providing a reason for this operation"),
        confirmLabel: t("Confirm"),
        cancelLabel: t("Cancel"),
        variant: "destructive",
      })
      if (!proceed) return
      const response = await voidSale({ id: activeSaleId, payLoad: { reason: saleNote || "Void from POS" } }).unwrap()
      resetSaleForm()
      showToast.success(response?.message || t("The order has been correctly voided."))
      return
    }

    if (!draftId) {
      showToast.error(t("Unable to void an unpaid order."))
      return
    }

    const proceed = await confirm({
      title: t("Order Deletion"),
      description: t("Would you like to delete this order?"),
      confirmLabel: t("Delete"),
      cancelLabel: t("Cancel"),
      variant: "destructive",
    })
    if (!proceed) return

    const response = await deleteHeldSale({ id: draftId }).unwrap()
    resetSaleForm()
    await refreshPendingOrders("hold", pendingOrderSearch)
    showToast.success(response?.message || t("Held cart deleted successfully."))
  }

  const resetSaleForm = () => {

    setDraftId("")
    setActiveSaleId("")
    setCustomerId("")
    setSelectedCustomerDetails(null)
    setBarcode("")
    setCouponInput("")
    setSelectedCouponId("")
    setLoadedCoupon(null)
    setOrderTitle("")
    setOrderType("")
    setCheckoutStep("idle")
    setShippingInfo({
      shipping: "",
      shipping_type: "flat",
      use_customer_shipping: false,
      use_customer_billing: false,
      shipping_first_name: "",
      shipping_last_name: "",
      shipping_phone: "",
      shipping_address_1: "",
      shipping_address_2: "",
      shipping_country: "",
      shipping_city: "",
      shipping_pobox: "",
      shipping_company: "",
      shipping_email: "",
      billing_first_name: "",
      billing_last_name: "",
      billing_phone: "",
      billing_address_1: "",
      billing_address_2: "",
      billing_country: "",
      billing_city: "",
      billing_pobox: "",
      billing_company: "",
      billing_email: "",
    })
    setCartTaxGroupId(posOptions.pos_tax_group ? String(posOptions.pos_tax_group) : "")
    setCartTaxType(posOptions.pos_tax_type ? String(posOptions.pos_tax_type) : "exclusive")
    setSaleNote("")
    setCartDiscountVal("")
    setCartDiscountType("flat")
    setCartItems([])
    setCartQuantityDrafts({})
    setInvalidQuantityLineId(null)
    setActivePriceItem(null)
    setPriceInput("")
    setPaymentsRows([emptyPaymentRow()])
    setLayawayCount("0")
    setLayawayLines([])
    setIsLayawayDialogOpen(false)
  }

  const refreshPendingOrders = async (
    tab = pendingOrdersTab,
    search = pendingOrderSearch
  ) => {
    if (tab === "hold") {
      const response = await getHeldSalesData({
        page: 1,
        limit: 20,
        search: search || undefined,
      }).unwrap()
      setPendingOrders(response?.data?.items || [])
      return
    }

    const response = await getSalesData({
      page: 1,
      limit: 20,
      search: search || undefined,
      filter: { payment_status: tab },
    }).unwrap()
    setPendingOrders(response?.data?.items || [])
  }

  const handleOpenHeldSales = async () => {
    setPendingOrdersTab("hold")
    setPendingOrderSearch("")
    await refreshPendingOrders("hold", "")
    setIsHeldCartDialogOpen(true)
  }

  const handlePendingTabChange = async (tab: "hold" | "unpaid" | "partially_paid") => {
    setPendingOrdersTab(tab)
    setPendingOrderSearch("")
    await refreshPendingOrders(tab, "")
  }

  const handleSearchPendingOrders = async () => {
    await refreshPendingOrders(pendingOrdersTab, pendingOrderSearch)
  }

  const handleResumeHeldSale = async (heldSaleId: number | string) => {
    if (cartItems.length) {
      const proceed = await confirm({
        title: t("Confirm"),
        description: t("The cart is not empty. Opening an order will clear your cart would you proceed ?"),
      })
      if (!proceed) return
    }
    const response = await getHeldSaleById({ id: heldSaleId }).unwrap()
    const heldSale = response?.data
    if (!heldSale) return

    setDraftId(String(heldSale.id))
    setActiveSaleId("")
    setOrderTitle(heldSale.title || "")
    setCustomerId(heldSale.customer_id ? String(heldSale.customer_id) : "")
    setCouponInput((heldSale.coupon_codes || []).join(", "))
    setCartTaxGroupId(heldSale.tax_group_id ? String(heldSale.tax_group_id) : "")
    setCartTaxType(heldSale.tax_type || posOptions.pos_tax_type || "exclusive")
    setSaleNote(heldSale.note_text || "")
    setPaymentsRows(
      (heldSale.payments || []).length
        ? (heldSale.payments || []).map((payment: any) => ({
          id: crypto.randomUUID(),
          payment_type: payment.payment_type || "cash-payment",
          amount: String(payment.amount || ""),
          reference_number: payment.reference_number || "",
          note: payment.note || "",
        }))
        : [emptyPaymentRow()]
    )
    setCartItems(
      (heldSale.items || []).map((item: any) => ({
        product_id: String(item.product_id),
        line_id: crypto.randomUUID(),
        unit_quantity_id: item.unit_quantity_id ? String(item.unit_quantity_id) : undefined,
        unit_id: item.unit_id ? String(item.unit_id) : undefined,
        unit_label: item.unit_name || item.unit__name || "",
        mode: item.mode || "normal",
        product_type: item.product_type || "product",
        rate: Number(item.rate || 0),
        name: item.product_name || item.name,
        qty: Number(item.quantity || 0),
        price: Number(item.unit_price || 0),
        available_stock: 0,
        sku: item.sku,
      }))
    )
    setIsHeldCartDialogOpen(false)
    showToast.success(t("Held cart loaded successfully."))
  }

  const loadSaleIntoPos = (sale: any) => {
    setDraftId("")
    setActiveSaleId(String(sale.id))
    setOrderTitle(sale.title || "")
    setCustomerId(sale.customer_id ? String(sale.customer_id) : "")
    setOrderType(sale.order_type || "")
    setCouponInput((sale.applied_coupons || []).map((coupon: any) => coupon.code).filter(Boolean).join(", "))
    setCartTaxGroupId(sale.tax_group_id ? String(sale.tax_group_id) : "")
    setCartTaxType(sale.tax_type || posOptions.pos_tax_type || "exclusive")
    setSaleNote(sale.note || "")
    setPaymentsRows(
      (sale.payments || []).length
        ? (sale.payments || []).map((payment: any) => ({
          id: crypto.randomUUID(),
          existing_payment_id: payment.id,
          payment_type: payment.identifier || payment.payment_type || "cash-payment",
          amount: String(payment.value || payment.amount || ""),
          reference_number: payment.reference_number || "",
          note: payment.note || "",
        }))
        : [emptyPaymentRow()]
    )
    setCartItems(
      (sale.items || []).map((item: any) => ({
        product_id: String(item.product_id),
        line_id: crypto.randomUUID(),
        unit_quantity_id: item.unit_quantity_id ? String(item.unit_quantity_id) : undefined,
        unit_id: item.unit_id ? String(item.unit_id) : undefined,
        unit_label: item.unit__name || item.unit_name || "",
        mode: item.mode || "normal",
        product_type: item.product_type || "product",
        rate: Number(item.rate || 0),
        name: item.product__name || item.product_name || item.name,
        qty: Number(item.quantity || 0),
        price: Number(item.unit_price || 0),
        available_stock: 0,
        sku: item.product__sku || item.sku,
        discount_type: Number(item.discount_amount || 0) > 0 ? "flat" : undefined,
        discount_value: Number(item.discount_amount || 0) || undefined,
      }))
    )
    const savedAddresses = sale.addresses || {}
    const orderAddressValue = (type: "billing" | "shipping", field: string) => {
      const address = savedAddresses[type] || {}
      if (field === "company") return address.company || address.company_name || ""
      return address[field] || ""
    }
    setShippingInfo((current) => ({
      ...current,
      shipping: String(sale.shipping || ""),
      shipping_type: sale.shipping_type || current.shipping_type || "flat",
      ...Object.fromEntries(
        (["billing", "shipping"] as const).flatMap((type) =>
          [
            "first_name",
            "last_name",
            "phone",
            "address_1",
            "address_2",
            "country",
            "city",
            "pobox",
            "company",
            "email",
          ].map((field) => [`${type}_${field}`, orderAddressValue(type, field)])
        )
      ),
    }))
    setIsHeldCartDialogOpen(false)
    showToast.success(t("Order loaded successfully."))
  }

  const handleOpenPendingOrder = async (order: any) => {
    if (pendingOrdersTab === "hold") {
      await handleResumeHeldSale(order.id)
      return
    }
    if (cartItems.length) {
      const proceed = await confirm({
        title: t("Confirm"),
        description: t("The cart is not empty. Opening an order will clear your cart would you proceed ?"),
      })
      if (!proceed) return
    }
    const response = await getSaleById({ id: order.id }).unwrap()
    loadSaleIntoPos(response?.data || order)
  }

  const handlePreviewPendingOrder = async (order: any) => {
    const response =
      pendingOrdersTab === "hold"
        ? await getHeldSaleById({ id: order.id }).unwrap()
        : await getSaleById({ id: order.id }).unwrap()
    setPreviewPendingOrder(response?.data || order)
  }

  const handlePrintPendingOrder = (order: any) => {
    setIsHeldCartDialogOpen(false)
    router.push(getPrintedDocumentUrl(order.id))
  }

  const handleRedeemReward = async () => {
    if (!customerId) {
      showToast.error(t("Choose customer before redeeming reward."))
      return
    }
    if (!redeemableReward) {
      showToast.error(t("No redeemable reward balance for this customer."))
      return
    }
    const response = await redeemCustomerReward({
      customer_id: Number(customerId),
      reward_system_id: Number(redeemableReward.reward_system_id),
      points: Number(redeemableReward.target_points),
      note: t("Redeemed from POS checkout."),
    }).unwrap()
    const couponCode = response?.data?.issued_coupon?.code
    if (couponCode) {
      setCouponInput((current) => {
        const existing = parseCouponCodes(current)
        if (existing.includes(couponCode)) return current
        return [...existing, couponCode].join(", ")
      })
      showToast.success(t("Reward redeemed. Coupon {coupon} added.").replace("{coupon}", couponCode))
    } else {
      showToast.success(response?.message || t("Reward redeemed successfully."))
    }
    await getCustomerRewardBalance({ id: customerId })
  }

  const handleLoadCouponForPos = async () => {
    const code = couponInput.trim()
    if (!customerId) {
      showToast.error(t("You must select a customer before applying a coupon."))
      setIsCustomerSelectOpen(true)
      return
    }
    if (!code) {
      showToast.error(t("Coupon Code is required."))
      return
    }
    const response = await loadCustomerCouponForPos({
      code,
      payLoad: { customer_id: Number(customerId) },
    }).unwrap()
    setLoadedCoupon(response?.data || null)
    showToast.success(response?.message || t("The coupon has been loaded."))
  }

  const handleApplyLoadedCoupon = () => {
    const code = String(loadedCoupon?.code || couponInput || "").trim()
    if (!code) {
      showToast.error(t("Coupon Code is required."))
      return
    }
    setCouponInput((current) => {
      const existing = parseCouponCodes(current)
      if (existing.includes(code)) return current
      return [...existing, code].join(", ")
    })
    setSelectedCouponId(loadedCoupon?.id ? String(loadedCoupon.id) : "")
    setLoadedCoupon(null)
    showToast.success(t("The coupon has applied to the cart."))
  }

  const handleRemoveCouponCode = (code?: string) => {
    if (!code) {
      setCouponInput("")
      setSelectedCouponId("")
      setLoadedCoupon(null)
      return
    }
    setCouponInput((current) => parseCouponCodes(current).filter((item) => item !== code).join(", "))
    if (String(loadedCoupon?.code || "") === code) setLoadedCoupon(null)
  }

  const handleHoldSale = async () => {
    if (!cartItems.length) {
      showToast.error(t("Add at least one product before holding cart."))
      return
    }
    if (!validateCartQuantities()) return
    if (paymentsRows.some((row) => money(row.amount) > 0)) {
      showToast.error(t("Unable to hold an order which payment status has been updated already."))
      return
    }

    const payLoad = {
      title: orderTitle,
      customer_id: customerId ? Number(customerId) : null,
      coupon_codes: couponCodes,
      note: [holdReference ? `${t("Order Reference")}: ${holdReference}` : "", saleNote]
        .filter(Boolean)
        .join("\n"),
      tax_group_id: cartTaxGroupId ? Number(cartTaxGroupId) : null,
      tax_type: cartTaxType || null,
      discount_amount: cartDiscountType === "flat" ? String(money(cartDiscountVal)) : "0",
      discount_percentage: cartDiscountType === "percentage" ? String(money(cartDiscountVal)) : "0",
      items: cartItems.map((item) => ({
        product_id: Number(item.product_id),
        name: item.name,
        unit_name: item.unit_label || "",
        mode: item.mode || "normal",
        product_type: item.product_type || "product",
        rate: String(item.rate || 0),
        unit_quantity_id: item.unit_quantity_id
          ? Number(item.unit_quantity_id)
          : null,
        unit_id: item.unit_id ? Number(item.unit_id) : null,
        quantity: String(item.qty),
        unit_price: String(item.price),
        discount_amount: String(getCartItemDiscount(item)),
        tax_amount: "0",
      })),

      payments: paymentsRows
        .filter((row) => money(row.amount) > 0)
        .map((row) => ({
          payment_type: row.payment_type,
          amount: String(money(row.amount)),
          reference_number: row.reference_number,
          note: row.note,
        })),
    }

    const response = await holdSale(payLoad).unwrap()
    showToast.success(response?.message || "Held cart saved successfully.")
    resetSaleForm()
    setHoldReference("")
    setIsHoldReferenceDialogOpen(false)
    await refreshPendingOrders("hold", pendingOrderSearch)
  }

  const shouldOpenReceipt = (paymentStatus: string) => {
    if (posOptions.printing_enabled_for === "disabled") return false
    if (posOptions.printing_enabled_for === "all_orders") return true
    if (
      posOptions.printing_enabled_for === "partially_paid_orders" &&
      ["paid", "partially_paid"].includes(paymentStatus)
    ) {
      return true
    }
    return posOptions.printing_enabled_for === "only_paid_orders" && paymentStatus === "paid"
  }

  const getPrintedDocumentUrl = (saleId: number | string) => {
    const documentType = posOptions.printing_document === "invoice" ? "invoice" : "receipt"
    const queryString = documentType === "invoice" ? "?doc=invoice" : ""
    return `/sales/${saleId}/receipt${queryString}`
  }

  const handleCompleteSale = async (
    submitOptions: {
      paymentStatus?: string
      layaway?: any
      omitPayments?: boolean
      additionalPayments?: Array<{
        payment_type: string
        amount: string
        reference_number?: string
        note?: string
      }>
    } = {}
  ) => {
    if (cashRegistersEnabled && !shift?.id) {
      showToast.error(t("Open shift is required before billing."))
      return
    }
    if (!cartItems.length) {
      showToast.error(t("Add at least one product to cart."))
      return
    }
    if (!validateCartQuantities()) return
    if (!customerId) {
      setCheckoutStep("customer")
      setIsCustomerSelectOpen(true)
      return
    }
    if (!activeOrderType) {
      setCheckoutStep("order_type")
      setIsOrderTypeOpen(true)
      return
    }
    if (activeOrderType === "delivery" && !shippingInfo.shipping_type) {
      setCheckoutStep("shipping")
      setShippingBillingTab("general")
      setIsShippingBillingOpen(true)
      return
    }
    const requestedPaymentStatus = submitOptions.paymentStatus || estimatedPaymentStatus
    if (
      totalPaid < subtotal &&
      requestedPaymentStatus !== "unpaid" &&
      ordersAllowUnpaid === false &&
      ordersAllowPartial === false
    ) {
      showToast.error(`${t("Unpaid or partially paid orders are not allowed.")} ${t("Total paid")} (${formatMoney(totalPaid)}) ${t("is less than subtotal")} (${formatMoney(subtotal)}).`)
      return
    }
    if (requestedPaymentStatus === "unpaid" && !ordersAllowUnpaid) {
      showToast.error(t("Unpaid orders are not allowed."))
      return
    }
    if (requestedPaymentStatus === "partially_paid" && !ordersAllowPartial) {
      showToast.error(t("Partial orders are not allowed."))
      return
    }
    const validPayments = submitOptions.omitPayments ? [] : paymentsRows.filter((row) => money(row.amount) > 0)
    const additionalPayments = submitOptions.additionalPayments || []
    const shippingAddressState = shippingInfo as Record<string, string | boolean>
    const shippingAddressValue = (key: string) => String(shippingAddressState[key] || "")
    const buildOrderAddress = (type: "billing" | "shipping") => ({
      first_name: shippingAddressValue(`${type}_first_name`),
      last_name: shippingAddressValue(`${type}_last_name`),
      phone: shippingAddressValue(`${type}_phone`),
      address_1: shippingAddressValue(`${type}_address_1`),
      address_2: shippingAddressValue(`${type}_address_2`),
      country: shippingAddressValue(`${type}_country`),
      city: shippingAddressValue(`${type}_city`),
      pobox: shippingAddressValue(`${type}_pobox`),
      company: shippingAddressValue(`${type}_company`),
      email: shippingAddressValue(`${type}_email`),
    })
    const payLoad = {
      draft_id: draftId ? Number(draftId) : null,
      title: orderTitle,
      customer_id: customerId ? Number(customerId) : null,
      shift_id: cashRegistersEnabled ? shift.id : null,
      order_type: activeOrderType,
      shipping: activeOrderType === "delivery" ? String(money(shippingInfo.shipping || 0)) : "0",
      shipping_rate: "0",
      shipping_type: activeOrderType === "delivery" ? shippingInfo.shipping_type : "",
      billing: activeOrderType === "delivery" ? buildOrderAddress("billing") : null,
      shipping_address: activeOrderType === "delivery" ? buildOrderAddress("shipping") : null,
      support_instalments: submitOptions.layaway?.support_instalments ?? true,
      total_instalments: submitOptions.layaway?.total_instalments ?? 0,
      final_payment_date: submitOptions.layaway?.final_payment_date ?? null,
      instalments: submitOptions.layaway?.instalments ?? [],
      note: saleNote,
      coupon_codes: couponCodes,
      payment_status: requestedPaymentStatus,
      tax_group_id: cartTaxGroupId ? Number(cartTaxGroupId) : null,
      tax_type: cartTaxType || null,
      discount_amount: cartDiscountType === "flat" ? String(money(cartDiscountVal)) : "0",
      discount_percentage: cartDiscountType === "percentage" ? String(money(cartDiscountVal)) : "0",
      items: cartItems.map((item) => ({
        product_id: Number(item.product_id),
        name: item.name,
        unit_name: item.unit_label || "",
        mode: item.mode || "normal",
        product_type: item.product_type || "product",
        rate: String(item.rate || 0),
        unit_quantity_id: item.unit_quantity_id
          ? Number(item.unit_quantity_id)
          : null,
        unit_id: item.unit_id ? Number(item.unit_id) : null,
        quantity: String(item.qty),
        unit_price: String(item.price),
        discount_amount: String(getCartItemDiscount(item)),
        tax_amount: "0",
      })),

      payments: [
        ...validPayments.map((row) => ({
          id: row.existing_payment_id || undefined,
          payment_type: row.payment_type,
          amount: String(money(row.amount)),
          reference_number: row.reference_number,
          note: row.note || saleNote,
        })),
        ...additionalPayments,
      ],
    }

    const response = activeSaleId
      ? await editSale({ id: activeSaleId, payLoad }).unwrap()
      : await createSale(payLoad).unwrap()
    const sale = response?.data
    showToast.success(response?.message || (activeSaleId ? t("Sale updated successfully.") : t("Sale created successfully.")))
    playPosAudio(posOptions.pos_complete_sale_audio)
    resetSaleForm()
    setIsPaymentDialogOpen(false)
    await loadShift()
    if (sale?.id) {
      const paymentStatus = sale.payment_status || requestedPaymentStatus
      router.push(shouldOpenReceipt(paymentStatus) ? getPrintedDocumentUrl(sale.id) : `/sales/${sale.id}`)
    }
  }

  const minimumLayawayPayment = useMemo(() => {
    const percent = money(selectedCustomer?.group?.minimal_credit_payment || selectedCustomer?.minimal_credit_payment || 0)
    return money((subtotal * percent) / 100)
  }, [selectedCustomer, subtotal])

  const openLayawayDialog = () => {
    setLayawayCount(String(layawayLines.length || 0))
    setIsLayawayDialogOpen(true)
  }

  const prepareInitialLayawayPayment = async (
    instalments: Array<{ date: string; amount: string; paid?: boolean }>
  ) => {
    const today = new Date().toISOString().slice(0, 10)
    const expectedSliceIndex = instalments.findIndex(
      (line) => line.date === today && money(line.amount) >= minimumLayawayPayment
    )
    const expectedSlice = expectedSliceIndex >= 0 ? instalments[expectedSliceIndex] : null
    const additionalPayments: Array<{
      payment_type: string
      amount: string
      reference_number?: string
      note?: string
    }> = []

    if (!expectedSlice || !(money(expectedSlice.amount) > 0)) {
      return { instalments, additionalPayments, addedAmount: 0, cancelled: false }
    }

    const firstPayment = paymentTypeOptions.find(
      (payment: any) => (payment.value || payment.identifier) === activePaymentType
    ) || paymentTypeOptions[0]
    const paymentType = firstPayment?.value || firstPayment?.identifier || activePaymentType
    const paymentLabel = firstPayment?.label || activePaymentLabel || paymentType || t("Payment")

    if (!paymentType) {
      showToast.error(t("Your system doesn't have any valid Payment Type. Consider creating one and try again."))
      return { instalments, additionalPayments, addedAmount: 0, cancelled: true }
    }

    const proceed = await confirm({
      title: t("Initial Payment"),
      description: t('In order to proceed, an initial payment of {amount} is required for the selected payment type "{paymentType}". Would you like to proceed ?')
        .replace("{amount}", formatMoney(money(expectedSlice.amount)))
        .replace("{paymentType}", paymentLabel),
      confirmLabel: t("Proceed"),
      cancelLabel: t("Cancel"),
    })

    if (!proceed) {
      showToast.error(t("The request was canceled"))
      return { instalments, additionalPayments, addedAmount: 0, cancelled: true }
    }

    const amount = money(expectedSlice.amount)
    additionalPayments.push({
      payment_type: String(paymentType),
      amount: String(amount),
      reference_number: "",
      note: saleNote,
    })

    return {
      instalments: instalments.map((line, index) =>
        index === expectedSliceIndex ? { ...line, paid: true } : line
      ),
      additionalPayments,
      addedAmount: amount,
      cancelled: false,
    }
  }

  const handleSkipLayaway = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const instalments = minimumLayawayPayment > 0
      ? [{ date: today, amount: String(minimumLayawayPayment), paid: false }]
      : []
    const initialPayment = await prepareInitialLayawayPayment(instalments)
    if (initialPayment.cancelled) return
    setIsLayawayDialogOpen(false)
    handleCompleteSale({
      paymentStatus: totalPaid + initialPayment.addedAmount > 0 ? "partially_paid" : "unpaid",
      layaway: {
        support_instalments: false,
        total_instalments: initialPayment.instalments.length,
        final_payment_date: today,
        instalments: initialPayment.instalments,
      },
      additionalPayments: initialPayment.additionalPayments,
    })
  }

  const handleSubmitLayaway = async () => {
    if (!layawayLines.length) {
      showToast.error(t("Please provide instalments before proceeding."))
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    const parsed = layawayLines.map((line) => ({
      date: line.date,
      amount: money(line.amount),
    }))
    if (parsed.some((line) => !line.date)) {
      showToast.error(t("One or more instalments has an invalid date."))
      return
    }
    if (parsed.some((line) => !(line.amount > 0))) {
      showToast.error(t("One or more instalments has an invalid amount."))
      return
    }
    if (parsed.some((line) => line.date < today)) {
      showToast.error(t("One or more instalments has a date prior to the current date."))
      return
    }
    const todayPayment = parsed
      .filter((line) => line.date === today)
      .reduce((sum, line) => sum + line.amount, 0)
    if (todayPayment < minimumLayawayPayment) {
      showToast.error(t("The payment to be made today is less than what is expected."))
      return
    }
    const totalInstalments = parsed.reduce((sum, line) => sum + line.amount, 0)
    if (money(totalInstalments) < money(subtotal)) {
      showToast.error(t("Total instalments must be equal to the order total."))
      return
    }
    const sorted = [...parsed].sort((a, b) => a.date.localeCompare(b.date))
    const layawayInstalments = sorted.map((line) => ({
      date: line.date,
      amount: String(line.amount),
      paid: false,
    }))
    const initialPayment = await prepareInitialLayawayPayment(layawayInstalments)
    if (initialPayment.cancelled) return

    setIsLayawayDialogOpen(false)
    await handleCompleteSale({
      paymentStatus: totalPaid + initialPayment.addedAmount > 0
        ? "partially_paid"
        : "unpaid",
      layaway: {
        support_instalments: true,
        total_instalments: sorted.length,
        final_payment_date: sorted[sorted.length - 1]?.date || today,
        instalments: initialPayment.instalments,
      },
      additionalPayments: initialPayment.additionalPayments,
    })
  }

  const handleSaveAsUnpaid = async () => {
    if (!ordersAllowUnpaid) {
      showToast.error(t("Unpaid orders are not allowed."))
      return
    }
    const proceed = await confirm({
      title: t("Save As Unpaid"),
      description: t("Are you sure you want to save this order as unpaid?"),
      confirmLabel: t("Proceed"),
      cancelLabel: t("Cancel"),
    })
    if (!proceed) return

    setPaymentsRows([emptyPaymentRow()])
    setPaymentAmountInput("")
    await handleCompleteSale({
      paymentStatus: "unpaid",
      layaway: {
        support_instalments: false,
        total_instalments: 0,
        final_payment_date: null,
        instalments: [],
      },
      omitPayments: true,
    })
  }

  const isInitialLoading =
    (cashRegistersEnabled && isCheckingShift) ||
    (cashRegistersEnabled && isRegistersLoading) ||
    isCustomersLoading ||
    isPaymentTypesLoading ||
    isCouponsLoading

  const updatePaymentRow = (
    rowId: string,
    field: keyof Omit<PaymentRow, "id">,
    value: string
  ) => {
    setPaymentsRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addPaymentRow = () => {
    setPaymentsRows((current) => [...current, emptyPaymentRow()])
  }

  const addPaymentFromPopup = (amount: number) => {
    if (!amount || amount <= 0) {
      showToast.error(t("Please provide a valid payment amount."))
      return
    }
    setPaymentsRows((current) => {
      const emptyIndex = current.findIndex((row) => !row.amount || money(row.amount) === 0)
      if (emptyIndex >= 0) {
        return current.map((row, index) =>
          index === emptyIndex
            ? { ...row, payment_type: activePaymentType, amount: amount.toFixed(2) }
            : row
        )
      }
      return [
        ...current,
        {
          ...emptyPaymentRow(),
          payment_type: activePaymentType,
          amount: amount.toFixed(2),
        },
      ]
    })
    setPaymentAmountInput("")
  }

  const resetPaymentModalState = () => {
    setPaymentAmountInput("")
    const firstPayment = paymentTypeOptions[0]
    if (firstPayment) {
      setActivePaymentType(firstPayment.value || firstPayment.identifier || "cash-payment")
    }
  }

  const handlePaymentDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetPaymentModalState()
    }
    setIsPaymentDialogOpen(open)
  }

  const resetLayawayModalState = () => {
    setLayawayCount("0")
    setLayawayLines([])
  }

  const handleLayawayDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetLayawayModalState()
    }
    setIsLayawayDialogOpen(open)
  }

  const makeFullPaymentFromPopup = () => {
    const remaining = Math.max(subtotal - totalPaid, 0)
    if (!remaining) {
      handleCompleteSale()
      return
    }
    addPaymentFromPopup(remaining)
  }

  const confirmFullPaymentFromPopup = async () => {
    const proceed = await confirm({
      title: t("Confirm Full Payment"),
      description: t("A full payment will be made using {paymentType} for {total}")
        .replace("{paymentType}", activePaymentLabel)
        .replace("{total}", formatMoney(subtotal)),
    })
    if (!proceed) return
    makeFullPaymentFromPopup()
  }

  const customerAddressValue = (type: "shipping" | "billing", field: string) => {
    const nested = selectedCustomer?.[type]?.[field] ?? selectedCustomer?.addresses?.[type]?.[field]
    const prefixed = selectedCustomer?.[`${type}_${field}`]
    if (field === "company") {
      return nested || prefixed || selectedCustomer?.[type]?.company_name || selectedCustomer?.addresses?.[type]?.company_name || selectedCustomer?.[`${type}_company_name`] || ""
    }
    return nested || prefixed || ""
  }

  const hasCustomerAddress = (type: "shipping" | "billing") =>
    Boolean(
      customerAddressValue(type, "address_1") ||
      customerAddressValue(type, "city") ||
      customerAddressValue(type, "country")
    )

  const fillCustomerAddress = (type: "shipping" | "billing") => {
    if (!selectedCustomer) return false
    if (!hasCustomerAddress(type)) {
      showToast.error(
        type === "shipping"
          ? t("Customer shipping address is not available.")
          : t("Customer billing address is not available.")
      )
      return false
    }
    const fields = [
      "first_name",
      "last_name",
      "phone",
      "address_1",
      "address_2",
      "country",
      "city",
      "pobox",
      "company",
      "email",
    ]
    setShippingInfo((current) => ({
      ...current,
      ...Object.fromEntries(
        fields.map((field) => [`${type}_${field}`, customerAddressValue(type, field)])
      ),
    }))
    return true
  }

  const continueCheckout = (nextOrderType = activeOrderType, nextCustomerId = customerId) => {
    if (!cartItems.length) {
      showToast.error(t("Add at least one product to cart."))
      setCheckoutStep("idle")
      return
    }
    if (!nextCustomerId) {
      setCheckoutStep("customer")
      setIsCustomerSelectOpen(true)
      return
    }
    if (!nextOrderType) {
      setCheckoutStep("order_type")
      setIsOrderTypeOpen(true)
      return
    }
    if (nextOrderType === "delivery") {
      setCheckoutStep("shipping")
      setShippingBillingTab("general")
      setIsShippingBillingOpen(true)
      return
    }
    setCheckoutStep("payment")
    setIsPaymentDialogOpen(true)
  }

  const handleCustomerSelectedForCheckout = (selectedId: string) => {
    if (checkoutStep !== "customer") return
    window.setTimeout(() => continueCheckout(activeOrderType, selectedId), 0)
  }

  const handleOrderTypeSelectedForCheckout = (type: string) => {
    if (checkoutStep !== "order_type") return
    window.setTimeout(() => continueCheckout(type), 0)
  }

  const saveShippingBilling = () => {
    if (!shippingInfo.shipping_type.trim()) {
      showToast.error(t("Shipping Type is required."))
      setShippingBillingTab("general")
      return
    }
    if (shippingInfo.use_customer_shipping && !hasCustomerAddress("shipping")) {
      showToast.error(t("Customer shipping address is not available."))
      return
    }
    if (shippingInfo.use_customer_billing && !hasCustomerAddress("billing")) {
      showToast.error(t("Customer billing address is not available."))
      return
    }
    setIsShippingBillingOpen(false)
    setCheckoutStep("payment")
    setIsPaymentDialogOpen(true)
  }

  const handleOpenPaymentDialog = () => {
    if (!cartItems.length) {
      showToast.error(t("Add at least one product to cart."))
      return
    }
    continueCheckout()
    const firstPayment = paymentTypeOptions[0]
    if (!activePaymentType && firstPayment) {
      setActivePaymentType(firstPayment.value || firstPayment.identifier || "cash-payment")
    }
  }

  const handleDashboardNavigation = async () => {
    if (hasUnsavedSaleChanges) {
      const proceed = await confirm({
        title: t("Confirm Your Action"),
        description: t("Changes that you made may not be saved."),
        confirmLabel: t("Leave"),
        cancelLabel: t("Cancel"),
        variant: "destructive",
      })
      if (!proceed) return
    }
    router.push("/dashboard")
  }

  useEffect(() => {
    const hasOpenDialog =
      isUnitPickerOpen ||
      isPaymentDialogOpen ||
      isHeldCartDialogOpen ||
      isHoldReferenceDialogOpen ||
      isRegisterOptionsOpen ||
      isRegisterHistoryOpen ||
      isNoteDialogOpen ||
      isCouponsDialogOpen ||
      isOrderSettingsOpen ||
      isTaxesDialogOpen ||
      isCartDiscountDialogOpen ||
      Boolean(activeDiscountItem) ||
      Boolean(activePriceItem)

    const handleShortcut = (event: KeyboardEvent) => {
      if (hasOpenDialog || shouldIgnorePosShortcut(event)) return

      const run = (shortcut: unknown, action: () => void) => {
        if (!shortcutMatches(event, shortcut)) return false
        event.preventDefault()
        action()
        return true
      }

      if (run(posOptions.pos_keyboard_quick_search, () => barcodeInputRef.current?.focus())) return
      if (run(posOptions.pos_keyboard_cancel_order, handleVoidCart)) return
      if (
        run(posOptions.pos_keyboard_hold_order, () => {
          if (cartItems.length && !isHoldingSale) setIsHoldReferenceDialogOpen(true)
        })
      ) return
      if (run(posOptions.pos_keyboard_payment, handleOpenPaymentDialog)) return
      if (run(posOptions.pos_keyboard_note, () => setIsNoteDialogOpen(true))) return
      if (run(posOptions.pos_keyboard_order_type, openOrderSettingsDialog)) return
      if (run(posOptions.pos_keyboard_create_customer, () => window.open("/customers/create", "_blank"))) return
      if (
        run(posOptions.pos_keyboard_fullscreen, () => {
          if (document.fullscreenElement) {
            void document.exitFullscreen()
          } else {
            void document.documentElement.requestFullscreen()
          }
        })
      ) return
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [
    activeDiscountItem,
    activePriceItem,
    cartItems.length,
    handleOpenPaymentDialog,
    handleVoidCart,
    isCartDiscountDialogOpen,
    isCouponsDialogOpen,
    isHeldCartDialogOpen,
    isHoldReferenceDialogOpen,
    isHoldingSale,
    isNoteDialogOpen,
    isRegisterHistoryOpen,
    isRegisterOptionsOpen,
    isOrderSettingsOpen,
    isPaymentDialogOpen,
    isTaxesDialogOpen,
    isUnitPickerOpen,
    openOrderSettingsDialog,
    posOptions.pos_keyboard_cancel_order,
    posOptions.pos_keyboard_create_customer,
    posOptions.pos_keyboard_fullscreen,
    posOptions.pos_keyboard_hold_order,
    posOptions.pos_keyboard_note,
    posOptions.pos_keyboard_order_type,
    posOptions.pos_keyboard_payment,
    posOptions.pos_keyboard_quick_search,
  ])

  const removePaymentRow = (rowId: string) => {
    setPaymentsRows((current) => {
      const nextRows = current.filter(
        (row) => String(row.id) !== String(rowId) && String(row.existing_payment_id || "") !== String(rowId)
      )
      return nextRows.length ? nextRows : [emptyPaymentRow()]
    })
  }

  if (isInitialLoading && !shift) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          {t("preparing_sales_screen")}
        </div>
      </div>
    )
  }

  return (
    <DashboardPage padding="none">
      <div className="flex h-full min-h-0 flex-col bg-[#f4f6f8]" id="pos-container">

        {!cashRegistersEnabled || shift ? (
          <div className="flex flex-auto overflow-hidden p-2">
            <div className="flex h-full min-h-0 flex-auto flex-col gap-2 overflow-hidden lg:flex-row">

              {/* ======== LEFT: Cart + Checkout ======== */}
              <div className={[
                "order-1 flex min-h-0 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:w-[48%]",
              ].join(" ")}>
                <div className="flex min-h-0 flex-auto flex-col overflow-hidden bg-white">
                  <div className="border-b border-slate-200 bg-white px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleDashboardNavigation} className="h-9 rounded-md">
                        <Home className="size-4" />
                        {t("Dashboard")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleOpenHeldSales} className="h-9 rounded-md">
                        <ShoppingCart className="size-4" />
                        {t("Pending Orders")}
                      </Button>
                      {enabledOrderTypes.length === 1 ? (
                        <Button variant="outline" size="sm" disabled className="h-9 rounded-md pointer-events-none cursor-default opacity-100">
                          {enabledOrderTypes[0].label}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsOrderTypeOpen(true)}
                          className="h-9 rounded-md"
                        >
                          {enabledOrderTypes.find((type) => type.value === activeOrderType)?.label || t("Type")}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={resetSaleForm} className="h-9 rounded-md">
                        {t("Reset")}
                      </Button>
                      {cashRegistersEnabled && shift ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRegisterOptionsOpen(true)}
                          className="h-9 rounded-md"
                        >
                          <BanknoteArrowDown className="size-4" />
                          {t("Cash Register")}
                        </Button>
                      ) : cashRegistersEnabled ? (
                        hasPermission(PERMISSIONS.cashRegister.open) ? (
                          <Button size="sm" onClick={() => setIsOpenShiftDialogOpen(true)}>
                            {t("open_shift")}
                          </Button>
                        ) : null
                      ) : null}
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-slate-50/80 p-2">
                    <ButtonGroup className="grid w-full grid-cols-5 overflow-hidden rounded-md border border-slate-200 bg-white">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsCustomerSelectOpen(true)}
                        className="h-11 min-w-0 justify-center rounded-none border-r border-slate-200 px-2"
                      >
                        <User className="size-4" />
                        <span className="truncate">{selectedCustomer ? selectedCustomer.name : t("Customer")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsNoteDialogOpen(true)}
                        className="h-11 rounded-none border-r border-slate-200 px-2"
                      >
                        <MessageSquare className="size-4" />
                        <span>{t("Comments")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsCouponsDialogOpen(true)}
                        className="h-11 rounded-none border-r border-slate-200 px-2"
                      >
                        <Tags className="size-4" />
                        <span>{t("Coupons")}</span>
                        {couponCodes.length ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs text-white">
                            {couponCodes.length}
                          </span>
                        ) : null}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={openOrderSettingsDialog}
                        className="h-11 rounded-none border-r border-slate-200 px-2"
                      >
                        <Settings className="size-4" />
                        <span>{t("Settings")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsTaxesDialogOpen(true)}
                        className="h-11 rounded-none px-2"
                      >
                        <WalletCards className="size-4" />
                        <span>{t("Taxes")}</span>
                      </Button>
                    </ButtonGroup>
                  </div>
                  {/* Cart items */}
                  <div className="flex-1 overflow-y-auto bg-white">
                    {cartItems.length ? (
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-slate-50">
                          <TableRow className="border-slate-200">
                            <TableHead className="h-10 text-xs font-bold uppercase text-slate-500">{t("Product")}</TableHead>
                            <TableHead className="h-10 w-28 text-center text-xs font-bold uppercase text-slate-500">{t("Quantity")}</TableHead>
                            <TableHead className="h-10 w-28 text-right text-xs font-bold uppercase text-slate-500">{t("Total")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cartItems.map((item) => (
                            <TableRow key={item.line_id} className="border-slate-100 hover:bg-slate-50/80">
                              {/* Product column */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[15px] font-semibold text-slate-950">{item.name}</p>
                                    {item.unit_label ? (
                                      <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{item.unit_label}</p>
                                    ) : null}
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                      <button
                                        type="button"
                                        onClick={() => openItemPriceDialog(item)}
                                        disabled={!posOptions.unit_price_editable}
                                        className="font-medium text-muted-foreground underline-offset-2 hover:text-slate-950 hover:underline disabled:cursor-default disabled:no-underline"
                                      >
                                        {t("Price")} : {formatMoney(item.price)}
                                      </button>
                                      <Button
                                        type="button"
                                        variant="link"
                                        onClick={() => openItemDiscountDialog(item)}
                                        className="h-auto p-0 text-xs font-medium text-muted-foreground"
                                      >
                                        {item.discount_value && item.discount_value > 0 ? (
                                          <span className="text-emerald-700">
                                            {t("Discount")} {item.discount_type === "percentage" ? `${item.discount_value}%` : "0%"} : -{formatMoney(getCartItemDiscount(item))}
                                          </span>
                                        ) : (
                                          <span>{t("Discount")} 0% : {formatMoney(0)}</span>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => removeItem(item.line_id)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </TableCell>

                              {/* Quantity column */}
                              <TableCell>
                                <div className="flex items-end justify-center">
                                  <UniFieldInput
                                    type="number"
                                    step={allowDecimalQuantities ? "0.01" : "1"}
                                    min="0.01"
                                    value={cartQuantityDrafts[item.line_id] ?? String(item.qty)}
                                    error={invalidQuantityLineId === item.line_id ? t("Quantity is required.") : undefined}
                                    containerClassName="bg-transparent w-24"
                                    className="h-8"
                                    onChange={(e) => {
                                      updateItemQuantityInput(item.line_id, e.target.value)
                                    }}
                                  />
                                </div>
                              </TableCell>

                              {/* Total column */}
                              <TableCell className="text-right font-semibold text-slate-950">
                                {formatMoney(item.qty * item.price - getCartItemDiscount(item))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50">
                          <ShoppingCart className="size-7" />
                        </div>
                        <p className="text-sm font-semibold">{t("no_items_in_cart")}</p>
                      </div>
                    )}
                  </div>

                  {/* Bill summary + checkout */}
                  <div className="border-t border-slate-200 bg-slate-50">
                    <div className="bg-white px-4 py-2 text-sm font-semibold">
                      <div className="flex items-center justify-between py-1 text-slate-600">
                        <span>{t("Sub Total")}</span>
                        <span>{formatMoney(itemsSubtotal)}</span>
                      </div>
                      {(couponCodes.length > 0 || selectedCouponId) ? (
                        <div className="flex items-center justify-between py-1 text-slate-600">
                          <span>{t("Coupons")}</span>
                          <Button type="button" variant="link" className="h-auto p-0" onClick={() => setIsCouponsDialogOpen(true)}>
                            {couponCodes.length || 1}
                          </Button>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between py-1 text-slate-600">
                        <span>
                          {t("Discount")}
                          {cartDiscountType === "percentage" ? ` (${cartDiscountVal || 0}%)` : cartDiscount > 0 ? ` (${t("Flat")})` : ""}
                        </span>
                        <Button type="button" variant="link" className="h-auto p-0" onClick={openCartDiscountDialog}>
                          {formatMoney(cartDiscount)}
                        </Button>
                      </div>
                      {posOptions.pos_vat !== "disabled" ? (
                        <div className="flex items-center justify-between py-1 text-slate-600">
                          <span>{selectedTaxGroup?.name || t("Tax")}</span>
                          <Button type="button" variant="link" className="h-auto p-0" onClick={() => setIsTaxesDialogOpen(true)}>
                            {formatMoney(orderTaxAmount)}
                          </Button>
                        </div>
                      ) : null}
                      <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2 text-xl font-bold text-slate-950">
                        <span>{t("Total")}</span>
                        <span>{formatMoney(subtotal)}</span>
                      </div>
                    </div>

                    {customerId ? (
                      <div className="mx-3 mb-3 flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                        <span>
                          {rewardBalanceState.isLoading
                            ? t("loading_reward_balance")
                            : redeemableReward
                              ? `${selectedCustomer?.name || t("Customer")} · ${redeemableReward.points} ${t("points_available")}`
                              : t("no_redeemable_points")}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRedeemReward}
                          disabled={!redeemableReward || redeemRewardState.isLoading}
                          className="bg-white"
                        >
                          {redeemRewardState.isLoading ? <Spinner /> : t("redeem")}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid h-16 shrink-0 grid-cols-4 overflow-hidden border-t border-slate-200 text-sm font-bold">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openCartDiscountDialog}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-none border-r bg-white px-2 py-2 text-slate-700 hover:bg-slate-100 h-auto"
                    >
                      <Percent className="size-5" />
                      {t("Discount")}
                    </Button>
                    <Button
                      type="button"
                      disabled={!cartItems.length || isHoldingSale}
                      onClick={() => setIsHoldReferenceDialogOpen(true)}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-none border-r bg-blue-600 px-2 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 h-auto hover:text-white"
                    >
                      <Pause className="size-5" />
                      {isHoldingSale ? t("Saving") : t("Hold")}
                    </Button>
                    <Button
                      type="button"
                      disabled={!cartItems.length || isCreatingSale}
                      onClick={handleOpenPaymentDialog}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-none border-r bg-emerald-600 px-2 py-2 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 h-auto hover:text-white"
                    >
                      <CreditCard className="size-5" />
                      {isCreatingSale ? t("Completing") : t("Pay")}
                    </Button>
                    <Button
                      type="button"
                      disabled={!cartItems.length}
                      onClick={handleVoidCart}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-none bg-red-600 px-2 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 h-auto hover:text-white"
                    >
                      <Ban className="size-5" />
                      {t("Void")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* ======== RIGHT: Product Grid ======== */}
              <div className={[
                "order-2 flex min-h-0 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:w-[52%]",
              ].join(" ")}>
                <div className="flex min-h-0 flex-auto flex-col overflow-hidden bg-white">
                  {/* Top bar: product tools + customer */}
                  <div className="relative border-b border-slate-200 bg-white p-3">
                    <UniFieldInput
                      ref={barcodeInputRef}
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onFocus={() => {
                        if (productSearchResults.length) setIsSearchDropdownOpen(true)
                      }}
                      prefix={<Search className="size-4" />}
                      prefixPadding="pl-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (productSearchResults.length === 1) {
                            handleProductSearchPick(productSearchResults[0])
                            return
                          }
                          handleProductSearch()
                        }
                        if (e.key === "Escape") {
                          setIsSearchDropdownOpen(false)
                        }
                      }}
                      placeholder={t("Search Product")}
                      containerClassName="bg-transparent"
                      addonAfter={
                        productSearchState.isLoading ? (
                          <div className="flex w-10 items-center justify-center bg-white">
                            <Spinner />
                          </div>
                        ) : undefined
                      }
                    />
                    {isSearchDropdownOpen ? (
                      <div className="absolute left-3 right-3 top-[62px] z-30 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                        {productSearchResults.length ? (
                          productSearchResults.map((product) => {
                            const unitCount = getProductUnitQuantities(product).length
                            return (
                              <button
                                key={product.id}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleProductSearchPick(product)}
                                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold text-slate-950">{product.name}</span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {product.sku || t("Unassigned")}
                                  </span>
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {unitCount > 1 ? t("Units") : t("Add")}
                                </span>
                              </button>
                            )
                          })
                        ) : (
                          <div className="px-3 py-4 text-center text-sm font-semibold text-muted-foreground">
                            {productSearchState.isLoading ? t("Loading") : t("Nothing to display...")}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Breadcrumb navigation */}
                  <div className="flex min-h-11 items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateBreadcrumb(-1)}
                      className="h-8 rounded-md px-2 text-slate-700"
                    >
                      <Home className="size-3.5" />
                      <span>{t("Home")}</span>
                    </Button>
                    {gridBreadcrumbs.map((crumb, i) => (
                      <span key={crumb.id} className="flex items-center gap-1">
                        <ChevronRight className="size-3 text-gray-400" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateBreadcrumb(i)}
                          className="h-8 max-w-48 rounded-md px-2 text-slate-700"
                        >
                          <span className="truncate">{crumb.name}</span>
                        </Button>
                      </span>
                    ))}
                    {gridLoading && <Spinner className="ml-2 size-3.5" />}
                  </div>

                  {/* Pinned products strip */}
                  {pinnedProductsForGrid.length > 0 && (
                    <div className="border-b border-slate-200 bg-amber-50/70 px-3 py-3">
                      <p className="mb-2 text-xs font-bold uppercase text-amber-700">{t("Pinned")}</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {pinnedProductsForGrid.map((product) => {
                          const unitQuantities = getProductUnitQuantities(product)
                          const uq = unitQuantities[0]
                          const featuredImage = getFeaturedImage(product)
                          return (
                            <button
                              key={product.id}
                              onClick={() => handleGridProductClick(product)}
                              className={[
                                "group relative flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",
                                pinnedPreviewEnabled ? "h-32" : "h-20",
                              ].join(" ")}
                            >
                              {pinnedPreviewEnabled && featuredImage ? (
                                <img
                                  src={featuredImage}
                                  alt={product.name}
                                  className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                                />
                              ) : pinnedPreviewEnabled ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                  <ImageIcon className="size-9 text-slate-300" />
                                </div>
                              ) : null}
                              <div className={[
                                "relative z-10 mt-auto w-full p-2",
                                pinnedPreviewEnabled ? "bg-gradient-to-t from-black/75 to-black/0 text-white" : "text-slate-950",
                              ].join(" ")}>
                                <p className="w-full truncate text-sm font-semibold">{product.name}</p>
                                {unitQuantities.length === 1 && uq ? (
                                  <span className={pinnedPreviewEnabled ? "text-sm text-blue-100" : "text-sm text-blue-700"}>
                                    {formatMoney(getDisplayPrice(uq))}
                                  </span>
                                ) : null}
                                {showQuantity && uq ? (
                                  <span className={pinnedPreviewEnabled ? "block text-xs text-white/80" : "block text-xs text-slate-500"}>
                                    {t("Quantity")}: {Number(uq.quantity || 0)}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grid area: categories + products */}
                  <div className="flex-1 overflow-y-auto bg-white p-3">
                    {!gridLoading && categoriesForGrid.length === 0 && productsForGrid.length === 0 && pinnedProductsForGrid.length === 0 && (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50">
                          <Package className="size-8 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">{t("Looks like there is either no products and no categories. How about creating those first to get started ?")}</p>
                      </div>
                    )}

                    {/* Category tiles */}
                    {categoriesForGrid.length > 0 && (
                      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                        {categoriesForGrid.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => drillIntoCategory(category)}
                            className="group relative flex h-32 flex-col overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                          >
                            {category.preview_url ? (
                              <img
                                src={category.preview_url}
                                alt={category.name}
                                className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
                                <Folder className="size-10 text-blue-300 transition group-hover:text-blue-500" />
                              </div>
                            )}
                            <div className="relative z-10 mt-auto w-full bg-gradient-to-t from-black/70 to-black/0 px-2 pb-2 pt-8 text-white">
                              <p className="truncate text-sm font-bold">{category.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Product tiles (shown when no sub-categories) */}
                    {categoriesForGrid.length === 0 && productsForGrid.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                        {productsForGrid.map((product) => {
                          const unitQuantities = getProductUnitQuantities(product)
                          const uq = unitQuantities[0]
                          const featuredImage = getFeaturedImage(product)
                          return (
                            <button
                              key={product.id}
                              onClick={() => handleGridProductClick(product)}
                              className="group relative flex h-36 flex-col overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                            >
                              {featuredImage ? (
                                <img
                                  src={featuredImage}
                                  alt={product.name}
                                  className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                  <ImageIcon className="size-10 text-slate-300 transition group-hover:text-slate-400" />
                                </div>
                              )}
                              <div className="relative z-10 mt-auto w-full bg-gradient-to-t from-black/75 to-black/0 px-2 pb-2 pt-8 text-white">
                                <p className="truncate text-sm font-bold">{product.name}</p>
                                {unitQuantities.length === 1 && uq ? (
                                  <span className="block text-sm font-semibold text-blue-100">{formatMoney(getDisplayPrice(uq))}</span>
                                ) : null}
                                {showQuantity && uq ? (
                                  <span className="block text-xs font-medium text-white/80">
                                    {t("Quantity")}: {Number(uq.quantity || 0)}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : null}

        <SalesModals
          t={t}
          posOptions={posOptions}
          isCustomerSelectOpen={isCustomerSelectOpen}
          setIsCustomerSelectOpen={setIsCustomerSelectOpen}
          customerSearchTerm={customerSearchTerm}
          setCustomerSearchTerm={setCustomerSearchTerm}
          customerOptions={customerOptions}
          customerId={customerId}
          setCustomerId={setCustomerId}
          onCustomerSelected={handleCustomerSelectedForCheckout}
          isPaymentDialogOpen={isPaymentDialogOpen}
          setIsPaymentDialogOpen={handlePaymentDialogOpenChange}
          activePaymentLabel={activePaymentLabel}
          paymentTypeOptions={paymentTypeOptions}
          activePaymentType={activePaymentType}
          setActivePaymentType={setActivePaymentType}
          paymentsRows={paymentsRows}
          removePaymentRow={removePaymentRow}
          subtotal={subtotal}
          cartDiscount={cartDiscount}
          totalPaid={totalPaid}
          changeAmount={changeAmount}
          paymentAmountInput={paymentAmountInput}
          setPaymentAmountInput={setPaymentAmountInput}
          addPaymentFromPopup={addPaymentFromPopup}
          paymentAmountShortcuts={paymentAmountShortcuts}
          makeFullPaymentFromPopup={makeFullPaymentFromPopup}
          confirmFullPaymentFromPopup={confirmFullPaymentFromPopup}
          handleCompleteSale={handleCompleteSale}
          isCreatingSale={isCreatingSale}
          ordersAllowUnpaid={ordersAllowUnpaid}
          ordersAllowPartial={ordersAllowPartial}
          handleSaveAsUnpaid={handleSaveAsUnpaid}
          openLayawayDialog={openLayawayDialog}
          isLayawayDialogOpen={isLayawayDialogOpen}
          setIsLayawayDialogOpen={handleLayawayDialogOpenChange}
          layawayCount={layawayCount}
          setLayawayCount={setLayawayCount}
          layawayLines={layawayLines}
          setLayawayLines={setLayawayLines}
          minimumLayawayPayment={minimumLayawayPayment}
          handleSkipLayaway={handleSkipLayaway}
          handleSubmitLayaway={handleSubmitLayaway}
          openCartDiscountDialog={openCartDiscountDialog}
          activePriceItem={activePriceItem}
          setActivePriceItem={setActivePriceItem}
          priceInput={priceInput}
          setPriceInput={setPriceInput}
          handleApplyItemPrice={handleApplyItemPrice}
          isOpenShiftDialogOpen={isOpenShiftDialogOpen}
          setIsOpenShiftDialogOpen={setIsOpenShiftDialogOpen}
          shift={shift}
          handleOpenShift={handleOpenShift}
          isOpeningShift={isOpeningShift}
          selectedRegisterId={selectedRegisterId}
          setSelectedRegisterId={setSelectedRegisterId}
          registerOptions={registerOptions}
          isRegistersLoading={isRegistersLoading}
          openingCash={openingCash}
          setOpeningCash={setOpeningCash}
          openingNote={openingNote}
          setOpeningNote={setOpeningNote}
          router={router}
          hasPermission={hasPermission}
          isRegisterOptionsOpen={isRegisterOptionsOpen}
          setIsRegisterOptionsOpen={setIsRegisterOptionsOpen}
          isRegisterHistoryOpen={isRegisterHistoryOpen}
          setIsRegisterHistoryOpen={setIsRegisterHistoryOpen}
          openRegisterHistory={openRegisterHistory}
          registerHistoryState={registerHistoryState}
          registerHistoryEntries={registerHistoryEntries}
          registerHistorySummary={registerHistorySummary}
          registerTotalIn={registerTotalIn}
          registerTotalOut={registerTotalOut}
          shiftAction={shiftAction}
          setShiftAction={setShiftAction}
          movementAmount={movementAmount}
          setMovementAmount={setMovementAmount}
          movementNote={movementNote}
          setMovementNote={setMovementNote}
          isCashingIn={isCashingIn}
          isCashingOut={isCashingOut}
          handleCashMovement={handleCashMovement}
          declaredCash={declaredCash}
          setDeclaredCash={setDeclaredCash}
          closingNote={closingNote}
          setClosingNote={setClosingNote}
          isClosingShift={isClosingShift}
          handleCloseShift={handleCloseShift}
          isHeldCartDialogOpen={isHeldCartDialogOpen}
          setIsHeldCartDialogOpen={setIsHeldCartDialogOpen}
          pendingOrdersTab={pendingOrdersTab}
          handlePendingTabChange={handlePendingTabChange}
          pendingOrderSearch={pendingOrderSearch}
          setPendingOrderSearch={setPendingOrderSearch}
          handleSearchPendingOrders={handleSearchPendingOrders}
          pendingOrders={pendingOrders}
          handleOpenPendingOrder={handleOpenPendingOrder}
          handlePreviewPendingOrder={handlePreviewPendingOrder}
          handlePrintPendingOrder={handlePrintPendingOrder}
          isHoldReferenceDialogOpen={isHoldReferenceDialogOpen}
          setIsHoldReferenceDialogOpen={setIsHoldReferenceDialogOpen}
          holdReference={holdReference}
          setHoldReference={setHoldReference}
          handleHoldSale={handleHoldSale}
          isHoldingSale={isHoldingSale}
          previewPendingOrder={previewPendingOrder}
          setPreviewPendingOrder={setPreviewPendingOrder}
          isUnitPickerOpen={isUnitPickerOpen}
          setIsUnitPickerOpen={setIsUnitPickerOpen}
          unitPickerProduct={unitPickerProduct}
          setUnitPickerProduct={setUnitPickerProduct}
          getUnitQuantityLabel={getUnitQuantityLabel}
          getDisplayPrice={getDisplayPrice}
          handleUnitPickerSelect={handleUnitPickerSelect}
          pendingCartProduct={pendingCartProduct}
          setPendingCartProduct={setPendingCartProduct}
          quantityInput={quantityInput}
          setQuantityInput={setQuantityInput}
          allowDecimalQuantities={allowDecimalQuantities}
          handleConfirmQuantity={handleConfirmQuantity}
          isNoteDialogOpen={isNoteDialogOpen}
          setIsNoteDialogOpen={setIsNoteDialogOpen}
          saleNote={saleNote}
          setSaleNote={setSaleNote}
          isCouponsDialogOpen={isCouponsDialogOpen}
          setIsCouponsDialogOpen={setIsCouponsDialogOpen}
          selectedCouponId={selectedCouponId}
          setSelectedCouponId={setSelectedCouponId}
          couponOptions={couponOptions}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          loadedCoupon={loadedCoupon}
          isLoadingCoupon={loadCustomerCouponState.isLoading}
          handleLoadCouponForPos={handleLoadCouponForPos}
          handleApplyLoadedCoupon={handleApplyLoadedCoupon}
          handleRemoveCouponCode={handleRemoveCouponCode}
          taxGroupOptions={taxGroupOptions}
          orderTaxBreakdown={orderTaxBreakdown}
          orderTaxAmount={orderTaxAmount}
          isOrderSettingsOpen={isOrderSettingsOpen}
          setIsOrderSettingsOpen={setIsOrderSettingsOpen}
          orderTitle={orderTitle}
          setOrderTitle={setOrderTitle}
          activeOrderType={activeOrderType}
          setOrderType={setOrderType}
          enabledOrderTypes={enabledOrderTypes}
          isTaxesDialogOpen={isTaxesDialogOpen}
          setIsTaxesDialogOpen={setIsTaxesDialogOpen}
          cartTaxGroupId={cartTaxGroupId}
          setCartTaxGroupId={setCartTaxGroupId}
          cartTaxType={cartTaxType}
          setCartTaxType={setCartTaxType}
          isCartDiscountDialogOpen={isCartDiscountDialogOpen}
          setIsCartDiscountDialogOpen={setIsCartDiscountDialogOpen}
          cartDiscountType={cartDiscountType}
          setCartDiscountType={setCartDiscountType}
          cartDiscountVal={cartDiscountVal}
          setCartDiscountVal={setCartDiscountVal}
          handleApplyCartDiscount={handleApplyCartDiscount}
          activeDiscountItem={activeDiscountItem}
          setActiveDiscountItem={setActiveDiscountItem}
          itemDiscountType={itemDiscountType}
          setItemDiscountType={setItemDiscountType}
          itemDiscountVal={itemDiscountVal}
          setItemDiscountVal={setItemDiscountVal}
          handleApplyItemDiscount={handleApplyItemDiscount}
          isOrderTypeOpen={isOrderTypeOpen}
          setIsOrderTypeOpen={setIsOrderTypeOpen}
          onOrderTypeSelected={handleOrderTypeSelectedForCheckout}
          isShippingBillingOpen={isShippingBillingOpen}
          setIsShippingBillingOpen={setIsShippingBillingOpen}
          shippingBillingTab={shippingBillingTab}
          setShippingBillingTab={setShippingBillingTab}
          shippingInfo={shippingInfo}
          setShippingInfo={setShippingInfo}
          selectedCustomer={selectedCustomer}
          fillCustomerAddress={fillCustomerAddress}
          saveShippingBilling={saveShippingBilling}
        />

        {confirmDialog}
      </div>
    </DashboardPage>
  )
}
