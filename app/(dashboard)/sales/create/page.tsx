"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  Ban,
  ChevronRight,
  ChevronsDownUp,
  CreditCard,
  Folder,
  Home,
  ImageIcon,
  LogOut,
  MessageSquare,
  Package,
  Pause,
  Percent,
  ScanBarcode,
  Search,
  Settings,
  ShoppingCart,
  Tags,
  Trash2,
  User,
  WalletCards,
} from "lucide-react"

import { useConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import SalesModals from "./SalesModals"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { catalog } from "@/lib/api/catalog"
import { customers } from "@/lib/api/customers"
import { payments } from "@/lib/api/payments"
import { promotions } from "@/lib/api/promotions"
import { usePermissions } from "@/hooks/use-permissions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { formatBusinessDateTime, formatBusinessMoney } from "@/lib/format"
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
  const { hasPermission } = usePermissions()

  const [shift, setShift] = useState<any>(null)
  const [isOpenShiftDialogOpen, setIsOpenShiftDialogOpen] = useState(false)
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
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [draftId, setDraftId] = useState("")
  const [barcode, setBarcode] = useState("")
  const [couponInput, setCouponInput] = useState("")
  const [selectedCouponId, setSelectedCouponId] = useState("")
  const [orderTitle, setOrderTitle] = useState("")
  const [orderType, setOrderType] = useState("takeaway")
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
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false)
  const [pendingCartProduct, setPendingCartProduct] = useState<PendingCartProduct | null>(null)
  const [quantityInput, setQuantityInput] = useState("1")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentsRows, setPaymentsRows] = useState<PaymentRow[]>([
    emptyPaymentRow(),
  ])
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [activePaymentType, setActivePaymentType] = useState("cash-payment")
  const [paymentAmountInput, setPaymentAmountInput] = useState("")
  const [isHeldCartDialogOpen, setIsHeldCartDialogOpen] = useState(false)
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
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState("")
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
  const [
    getRegistersDropdown,
    { data: registersDropdownData, isLoading: isRegistersLoading },
  ] = (registers as any).useGetRegistersDropdownMutation()
  const [getCustomersDropdown, { data: customersData, isLoading: isCustomersLoading }] =
    (customers as any).useGetCustomersDropdownMutation()
  const [getPaymentTypesDropdown, { data: paymentTypesData, isLoading: isPaymentTypesLoading }] =
    (payments as any).useGetPaymentTypesDropdownMutation()
  const [getCouponsDropdown, { data: couponsData, isLoading: isCouponsLoading }] =
    (promotions as any).useGetCouponsDropdownMutation()
  const [getPOSGrid] = (catalog as any).useGetPOSGridMutation()
  const [getPOSGridByCategory] = (catalog as any).useGetPOSGridByCategoryMutation()
  const [getTaxGroupsDropdown, { data: taxGroupsData }] = (catalog as any).useGetTaxGroupsDropdownMutation()
  const [getProductsData, productSearchState] = (catalog as any).useGetProductsDataMutation()
  const [getProductById] = (catalog as any).useGetProductByIdMutation()
  const [searchProductUsingBarcode, barcodeSearchState] = (
    catalog as any
  ).useSearchProductUsingBarcodeMutation()
  const [getCustomerRewardBalance, rewardBalanceState] = (
    rewards as any
  ).useGetCustomerRewardBalanceMutation()
  const [redeemCustomerReward, redeemRewardState] = (
    rewards as any
  ).useRedeemCustomerRewardMutation()
  const [createSale, { isLoading: isCreatingSale }] = (
    sales as any
  ).useCreateSaleMutation()
  const [getSalesData] = (sales as any).useGetSalesDataMutation()
  const [getSaleById] = (sales as any).useGetSaleByIdMutation()
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
  const selectedCustomer = useMemo(
    () => customerOptions.find((customer: any) => String(customer.id) === String(customerId)),
    [customerOptions, customerId]
  )
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
      const quantities = product.unit_quantities || []
      if (!quantities.length) return true
      return quantities.some((quantity) => Number(quantity.quantity || 0) > 0)
    })
    : gridData.products
  const pinnedProductsForGrid = pinnedProductsEnabled
    ? (
      hideExhaustedProducts
        ? gridData.pinnedProducts.filter((product) => {
          const quantities = product.unit_quantities || []
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
    unitQuantity?.unit?.name ||
    unitQuantity?.unit?.identifier ||
    (unitQuantity?.id ? `${t("Unit")} ${unitQuantity.id}` : "")

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
  const subtotal = Math.max(itemsSubtotal - cartDiscount, 0)
  const enabledOrderTypes = useMemo(() => {
    const configured = posOptions.order_types.length ? posOptions.order_types : ["takeaway", "delivery"]
    return [
      { value: "takeaway", label: t("Take Away") },
      { value: "delivery", label: t("Delivery") },
    ].filter((item) => configured.includes(item.value))
  }, [posOptions.order_types, t])
  const activeOrderType = enabledOrderTypes.some((type) => type.value === orderType)
    ? orderType
    : enabledOrderTypes[0]?.value || orderType

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
    setCartTaxGroupId(posOptions.pos_tax_group ? String(posOptions.pos_tax_group) : "")
    setCartTaxType(posOptions.pos_tax_type ? String(posOptions.pos_tax_type) : "exclusive")
  }, [posOptions.pos_tax_group, posOptions.pos_tax_type])

  useEffect(() => {
    if (!forceAutoFocus || !barcode.trim()) return
    const searchTimer = window.setTimeout(() => {
      handleBarcodeSearch()
    }, 200)
    return () => window.clearTimeout(searchTimer)
  }, [barcode, forceAutoFocus])

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
    setCartItems([])
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
    await loadShift()
    showToast.success(response?.message || t("Cash movement recorded."))
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
    const stockManaged =
      product.stock_management !== "disabled" && product.type !== "dematerialized"

    if (stockManaged && !unitQuantity?.id) {
      showToast.error(t("Select a selling unit before adding this product."))
      return false
    }
    if (!validateProductQuantity(product, unitQuantity, initialQty)) return false

    const price = getDisplayPrice(unitQuantity)
    const availableStock = Number(unitQuantity?.quantity || 0)
    const unitQuantityId = unitQuantity?.id ? String(unitQuantity.id) : ""
    const unitLabel =
      getUnitQuantityLabel(unitQuantity) ||
      product.unit_name ||
      ""

    setCartItems((items) => {
      const existing = items.find(
        (item) =>
          item.product_id === String(product.id) &&
          (item.unit_quantity_id || "") === unitQuantityId
      )
      if (existing && itemsMergeEnabled) {
        return items.map((item) =>
          item.product_id === String(product.id) &&
            (item.unit_quantity_id || "") === unitQuantityId
            ? { ...item, qty: item.qty + initialQty }
            : item
        )
      }

      return [
        ...items,
        {
          line_id: crypto.randomUUID(),
          product_id: String(product.id),
          unit_quantity_id: unitQuantityId || undefined,
          unit_id: unitQuantity?.unit_id
            ? String(unitQuantity.unit_id)
            : product.unit_id
              ? String(product.unit_id)
              : undefined,
          unit_label: unitLabel,
          mode: product.mode || "normal",
          product_type: product.product_type || "product",
          rate: Number(product.rate || 0),
          name: product.name,
          qty: initialQty,
          price,
          available_stock: availableStock,
          sku: product.sku,
        },
      ]
    })
    return true
  }

  const handleGridProductClick = (product: POSProduct) => {
    const unitQuantities = product.unit_quantities || []
    if (unitQuantities.length === 0) {
      openQuantityDialog(product, undefined)
      return
    }
    if (unitQuantities.length === 1) {
      openQuantityDialog(product, unitQuantities[0])
      return
    }
    // Multiple units — open picker
    setUnitPickerProduct(product)
    setIsUnitPickerOpen(true)
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

  const handleBarcodeSearch = async () => {
    const reference = barcode.trim()
    if (!reference) return
    const response = await searchProductUsingBarcode({ reference }).unwrap()
    const product = response?.data
    if (!product) return
    // Use matched_unit_quantity from barcode API, or first available unit_quantity
    const matchedUnitQuantity =
      product.matched_unit_quantity ||
      (product.unit_quantities && product.unit_quantities.length > 0
        ? product.unit_quantities[0]
        : undefined)
    const initialQty = product.scale_value !== undefined ? Number(product.scale_value) : 1
    const added = addProductToCart(product, matchedUnitQuantity, initialQty)
    if (added) {
      setBarcode("")
      showToast.success(t("{product} added to cart.").replace("{product}", product.name))
    }
  }

  const handleProductSearch = async () => {
    const search = productSearchTerm.trim()
    if (!search) return
    const response = await getProductsData({
      page: 1,
      limit: 20,
      search,
    }).unwrap()
    const products = response?.data?.items || response?.data || []
    setProductSearchResults(products)
    if (products.length === 1) {
      await handleProductSearchPick(products[0])
    } else if (!products.length) {
      showToast.error(t("No result to result match the search value provided."))
    }
  }

  const handleProductSearchPick = async (product: POSProduct | any) => {
    if (Number(product.accurate_tracking || 0) === 1) {
      showToast.error(
        t("The product \"{product}\" can't be added from a search field, as \"Accurate Tracking\" is enabled. Would you like to learn more ?")
          .replace("{product}", product.name)
      )
      return
    }
    const response = await getProductById({ id: product.id }).unwrap()
    const fullProduct = response?.data || product
    setIsProductSearchOpen(false)
    setProductSearchTerm("")
    setProductSearchResults([])
    handleGridProductClick(fullProduct)
  }

  useEffect(() => {
    if (!isProductSearchOpen || !productSearchTerm.trim()) return
    const searchTimer = window.setTimeout(() => {
      handleProductSearch()
    }, 500)
    return () => window.clearTimeout(searchTimer)
  }, [isProductSearchOpen, productSearchTerm])

  const updateQuantity = (lineId: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.line_id === lineId
            ? { ...item, qty: Math.max(item.qty + delta, 0) }
            : item
        )
        .filter((item) => item.qty > 0)
    )
  }

  const removeItem = (lineId: string) => {
    setCartItems((items) => items.filter((item) => item.line_id !== lineId))
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
    setCartDiscountVal(String(Math.max(Number(cartDiscountVal || 0), 0)))
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

  const handleVoidCart = () => {
    if (!cartItems.length) {
      resetSaleForm()
      return
    }
    resetSaleForm()
    showToast.success(t("The cart has been cleared."))
  }

  const resetSaleForm = () => {

    setDraftId("")
    setCustomerId("")
    setBarcode("")
    setCouponInput("")
    setSelectedCouponId("")
    setOrderTitle("")
    setOrderType("takeaway")
    setCartTaxGroupId(posOptions.pos_tax_group ? String(posOptions.pos_tax_group) : "")
    setCartTaxType(posOptions.pos_tax_type ? String(posOptions.pos_tax_type) : "exclusive")
    setSaleNote("")
    setCartDiscountVal("")
    setCartDiscountType("flat")
    setCartItems([])
    setPaymentsRows([emptyPaymentRow()])
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
    setIsHeldCartDialogOpen(false)
    router.push(`/sales/${order.id}`)
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

  const handleDeleteHeldSale = async (heldSaleId: number | string) => {
    const response = await deleteHeldSale({ id: heldSaleId }).unwrap()
    showToast.success(response?.message || t("Held cart deleted successfully."))
    await refreshPendingOrders("hold", pendingOrderSearch)
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

  const handleHoldSale = async () => {
    if (!cartItems.length) {
      showToast.error(t("Add at least one product before holding cart."))
      return
    }
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

  const handleCompleteSale = async (submitOptions: { paymentStatus?: string } = {}) => {
    if (cashRegistersEnabled && !shift?.id) {
      showToast.error(t("Open shift is required before billing."))
      return
    }
    if (!cartItems.length) {
      showToast.error(t("Add at least one product to cart."))
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
    const validPayments = paymentsRows.filter((row) => money(row.amount) > 0)
    const payLoad = {
      draft_id: draftId ? Number(draftId) : null,
      title: orderTitle,
      customer_id: customerId ? Number(customerId) : null,
      shift_id: cashRegistersEnabled ? shift.id : null,
      order_type: activeOrderType,
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

      payments: validPayments.map((row) => ({
        payment_type: row.payment_type,
        amount: String(money(row.amount)),
        reference_number: row.reference_number,
        note: row.note || saleNote,
      })),
    }

    const response = await createSale(payLoad).unwrap()
    const sale = response?.data
    showToast.success(response?.message || t("Sale created successfully."))
    resetSaleForm()
    setIsPaymentDialogOpen(false)
    await loadShift()
    if (sale?.id) {
      const paymentStatus = sale.payment_status || requestedPaymentStatus
      router.push(shouldOpenReceipt(paymentStatus) ? getPrintedDocumentUrl(sale.id) : `/sales/${sale.id}`)
    }
  }

  const handleSaveAsUnpaid = async () => {
    const proceed = await confirm({
      title: t("Confirm"),
      description: t("Are you sure you want to save this order as unpaid?"),
    })
    if (!proceed) return
    handleCompleteSale({ paymentStatus: "unpaid" })
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

  const makeFullPaymentFromPopup = () => {
    const remaining = Math.max(subtotal - totalPaid, 0)
    if (!remaining) {
      handleCompleteSale()
      return
    }
    addPaymentFromPopup(remaining)
  }

  const handleOpenPaymentDialog = () => {
    if (!cartItems.length) {
      showToast.error(t("Add at least one product to cart."))
      return
    }
    setIsPaymentDialogOpen(true)
    const firstPayment = paymentTypeOptions[0]
    if (!activePaymentType && firstPayment) {
      setActivePaymentType(firstPayment.value || firstPayment.identifier || "cash-payment")
    }
  }

  useEffect(() => {
    const hasOpenDialog =
      isUnitPickerOpen ||
      isPaymentDialogOpen ||
      isHeldCartDialogOpen ||
      isHoldReferenceDialogOpen ||
      isNoteDialogOpen ||
      isCouponsDialogOpen ||
      isOrderSettingsOpen ||
      isTaxesDialogOpen ||
      isCartDiscountDialogOpen ||
      isProductSearchOpen ||
      Boolean(activeDiscountItem)

    const handleShortcut = (event: KeyboardEvent) => {
      if (hasOpenDialog || shouldIgnorePosShortcut(event)) return

      const run = (shortcut: unknown, action: () => void) => {
        if (!shortcutMatches(event, shortcut)) return false
        event.preventDefault()
        action()
        return true
      }

      if (run(posOptions.pos_keyboard_quick_search, () => setIsProductSearchOpen(true))) return
      if (run(posOptions.pos_keyboard_toggle_merge, () => setItemsMergeEnabled((current) => !current))) return
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
    cartItems.length,
    handleOpenPaymentDialog,
    handleVoidCart,
    isCartDiscountDialogOpen,
    isCouponsDialogOpen,
    isHeldCartDialogOpen,
    isHoldReferenceDialogOpen,
    isHoldingSale,
    isNoteDialogOpen,
    isOrderSettingsOpen,
    isPaymentDialogOpen,
    isProductSearchOpen,
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
    posOptions.pos_keyboard_toggle_merge,
  ])

  const removePaymentRow = (rowId: string) => {
    setPaymentsRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== rowId)
    )
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
      <div className="flex h-full min-h-0 flex-col bg-slate-100" id="pos-container">
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                <Home className="size-4" />
                {t("Dashboard")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenHeldSales}>
                <ShoppingCart className="size-4" />
                {t("Pending Orders")}
              </Button>
              {/* <div className="min-w-[220px]">
                <UniFieldSelect
                  value={customerId}
                  onValueChange={setCustomerId}
                  placeholder={t("Customer")}
                  allowClear
                  size="sm"
                >
                  {customerOptions.map((customer: any) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                      {customer.phone ? ` - ${customer.phone}` : ""}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
              </div> */}
              <div className="min-w-[160px]">
                <UniFieldSelect
                  value={activeOrderType}
                  onValueChange={setOrderType}
                  placeholder={t("Type")}
                  size="sm"
                >
                  {enabledOrderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetSaleForm}>
                {t("Reset")}
              </Button>
              {cashRegistersEnabled && shift ? (
                <>
                  {hasPermission(PERMISSIONS.cashRegister.cashIn) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShiftAction("cash_in")}
                    >
                      <BanknoteArrowDown className="size-4" />
                      {t("cash_in")}
                    </Button>
                  ) : null}
                  {hasPermission(PERMISSIONS.cashRegister.cashOut) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShiftAction("cash_out")}
                    >
                      <BanknoteArrowUp className="size-4" />
                      {t("cash_out")}
                    </Button>
                  ) : null}
                  {hasPermission(PERMISSIONS.cashRegister.close) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeclaredCash(String(shift.expected_cash || ""))
                        setShiftAction("close")
                      }}
                    >
                      <LogOut className="size-4" />
                      {t("close_shift")}
                    </Button>
                  ) : null}
                </>
              ) : cashRegistersEnabled ? (
                hasPermission(PERMISSIONS.cashRegister.open) ? (
                  <Button size="sm" onClick={() => setIsOpenShiftDialogOpen(true)}>
                    {t("open_shift")}
                  </Button>
                ) : null
              ) : (
                <Button variant="outline" size="sm" onClick={handleOpenHeldSales}>
                  {t("held_carts")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {!cashRegistersEnabled || shift ? (
          <div className="flex flex-auto overflow-hidden">
            <div className="flex h-full min-h-0 flex-auto flex-col overflow-hidden lg:flex-row">
              {/* ======== LEFT: Product Grid ======== */}
              <div className={[
                "order-2 flex min-h-0 w-full overflow-hidden lg:w-[56%]",
              ].join(" ")}>
                <div className="flex min-h-0 flex-auto flex-col overflow-hidden bg-white">
                  {/* Top bar: product tools + customer */}
                  <div className="border-b border-slate-200 p-3">
                    <UniFieldInput
                      ref={barcodeInputRef}
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleBarcodeSearch()
                        }
                      }}
                      placeholder={t("scan_barcode")}
                      containerClassName="bg-transparent"
                      addonBefore={
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={t("Search for products.")}
                            onClick={() => setIsProductSearchOpen(true)}
                            className="h-10 rounded-r-none border-r border-slate-200"
                          >
                            <Search className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={t("Toggle merging similar products.")}
                            onClick={() => setItemsMergeEnabled((current) => !current)}
                            className={[
                              "h-10 rounded-none border-r border-slate-200",
                              itemsMergeEnabled ? "bg-blue-50 text-blue-700" : "",
                            ].join(" ")}
                          >
                            <ChevronsDownUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={t("Toggle auto focus.")}
                            onClick={() => setForceAutoFocus((current) => !current)}
                            className={[
                              "h-10 rounded-none border-r border-slate-200",
                              forceAutoFocus ? "bg-blue-50 text-blue-700" : "",
                            ].join(" ")}
                          >
                            <ScanBarcode className="size-4" />
                          </Button>
                        </>
                      }
                      addonAfter={
                        barcodeSearchState.isLoading ? (
                          <span className="flex h-10 w-10 items-center justify-center border-l border-slate-200 bg-white">
                            <Spinner />
                          </span>
                        ) : undefined
                      }
                    />
                  </div>

                  {/* Breadcrumb navigation */}
                  <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateBreadcrumb(-1)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-blue-600 hover:bg-blue-50 h-auto font-medium"
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
                          className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50 h-auto font-medium"
                        >
                          {crumb.name}
                        </Button>
                      </span>
                    ))}
                    {gridLoading && <Spinner className="ml-2 size-3.5" />}
                  </div>

                  {/* Pinned products strip */}
                  {pinnedProductsForGrid.length > 0 && (
                    <div className="border-b border-gray-100 bg-amber-50/60 px-3 py-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">{t("Pinned")}</p>
                      <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {pinnedProductsForGrid.map((product) => {
                          const uq = product.unit_quantities?.[0]
                          const featuredImage = getFeaturedImage(product)
                          return (
                            <button
                              key={product.id}
                              onClick={() => handleGridProductClick(product)}
                              className={[
                                "cell-item group relative flex flex-col items-center justify-end overflow-hidden border bg-white transition hover:border-blue-400",
                                pinnedPreviewEnabled ? "h-36" : "h-20",
                              ].join(" ")}
                            >
                              {pinnedPreviewEnabled && featuredImage ? (
                                <img
                                  src={featuredImage}
                                  alt={product.name}
                                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                                />
                              ) : pinnedPreviewEnabled ? (
                                <ImageIcon className="absolute top-4 size-10 text-gray-300" />
                              ) : null}
                              <div className="relative z-10 flex h-20 w-full flex-col items-center justify-center bg-gradient-to-t from-black/70 to-transparent p-2 text-white">
                                <p className="w-full truncate text-center text-sm font-semibold">{product.name}</p>
                                {product.unit_quantities?.length === 1 && uq ? (
                                  <span className="text-sm">{formatMoney(getDisplayPrice(uq))}</span>
                                ) : null}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grid area: categories + products */}
                  <div className="flex-1 overflow-y-auto p-3">
                    {!gridLoading && categoriesForGrid.length === 0 && productsForGrid.length === 0 && pinnedProductsForGrid.length === 0 && (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                        <Package className="size-14 opacity-30" />
                        <p className="text-sm font-medium">{t("Looks like there is either no products and no categories. How about creating those first to get started ?")}</p>
                      </div>
                    )}

                    {/* Category tiles */}
                    {categoriesForGrid.length > 0 && (
                      <div className="mb-4 grid grid-cols-2 gap-0 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                        {categoriesForGrid.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => drillIntoCategory(category)}
                            className="cell-item group relative flex h-36 flex-col items-center justify-end overflow-hidden border bg-white transition hover:border-blue-400"
                          >
                            {category.preview_url ? (
                              <img
                                src={category.preview_url}
                                alt={category.name}
                                className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 transition"
                              />
                            ) : (
                              <Folder className="absolute top-4 size-10 text-blue-200 group-hover:text-blue-400 transition" />
                            )}
                            <div className="relative z-10 w-full bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
                              <p className="truncate text-center text-xs font-bold text-white">{category.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Product tiles (shown when no sub-categories) */}
                    {categoriesForGrid.length === 0 && productsForGrid.length > 0 && (
                      <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                        {productsForGrid.map((product) => {
                          const uq = product.unit_quantities?.[0]
                          const featuredImage = getFeaturedImage(product)
                          return (
                            <button
                              key={product.id}
                              onClick={() => handleGridProductClick(product)}
                              className="cell-item group relative flex h-36 flex-col items-center justify-end overflow-hidden border bg-white transition hover:border-blue-400"
                            >
                              {featuredImage ? (
                                <img
                                  src={featuredImage}
                                  alt={product.name}
                                  className="absolute inset-0 h-full w-full object-cover opacity-75 group-hover:opacity-100 transition"
                                />
                              ) : (
                                <ImageIcon className="absolute top-4 size-10 text-gray-200 group-hover:text-gray-300 transition" />
                              )}
                              <div className="relative z-10 w-full bg-gradient-to-t from-black/65 to-transparent px-2 pb-2 pt-6">
                                <p className="truncate text-center text-xs font-bold text-white">{product.name}</p>
                                {product.unit_quantities?.length === 1 && uq ? (
                                  <span className="block text-center text-sm text-blue-200">{formatMoney(getDisplayPrice(uq))}</span>
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

              {/* ======== RIGHT: Cart + Checkout ======== */}
              <div className={[
                "order-1 flex min-h-0 w-full overflow-hidden lg:w-[44%]",
              ].join(" ")}>
                <div className="flex min-h-0 flex-auto flex-col overflow-hidden bg-white">
                  <div className="border-b border-gray-100 p-2">
                    <ButtonGroup className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCustomerSelectOpen(true)}
                        className="flex-1"
                      >
                        <User className="size-4" />
                        <span className="truncate">{selectedCustomer ? selectedCustomer.name : t("Customer")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsNoteDialogOpen(true)}
                        className="flex-1"
                      >
                        <MessageSquare className="size-4" />
                        <span>{t("Comments")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCouponsDialogOpen(true)}
                        className="flex-1"
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
                        variant="outline"
                        onClick={openOrderSettingsDialog}
                        className="flex-1"
                      >
                        <Settings className="size-4" />
                        <span>{t("Settings")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTaxesDialogOpen(true)}
                        className="flex-1"
                      >
                        <WalletCards className="size-4" />
                        <span>{t("Taxes")}</span>
                      </Button>
                    </ButtonGroup>
                  </div>
                  {/* Cart items */}
                  <div className="flex-1 overflow-y-auto bg-slate-50/40 p-3">
                    {cartItems.length ? (
                      cartItems.map((item) => (
                        <div
                          key={item.line_id}
                          className="mb-3 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950">{item.name}</p>
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("sku")}: {item.sku || "-"}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {item.unit_label ? (
                                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs">
                                    {item.unit_label}
                                  </Button>
                                ) : item.product_type ? (
                                  <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-muted-foreground">
                                    {item.product_type}
                                  </span>
                                ) : null}
                                <Button
                                  type="button"
                                  variant="link"
                                  onClick={() => openItemDiscountDialog(item)}
                                  className="h-auto p-0 text-xs font-semibold"
                                >
                                  {item.discount_value && item.discount_value > 0 ? (
                                    <span className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 no-underline">
                                      {t("Discount")}: {item.discount_type === "percentage" ? `${item.discount_value}%` : formatMoney(item.discount_value)} (-{formatMoney(getCartItemDiscount(item))})
                                    </span>
                                  ) : (
                                    t("Discount")
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-red-500 hover:text-red-600"
                              onClick={() => removeItem(item.line_id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>

                          <div className="mt-3 grid grid-cols-[120px_1fr_120px] items-end gap-3">
                            <UniFieldInput
                              label={t("qty")}
                              type="number"
                              step={allowDecimalQuantities ? "0.01" : "1"}
                              min="0"
                              value={item.qty}
                              containerClassName="bg-transparent"
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                if (val >= 0) {
                                  setCartItems((prev) =>
                                    prev
                                      .map((i) =>
                                        i.line_id === item.line_id
                                          ? { ...i, qty: val }
                                          : i
                                      )
                                      .filter((i) => i.qty > 0)
                                  )
                                }
                              }}
                            />
                            <UniFieldInput
                              label={t("price")}
                              type="number"
                              min="0"
                              value={item.price}
                              prefix={posOptions.currency_symbol}
                              disabled={!posOptions.unit_price_editable}
                              containerClassName="bg-transparent"
                              onChange={(event) => {
                                const price = Number(event.target.value)
                                if (price >= 0) {
                                  setCartItems((prev) =>
                                    prev.map((cartItem) =>
                                      cartItem.line_id === item.line_id
                                        ? { ...cartItem, price, mode: "custom" }
                                        : cartItem
                                    )
                                  )
                                }
                              }}
                            />
                            <div className="pb-1 text-right">
                              <p className="text-xs font-semibold text-muted-foreground">{t("total")}</p>
                              <p className="text-base font-bold text-slate-950">
                                {formatMoney(item.qty * item.price - getCartItemDiscount(item))}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                        <ShoppingCart className="size-10" />
                        <p className="text-sm font-semibold">{t("no_items_in_cart")}</p>
                      </div>
                    )}
                  </div>

                  {/* Bill summary + checkout */}
                  <div className="border-t border-slate-200 bg-slate-50/60 p-3">
                    <div className="rounded-md border border-slate-200 bg-white text-sm font-semibold">
                      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                        <span>{t("Sub Total")}</span>
                        <span>{formatMoney(itemsSubtotal)}</span>
                      </div>
                      {(couponCodes.length > 0 || selectedCouponId) ? (
                        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                          <span>{t("Coupons")}</span>
                          <Button type="button" variant="link" className="h-auto p-0" onClick={() => setIsCouponsDialogOpen(true)}>
                            {couponCodes.length || 1}
                          </Button>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                        <span>
                          {t("Discount")}
                          {cartDiscountType === "percentage" ? ` (${cartDiscountVal || 0}%)` : cartDiscount > 0 ? ` (${t("Flat")})` : ""}
                        </span>
                        <Button type="button" variant="link" className="h-auto p-0" onClick={openCartDiscountDialog}>
                          {formatMoney(cartDiscount)}
                        </Button>
                      </div>
                      {posOptions.pos_vat !== "disabled" ? (
                        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                          <span>{selectedTaxGroup?.name || t("Tax")}</span>
                          <Button type="button" variant="link" className="h-auto p-0" onClick={() => setIsTaxesDialogOpen(true)}>
                            {formatMoney(0)}
                          </Button>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between px-3 py-3 text-base font-bold">
                        <span>{t("Total")}</span>
                        <span>{formatMoney(subtotal)}</span>
                      </div>
                    </div>

                    {customerId ? (
                      <div className="mt-3 flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
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

                  <div className="grid h-16 shrink-0 grid-cols-4 overflow-hidden border-t border-gray-200 text-sm font-bold">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openCartDiscountDialog}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 border-r bg-gray-50 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-none h-auto"
                    >
                      <Percent className="size-5" />
                      {t("Discount")}
                    </Button>
                    <Button
                      type="button"
                      disabled={!cartItems.length || isHoldingSale}
                      onClick={() => setIsHoldReferenceDialogOpen(true)}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 border-r bg-blue-600 px-2 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 rounded-none h-auto hover:text-white"
                    >
                      <Pause className="size-5" />
                      {isHoldingSale ? t("Saving") : t("Hold")}
                    </Button>
                    <Button
                      type="button"
                      disabled={!cartItems.length || isCreatingSale}
                      onClick={handleOpenPaymentDialog}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 border-r bg-green-600 px-2 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 rounded-none h-auto hover:text-white"
                    >
                      <CreditCard className="size-5" />
                      {isCreatingSale ? t("Completing") : t("Pay")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleVoidCart}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 bg-red-600 px-2 py-2 text-white hover:bg-red-700 rounded-none h-auto hover:text-white hover:bg-red-700/90"
                    >
                      <Ban className="size-5" />
                      {t("Void")}
                    </Button>
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
          isProductSearchOpen={isProductSearchOpen}
          setIsProductSearchOpen={setIsProductSearchOpen}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          handleProductSearch={handleProductSearch}
          productSearchState={productSearchState}
          productSearchResults={productSearchResults}
          handleProductSearchPick={handleProductSearchPick}
          isPaymentDialogOpen={isPaymentDialogOpen}
          setIsPaymentDialogOpen={setIsPaymentDialogOpen}
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
          handleCompleteSale={handleCompleteSale}
          isCreatingSale={isCreatingSale}
          ordersAllowUnpaid={ordersAllowUnpaid}
          ordersAllowPartial={ordersAllowPartial}
          handleSaveAsUnpaid={handleSaveAsUnpaid}
          openCartDiscountDialog={openCartDiscountDialog}
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
          handleDeleteHeldSale={handleDeleteHeldSale}
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
          openQuantityDialog={openQuantityDialog}
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
          taxGroupOptions={taxGroupOptions}
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
        />

        {confirmDialog}
      </div>
    </DashboardPage>
  )
}
