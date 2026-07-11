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
  Minus,
  Package,
  Pause,
  Percent,
  Plus,
  PlusCircle,
  ScanBarcode,
  Search,
  Settings,
  ShoppingCart,
  Tags,
  Trash2,
  WalletCards,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

const emptyQuickProductForm = () => ({
  name: "",
  product_type: "product",
  rate: "",
  unit_price: "0",
  quantity: "1",
  unit_id: "",
  tax_type: "inclusive",
  tax_group_id: "",
})

const getCartItemDiscount = (item: CartItem) => {
  const type = item.discount_type || "flat"
  const val = item.discount_value || 0
  if (type === "percentage") {
    return ((item.qty * item.price) * val) / 100
  }
  return val
}


export default function SalesPage() {
  const router = useRouter()
  const { t } = useTranslation()
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
  const formatMoney = useCallback((value: number | string | null | undefined) => {
    const amount = Number(value || 0).toFixed(posOptions.currency_precision)
    const indicator = posOptions.currency_preferred === "iso"
      ? posOptions.currency_iso
      : posOptions.currency_symbol
    return posOptions.currency_position === "after"
      ? `${amount}${indicator}`
      : `${indicator}${amount}`
  }, [
    posOptions.currency_iso,
    posOptions.currency_position,
    posOptions.currency_precision,
    posOptions.currency_preferred,
    posOptions.currency_symbol,
  ])
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
  const [draftId, setDraftId] = useState("")
  const [barcode, setBarcode] = useState("")
  const [couponInput, setCouponInput] = useState("")
  const [selectedCouponId, setSelectedCouponId] = useState("")
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
  const [visibleSection, setVisibleSection] = useState<"both" | "cart" | "grid">("both")
  const [unitPickerProduct, setUnitPickerProduct] = useState<POSProduct | null>(null)
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false)
  const [pendingCartProduct, setPendingCartProduct] = useState<PendingCartProduct | null>(null)
  const [quantityInput, setQuantityInput] = useState("1")
  const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null)
  const [priceInput, setPriceInput] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentsRows, setPaymentsRows] = useState<PaymentRow[]>([
    emptyPaymentRow(),
  ])
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [activePaymentType, setActivePaymentType] = useState("cash-payment")
  const [paymentAmountInput, setPaymentAmountInput] = useState("")
  const [showPaymentList, setShowPaymentList] = useState(false)
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
  const [isQuickProductDialogOpen, setIsQuickProductDialogOpen] = useState(false)
  const [quickProductForm, setQuickProductForm] = useState(emptyQuickProductForm)
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
  const [getUnitsDropdown, { data: unitsDropdownData, isLoading: isUnitsLoading }] =
    (catalog as any).useGetUnitsDropdownMutation()
  const [createProduct, { isLoading: isCreatingQuickProduct }] = (
    catalog as any
  ).useCreateProductMutation()
  const [createProductUnitQuantity] = (
    catalog as any
  ).useCreateProductUnitQuantityMutation()
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
  const unitOptions = unitsDropdownData?.data || []
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
    getUnitsDropdown()
    loadGrid()
  }, [
    getCouponsDropdown,
    getCurrentShift,
    getCustomersDropdown,
    getPaymentTypesDropdown,
    getTaxGroupsDropdown,
    getUnitsDropdown,
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
    setQuickProductForm((current) => ({
      ...current,
      unit_id:
        current.unit_id ||
        (posOptions.quick_product_default_unit
          ? String(posOptions.quick_product_default_unit)
          : ""),
      tax_group_id:
        current.tax_group_id ||
        (posOptions.pos_tax_group ? String(posOptions.pos_tax_group) : ""),
      tax_type: current.tax_type || posOptions.pos_tax_type || "inclusive",
    }))
  }, [
    posOptions.pos_tax_group,
    posOptions.pos_tax_type,
    posOptions.quick_product_default_unit,
  ])

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
      unitQuantity?.unit_identifier ||
      unitQuantity?.unit_name ||
      unitQuantity?.unit_short_name ||
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

  const updateQuickProductForm = (field: keyof ReturnType<typeof emptyQuickProductForm>, value: string) => {
    setQuickProductForm((current) => ({ ...current, [field]: value }))
  }

  const resetQuickProductForm = () => {
    setQuickProductForm({
      ...emptyQuickProductForm(),
      unit_id: posOptions.quick_product_default_unit
        ? String(posOptions.quick_product_default_unit)
        : "",
      tax_group_id: posOptions.pos_tax_group ? String(posOptions.pos_tax_group) : "",
      tax_type: posOptions.pos_tax_type || "inclusive",
    })
  }

  const handleCreateQuickProduct = async () => {
    const form = quickProductForm
    const isDynamic = form.product_type === "dynamic"
    const name = form.name.trim()
    const unitPrice = money(form.unit_price)
    const quantity = isDynamic ? 1 : money(form.quantity)
    const rate = money(form.rate)

    if (!name) {
      showToast.error(t("Provide a unique name for the product."))
      return
    }
    if (isDynamic && rate <= 0) {
      showToast.error(t("In case the product is computed based on a percentage, define the rate here."))
      return
    }
    if (!isDynamic && (!form.unit_id || unitPrice < 0 || quantity <= 0)) {
      showToast.error(t("Unable to proceed. The form is not valid."))
      return
    }

    const selectedUnit = unitOptions.find((unit: any) => String(unit.id) === String(form.unit_id))
    const productForm = new FormData()
    productForm.append("name", name)
    productForm.append("product_type", "product")
    productForm.append("type", isDynamic ? "dematerialized" : "materialized")
    productForm.append("stock_management", "disabled")
    productForm.append("searchable", "true")
    productForm.append("auto_cogs", "true")
    productForm.append("accurate_tracking", "false")
    if (isDynamic) {
      productForm.append("tax_type", "exclusive")
    } else if (form.tax_type) {
      productForm.append("tax_type", form.tax_type)
    }
    if (form.tax_group_id && !isDynamic) {
      productForm.append("tax_group_id", form.tax_group_id)
    }
    if (selectedUnit?.group_id && !isDynamic) {
      productForm.append("unit_group_id", String(selectedUnit.group_id))
    }

    const productResponse = await createProduct(productForm).unwrap()
    const product = productResponse?.data
    if (!product?.id) {
      showToast.error(t("Unable to proceed. The form is not valid."))
      return
    }

    let unitQuantity: POSUnitQuantity | any = undefined
    if (!isDynamic) {
      const unitResponse = await createProductUnitQuantity({
        productId: product.id,
        payLoad: {
          unit_id: Number(form.unit_id),
          quantity: 0,
          sale_price: unitPrice,
          sale_price_edit: unitPrice,
          sale_price_net: unitPrice,
          sale_price_gross: unitPrice,
          visible: true,
        },
      }).unwrap()
      unitQuantity = {
        ...(unitResponse?.data || {}),
        unit_name: selectedUnit?.name,
        unit_identifier: selectedUnit?.identifier,
        sale_price: unitPrice,
        sale_price_net: unitPrice,
        sale_price_gross: unitPrice,
        quantity: 0,
      }
    }

    const cartProduct = {
      ...product,
      name,
      mode: "custom",
      product_type: isDynamic ? "dynamic" : "product",
      rate: isDynamic ? rate : 0,
      stock_management: "disabled",
      type: isDynamic ? "dematerialized" : "materialized",
      unit_id: form.unit_id ? Number(form.unit_id) : undefined,
      unit_name: selectedUnit?.name || (isDynamic ? t("N/A") : ""),
    }
    const added = addProductToCart(cartProduct, unitQuantity, quantity)
    if (!added) return
    showToast.success(t("{product} added to cart.").replace("{product}", name))
    resetQuickProductForm()
    setIsQuickProductDialogOpen(false)
    await loadGrid()
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

  const openPriceEditDialog = (item: CartItem) => {
    if (!posOptions.unit_price_editable) return
    if (item.product_type === "dynamic") {
      showToast.error(t("Dynamic product can't have their price updated."))
      return
    }
    setPriceEditItem(item)
    setPriceInput(String(item.price || ""))
  }

  const handleApplyProductPrice = () => {
    if (!priceEditItem) return
    const price = Math.max(Number(priceInput || 0), 0)
    setCartItems((items) =>
      items.map((item) =>
        item.line_id === priceEditItem.line_id ? { ...item, price } : item
      )
    )
    setPriceEditItem(null)
    setPriceInput("")
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
      const proceed = window.confirm(t("The cart is not empty. Opening an order will clear your cart would you proceed ?"))
      if (!proceed) return
    }
    const response = await getHeldSaleById({ id: heldSaleId }).unwrap()
    const heldSale = response?.data
    if (!heldSale) return

    setDraftId(String(heldSale.id))
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
      const proceed = window.confirm(t("The cart is not empty. Opening an order will clear your cart would you proceed ?"))
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

  const handleSaveAsUnpaid = () => {
    const proceed = window.confirm(t("Are you sure you want to save this order as unpaid?"))
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
    setShowPaymentList(true)
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
    setShowPaymentList(false)
    const firstPayment = paymentTypeOptions[0]
    if (!activePaymentType && firstPayment) {
      setActivePaymentType(firstPayment.value || firstPayment.identifier || "cash-payment")
    }
  }

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
      <div className="flex h-full min-h-0 flex-col" id="pos-container">
      <div className="flex shrink-0 overflow-hidden px-2 pt-2">
        <div className="-mx-2 flex overflow-x-auto pb-1">
          <div className="flex shrink-0 px-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <Home className="size-4" />
              {t("Dashboard")}
            </Button>
          </div>
          <div className="flex shrink-0 px-2">
            <Button variant="outline" onClick={handleOpenHeldSales}>
              <ShoppingCart className="size-4" />
              {t("Pending Orders")}
            </Button>
          </div>
          <div className="flex shrink-0 px-2">
            <Button variant="outline" onClick={() => setVisibleSection("cart")}>
              {t("Cart")}
            </Button>
          </div>
          <div className="flex shrink-0 px-2">
            <Button variant="outline" onClick={() => setVisibleSection("grid")}>
              {t("Products")}
            </Button>
          </div>
          <div className="flex shrink-0 px-2">
            <Button variant="outline" onClick={resetSaleForm}>
              {t("Reset")}
            </Button>
          </div>
          {cashRegistersEnabled && shift ? (
            <>
              <div className="flex shrink-0 px-2">
                <Button variant="outline" onClick={() => setVisibleSection("both")}>
                  {t("Both")}
                </Button>
              </div>
              <div className="flex shrink-0 px-2">
                <Button variant="outline" onClick={handleOpenHeldSales}>
                  {t("held_carts")}
                </Button>
              </div>
            </>
          ) : null}
          {cashRegistersEnabled && shift ? (
            <>
            {hasPermission(PERMISSIONS.cashRegister.cashIn) ? (
              <Button
                variant="outline"
                onClick={() => setShiftAction("cash_in")}
              >
                <BanknoteArrowDown className="size-4" />
                {t("cash_in")}
              </Button>
            ) : null}
            {hasPermission(PERMISSIONS.cashRegister.cashOut) ? (
              <Button
                variant="outline"
                onClick={() => setShiftAction("cash_out")}
              >
                <BanknoteArrowUp className="size-4" />
                {t("cash_out")}
              </Button>
            ) : null}
            {hasPermission(PERMISSIONS.cashRegister.close) ? (
              <Button
                variant="destructive"
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
            <Button onClick={() => setIsOpenShiftDialogOpen(true)}>
              {t("open_shift")}
            </Button>
          ) : null
        ) : (
          <Button variant="outline" onClick={handleOpenHeldSales}>
            {t("held_carts")}
          </Button>
        )}
        </div>
      </div>

      {!cashRegistersEnabled || shift ? (
        <div className="flex-auto overflow-hidden p-2">
          <div className="-m-2 flex h-full min-h-0 flex-auto overflow-hidden">
          {/* ======== LEFT: Product Grid ======== */}
          <div className={[
            "order-2 flex min-h-0 overflow-hidden p-2",
            visibleSection === "both" ? "hidden lg:flex lg:w-1/2" : visibleSection === "grid" ? "flex w-full" : "hidden",
          ].join(" ")}>
          <div className="flex min-h-0 flex-auto flex-col overflow-hidden rounded shadow bg-white">
            <div className="flex pl-2 lg:hidden">
              <button type="button" onClick={() => setVisibleSection("cart")} className="cursor-pointer rounded-tl-lg rounded-tr-lg border-l border-r border-t px-3 py-2">
                <span>{t("Cart")}</span>
                <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm">{cartItems.length}</span>
              </button>
              <button type="button" onClick={() => setVisibleSection("grid")} className="cursor-pointer rounded-tl-lg rounded-tr-lg px-3 py-2 font-semibold">
                {t("Products")}
              </button>
            </div>
            {/* Top bar: product tools + customer */}
            <div className="border-b p-2">
              <div className="overflow-hidden rounded border border-gray-200">
                <div className="flex">
                  <button
                    type="button"
                    title={t("Search for products.")}
                    onClick={() => setIsProductSearchOpen(true)}
                    className="flex h-10 w-10 items-center justify-center border-r border-gray-200 hover:bg-gray-50"
                  >
                    <Search className="size-4" />
                  </button>
                  <button
                    type="button"
                    title={t("Toggle merging similar products.")}
                    onClick={() => setItemsMergeEnabled((current) => !current)}
                    className={[
                      "flex h-10 w-10 items-center justify-center border-r border-gray-200 hover:bg-gray-50",
                      itemsMergeEnabled ? "bg-blue-50 text-blue-700" : "",
                    ].join(" ")}
                  >
                    <ChevronsDownUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    title={t("Toggle auto focus.")}
                    onClick={() => setForceAutoFocus((current) => !current)}
                    className={[
                      "flex h-10 w-10 items-center justify-center border-r border-gray-200 hover:bg-gray-50",
                      forceAutoFocus ? "bg-blue-50 text-blue-700" : "",
                    ].join(" ")}
                  >
                    <ScanBarcode className="size-4" />
                  </button>
                  <input
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
                    className="h-10 min-w-0 flex-auto bg-white px-3 text-sm outline-none"
                  />
                  {barcodeSearchState.isLoading ? (
                    <span className="flex h-10 w-10 items-center justify-center border-l border-gray-200">
                      <Spinner />
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-3">
                <UniFieldSelect
                  label={t("customer")}
                  value={customerId}
                  onValueChange={setCustomerId}
                  placeholder={t("Walk-in Customer")}
                  allowClear
                >
                  {customerOptions.map((customer: any) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                      {customer.phone ? ` - ${customer.phone}` : ""}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
              </div>
            </div>

            {/* Breadcrumb navigation */}
            <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <button
                onClick={() => navigateBreadcrumb(-1)}
                className="flex items-center gap-1 rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
              >
                <Home className="size-3.5" />
                <span>{t("Home")}</span>
              </button>
              {gridBreadcrumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight className="size-3 text-gray-400" />
                  <button
                    onClick={() => navigateBreadcrumb(i)}
                    className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
                  >
                    {crumb.name}
                  </button>
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
            "order-1 flex min-h-0 overflow-hidden p-2",
            visibleSection === "both" ? "hidden lg:flex lg:w-1/2" : visibleSection === "cart" ? "flex w-full" : "hidden",
          ].join(" ")}>
          <div className="flex min-h-0 flex-auto flex-col overflow-hidden rounded shadow bg-white">
            <div className="flex pl-2 lg:hidden">
              <button type="button" onClick={() => setVisibleSection("cart")} className="cursor-pointer rounded-tl-lg rounded-tr-lg px-3 py-2 font-semibold">
                <span>{t("Cart")}</span>
                <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm text-white">{cartItems.length}</span>
              </button>
              <button type="button" onClick={() => setVisibleSection("grid")} className="cursor-pointer rounded-tl-lg rounded-tr-lg border-l border-r border-t px-3 py-2">
                {t("Products")}
              </button>
            </div>
            <div className="border-b border-gray-100 p-2">
              <div className="flex flex-wrap overflow-hidden rounded border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setIsNoteDialogOpen(true)}
                  className="flex min-w-[92px] flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <MessageSquare className="size-4" />
                  {t("Comments")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCouponsDialogOpen(true)}
                  className="flex min-w-[92px] flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Tags className="size-4" />
                  {t("Coupons")}
                  {couponCodes.length ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs text-white">
                      {couponCodes.length}
                    </span>
                  ) : null}
                </button>
                {posOptions.quick_product_enabled ? (
                  <button
                    type="button"
                    onClick={() => setIsQuickProductDialogOpen(true)}
                    className="flex min-w-[92px] flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <PlusCircle className="size-4" />
                    {t("Product")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openOrderSettingsDialog}
                  className="flex min-w-[92px] flex-1 items-center justify-center gap-2 border-r border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="size-4" />
                  {t("Settings")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTaxesDialogOpen(true)}
                  className="flex min-w-[92px] flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <WalletCards className="size-4" />
                  {t("Taxes")}
                </button>
              </div>
            </div>
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 grid grid-cols-[1.4fr_130px_110px_120px_56px] bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700">
                <span>{t("item")}</span>
                <span>{t("qty")}</span>
                <span>{t("price")}</span>
                <span>{t("total")}</span>
                <span />
              </div>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div
                    key={item.line_id}
                    className="grid grid-cols-[1.4fr_130px_110px_120px_56px] items-center border-t px-4 py-3 text-sm font-semibold"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {t("sku")}: {item.sku || "-"}
                        {item.unit_label ? ` · ${t("unit")}: ${item.unit_label}` : ""}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openItemDiscountDialog(item)}
                          className="text-xs text-blue-600 hover:text-blue-700 underline font-semibold flex items-center gap-0.5"
                        >
                          {item.discount_value && item.discount_value > 0 ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                              {t("Discount")}: {item.discount_type === "percentage" ? `${item.discount_value}%` : formatMoney(item.discount_value)} (-{formatMoney(getCartItemDiscount(item))})
                            </span>
                          ) : (
                            t("Discount")
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          updateQuantity(item.line_id, -1)
                        }
                      >
                        <Minus className="size-4" />
                      </Button>
                      <input
                        type="number"
                        step={allowDecimalQuantities ? "0.01" : "1"}
                        min="0"
                        value={item.qty}
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
                        className="w-16 rounded border border-gray-200 px-2 py-1 text-center text-sm font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          updateQuantity(item.line_id, 1)
                        }
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openPriceEditDialog(item)}
                      className={[
                        "text-left font-semibold",
                        posOptions.unit_price_editable ? "cursor-pointer border-b border-dashed border-blue-300 text-blue-700" : "cursor-default",
                      ].join(" ")}
                    >
                      {formatMoney(item.price)}
                    </button>
                    <span>{formatMoney(item.qty * item.price - getCartItemDiscount(item))}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-500 hover:text-red-600"
                      onClick={() =>
                        removeItem(item.line_id)
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
            <div className="border-t border-gray-100 overflow-y-auto p-4">
              <h2 className="text-base font-bold">{t("bill_summary")}</h2>

              <div className="mt-4 space-y-4">
              <UniFieldSelect
                label={t("order_type")}
                value={activeOrderType}
                onValueChange={setOrderType}
                placeholder={t("order_type_select")}
              >
                {enabledOrderTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </UniFieldSelect>

              <UniFieldSelect
                label={t("suggested_coupon")}
                value={selectedCouponId}
                onValueChange={setSelectedCouponId}
                placeholder={t("choose_coupon")}
                allowClear
              >
                {couponOptions.map((coupon: any) => (
                  <SelectItem key={coupon.id} value={String(coupon.id)}>
                    {coupon.name} - {coupon.code}
                  </SelectItem>
                ))}
              </UniFieldSelect>

              <UniFieldInput
                label={t("coupon_codes")}
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder={t("coupon_codes_placeholder")}
              />

              {customerId ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-blue-950">
                        {t("customer_rewards")}
                      </p>
                      <p className="mt-1 text-xs font-medium text-blue-700">
                        {rewardBalanceState.isLoading
                          ? t("loading_reward_balance")
                          : redeemableReward
                            ? `${redeemableReward.points} ${t("points_available")} ${redeemableReward.target_points} ${t("for_coupon")}`
                            : t("no_redeemable_points")}
                      </p>
                    </div>
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
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{t("payments")}</p>
                  <Button type="button" variant="outline" size="sm" onClick={addPaymentRow}>
                    {t("add_payment")}
                  </Button>
                </div>
                {paymentsRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_140px_44px]">
                      <UniFieldSelect
                        label={index === 0 ? t("payment_type") : undefined}
                        value={row.payment_type}
                        onValueChange={(value) =>
                          updatePaymentRow(row.id, "payment_type", value)
                        }
                        placeholder={t("choose_payment_type")}
                      >
                        {paymentTypeOptions.map((payment: any) => (
                          <SelectItem
                            key={payment.value || payment.identifier}
                            value={payment.value || payment.identifier}
                          >
                            {payment.label}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>
                      <UniFieldInput
                        label={index === 0 ? t("amount") : undefined}
                        value={row.amount}
                        onChange={(event) =>
                          updatePaymentRow(row.id, "amount", event.target.value)
                        }
                        placeholder={t("0.00")}
                        prefix={posOptions.currency_symbol}
                        type="number"
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => removePaymentRow(row.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <UniFieldInput
                        value={row.reference_number}
                        onChange={(event) =>
                          updatePaymentRow(
                            row.id,
                            "reference_number",
                            event.target.value
                          )
                        }
                        placeholder={t("reference_number")}
                      />
                      <UniFieldInput
                        value={row.note}
                        onChange={(event) =>
                          updatePaymentRow(row.id, "note", event.target.value)
                        }
                        placeholder={t("payment_note")}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <UniFieldInput
                label={t("sale_note")}
                value={saleNote}
                onChange={(event) => setSaleNote(event.target.value)}
                placeholder={t("add_note_placeholder")}
              />
            </div>

            <div className="mt-6 space-y-3 text-sm font-semibold">
              <div className="flex justify-between">
                <span>{t("subtotal")}</span>
                <span>{formatMoney(itemsSubtotal)}</span>
              </div>
              {cartDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>{t("Cart Discount")}</span>
                  <span>-{formatMoney(cartDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>{t("total")}</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("received")}</span>
                <span>{formatMoney(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>{t("due")}</span>
                <span>{formatMoney(dueAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>{t("change")}</span>
                <span>{formatMoney(changeAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>{t("total")}</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 overflow-hidden rounded border border-gray-200 text-sm font-bold">
              <button
                type="button"
                onClick={openCartDiscountDialog}
                className="flex min-h-16 flex-col items-center justify-center gap-1 border-r bg-gray-50 px-2 py-2 text-gray-700 hover:bg-gray-100"
              >
                <Percent className="size-5" />
                {t("Discount")}
              </button>
              <button
                type="button"
                disabled={!cartItems.length || isHoldingSale}
                onClick={() => setIsHoldReferenceDialogOpen(true)}
                className="flex min-h-16 flex-col items-center justify-center gap-1 border-r bg-blue-600 px-2 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Pause className="size-5" />
                {isHoldingSale ? t("Saving") : t("Hold")}
              </button>
              <button
                type="button"
                disabled={!cartItems.length || isCreatingSale}
                onClick={handleOpenPaymentDialog}
                className="flex min-h-16 flex-col items-center justify-center gap-1 border-r bg-green-600 px-2 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CreditCard className="size-5" />
                {isCreatingSale ? t("Completing") : t("Pay")}
              </button>
              <button
                type="button"
                onClick={handleVoidCart}
                className="flex min-h-16 flex-col items-center justify-center gap-1 bg-red-600 px-2 py-2 text-white hover:bg-red-700"
              >
                <Ban className="size-5" />
                {t("Void")}
              </button>
            </div>
            </div>
          </div>
          </div>
          </div>
        </div>
      ) : null}

      <Dialog open={isProductSearchOpen} onOpenChange={setIsProductSearchOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Search Product")}</DialogTitle>
            <DialogDescription>
              {t("Search and select a product to add to the current cart.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-[360px] flex-col overflow-hidden">
            <div className="border-b pb-3">
              <div className="flex overflow-hidden rounded border-2 border-gray-200">
                <input
                  value={productSearchTerm}
                  onChange={(event) => setProductSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleProductSearch()
                    }
                    if (event.key === "Escape") {
                      setIsProductSearchOpen(false)
                    }
                  }}
                  placeholder={t("Search Product")}
                  autoFocus
                  className="min-w-0 flex-auto p-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleProductSearch}
                  className="border-l px-3 text-sm font-semibold hover:bg-gray-50"
                >
                  {productSearchState.isLoading ? <Spinner /> : t("Search")}
                </button>
              </div>
            </div>
            <div className="relative flex-auto overflow-y-auto">
              {productSearchResults.length ? (
                <ul>
                  {productSearchResults.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => handleProductSearchPick(product)}
                        className="flex w-full cursor-pointer justify-between border-b p-2 text-left hover:bg-gray-50"
                      >
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900">{product.name}</h2>
                          <small className="text-xs text-gray-500">{product.sku || t("Unassigned")}</small>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-2 text-center text-sm text-gray-500">
                  {t("There is nothing to display. Have you started the search ?")}
                </p>
              )}
              {productSearchState.isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50">
                  <Spinner />
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="h-[92vh] max-w-6xl overflow-hidden p-0">
          <DialogTitle className="sr-only">{t("Payment")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("Complete the payment for the current order.")}
          </DialogDescription>
          <div className="flex h-full flex-col overflow-hidden lg:flex-row">
            <div className="flex w-full shrink-0 items-center justify-between border-b bg-gray-50 px-3 py-2 lg:h-full lg:w-60 lg:flex-col lg:items-stretch lg:border-b-0 lg:border-r">
              <h3 className="text-lg font-bold">
                {t("Gateway")}
                {activePaymentLabel ? `: ${activePaymentLabel}` : ""}
              </h3>
              <div className="hidden flex-1 py-4 lg:block">
                {paymentTypeOptions.length ? (
                  <ul className="space-y-1">
                    {paymentTypeOptions.map((payment: any) => {
                      const identifier = payment.value || payment.identifier
                      return (
                        <li key={identifier}>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePaymentType(identifier)
                              setShowPaymentList(false)
                            }}
                            className={[
                              "w-full rounded px-3 py-2 text-left text-sm font-semibold hover:bg-white",
                              activePaymentType === identifier && !showPaymentList
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-gray-700",
                            ].join(" ")}
                          >
                            {payment.label}
                          </button>
                        </li>
                      )
                    })}
                    <li className="border-t pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPaymentList(true)}
                        className={[
                          "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-semibold hover:bg-white",
                          showPaymentList ? "bg-white text-blue-700 shadow-sm" : "text-gray-700",
                        ].join(" ")}
                      >
                        <span>{t("Payment List")}</span>
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-600 px-2 text-xs text-white">
                          {paymentsRows.filter((row) => money(row.amount) > 0).length}
                        </span>
                      </button>
                    </li>
                  </ul>
                ) : null}
              </div>
              <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)}>
                {t("Close")}
              </Button>
            </div>

            <div className="flex min-h-0 flex-auto flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-xl font-bold">
                  {showPaymentList ? t("List Of Payments") : activePaymentLabel}
                </h3>
                <div className="lg:hidden">
                  <UniFieldSelect
                    value={showPaymentList ? "payment-list" : activePaymentType}
                    onValueChange={(value) => {
                      if (value === "payment-list") {
                        setShowPaymentList(true)
                      } else {
                        setActivePaymentType(value)
                        setShowPaymentList(false)
                      }
                    }}
                    placeholder={t("Payment Type")}
                  >
                    {paymentTypeOptions.map((payment: any) => (
                      <SelectItem
                        key={payment.value || payment.identifier}
                        value={payment.value || payment.identifier}
                      >
                        {payment.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="payment-list">{t("Payment List")}</SelectItem>
                  </UniFieldSelect>
                </div>
              </div>

              {!paymentTypeOptions.length ? (
                <div className="flex flex-auto items-center justify-center p-6 text-center">
                  <div>
                    <h3 className="text-3xl font-bold">{t("Unable to Proceed")}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {t("Your system doesn't have any valid Payment Type. Consider creating one and try again.")}
                    </p>
                  </div>
                </div>
              ) : showPaymentList ? (
                <div className="flex-auto overflow-y-auto p-4">
                  <h3 className="py-2 text-center font-bold">{t("List Of Payments")}</h3>
                  <ul className="space-y-2">
                    {paymentsRows.filter((row) => money(row.amount) > 0).length ? (
                      paymentsRows
                        .filter((row) => money(row.amount) > 0)
                        .map((row) => (
                          <li
                            key={row.id}
                            className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-3"
                          >
                            <span className="font-semibold">
                              {
                                paymentTypeOptions.find(
                                  (payment: any) =>
                                    (payment.value || payment.identifier) === row.payment_type
                                )?.label || row.payment_type
                              }
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{formatMoney(row.amount)}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => removePaymentRow(row.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </li>
                        ))
                    ) : (
                      <li className="p-2 text-center font-semibold">
                        {t("No Payment added.")}
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="flex-auto overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex h-16 items-center justify-between border bg-blue-50 p-2 text-xl font-bold text-blue-950">
                      <span>{t("Total")}:</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={openCartDiscountDialog}
                      className="flex h-16 items-center justify-between border bg-red-50 p-2 text-xl font-bold text-red-700"
                    >
                      <span>{t("Discount")}:</span>
                      <span>{formatMoney(cartDiscount)}</span>
                    </button>
                    <div className="flex h-16 items-center justify-between border bg-green-50 p-2 text-xl font-bold text-green-700">
                      <span>{t("Paid")}:</span>
                      <span>{formatMoney(totalPaid)}</span>
                    </div>
                    <div className="flex h-16 items-center justify-between border bg-amber-50 p-2 text-xl font-bold text-amber-700">
                      <span>{t("Change")}:</span>
                      <span>{formatMoney(changeAmount)}</span>
                    </div>
                    <div className="col-span-2 flex h-16 items-center justify-between border bg-gray-50 p-2 text-xl font-bold">
                      <span>{t("Screen")}:</span>
                      <span>{formatMoney(paymentAmountInput || 0)}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
                    <UniFieldInput
                      label={t("Amount")}
                      value={paymentAmountInput}
                      onChange={(event) => setPaymentAmountInput(event.target.value)}
                      type="number"
                      min="0"
                      prefix={posOptions.currency_symbol}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => addPaymentFromPopup(money(paymentAmountInput))}
                      >
                        {t("Add Payment")}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[5, 10, 20, 50].map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setPaymentAmountInput(String(money(paymentAmountInput) + amount))
                        }
                      >
                        {formatMoney(amount)}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      className="col-span-2 md:col-span-4"
                      onClick={makeFullPaymentFromPopup}
                    >
                      {t("Full Payment")}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t p-3">
                {totalPaid >= subtotal ? (
                  <Button onClick={() => handleCompleteSale()} disabled={isCreatingSale}>
                    {isCreatingSale ? <Spinner /> : t("Submit Payment")}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleCompleteSale({ paymentStatus: "unpaid" })}
                      disabled={isCreatingSale || (!ordersAllowUnpaid && !ordersAllowPartial)}
                    >
                      {totalPaid === 0
                        ? `${t("Layaway")} - ${formatMoney(subtotal)}`
                        : t("Update")}
                    </Button>
                    {totalPaid === 0 ? (
                      <Button
                        variant="outline"
                        onClick={handleSaveAsUnpaid}
                        disabled={isCreatingSale || !ordersAllowUnpaid}
                      >
                        {t("Save As Unpaid")}
                      </Button>
                    ) : null}
                  </>
                )}
                <Button variant="outline" onClick={() => setShowPaymentList(true)}>
                  {t("Payment List")}
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs text-white">
                    {paymentsRows.filter((row) => money(row.amount) > 0).length}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpenShiftDialogOpen}
        onOpenChange={(open) => {
          if (shift) setIsOpenShiftDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("open_cashier_shift")}</DialogTitle>
            <DialogDescription>
              {t("open_shift_description")}
            </DialogDescription>
          </DialogHeader>
          <UniFieldSelect
            label={t("cash_register")}
            value={selectedRegisterId}
            onValueChange={setSelectedRegisterId}
            placeholder={t("select_cash_register")}
            required
          >
            {registerOptions.map((register: any) => (
              <SelectItem key={register.id} value={String(register.id)}>
                {register.name}
                {register.location ? ` - ${register.location}` : ""}
              </SelectItem>
            ))}
          </UniFieldSelect>
          {!isRegistersLoading && registerOptions.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">{t("no_register_available")}</p>
              <p className="mt-1">
                {t("create_register_msg")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 bg-white"
                onClick={() => router.push("/registers")}
              >
                {t("create_cash_register")}
              </Button>
            </div>
          ) : null}
          <UniFieldInput
            label={t("opening_cash")}
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
            placeholder={t("Enter opening cash")}
            prefix={posOptions.currency_symbol}
            type="number"
          />
          <UniFieldInput
            as="textarea"
            label={t("note")}
            value={openingNote}
            onChange={(event) => setOpeningNote(event.target.value)}
            placeholder={t("opening_note")}
          />
          <DialogFooter>
            <Button
              onClick={handleOpenShift}
              disabled={isOpeningShift || !selectedRegisterId}
            >
              {isOpeningShift ? t("opening") : t("open_shift")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={shiftAction === "cash_in" || shiftAction === "cash_out"}
        onOpenChange={(open) => {
          if (!open) {
            setShiftAction(null)
            setMovementAmount("")
            setMovementNote("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {shiftAction === "cash_out" ? t("cash_movement_title_out") : t("cash_movement_title_in")}
            </DialogTitle>
            <DialogDescription>
              {shiftAction === "cash_out"
                ? t("cash_movement_desc_out")
                : t("cash_movement_desc_in")}
            </DialogDescription>
          </DialogHeader>
          <UniFieldInput
            label={t("amount")}
            value={movementAmount}
            onChange={(event) => setMovementAmount(event.target.value)}
            placeholder={t("Enter amount")}
            prefix={posOptions.currency_symbol}
            type="number"
          />
          <UniFieldInput
            as="textarea"
            label={t("note")}
            value={movementNote}
            onChange={(event) => setMovementNote(event.target.value)}
            placeholder={t("why_cash_moving")}
          />
          <DialogFooter>
            <Button
              onClick={handleCashMovement}
              disabled={isCashingIn || isCashingOut}
            >
              {isCashingIn || isCashingOut
                ? t("saving")
                : shiftAction === "cash_out"
                  ? t("record_cash_out")
                  : t("record_cash_in")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={shiftAction === "close"}
        onOpenChange={(open) => {
          if (!open) {
            setShiftAction(null)
            setDeclaredCash("")
            setClosingNote("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("close_shift_dialog_title")}</DialogTitle>
            <DialogDescription>
              {t("expected_cash_prefix")} {formatMoney(shift?.expected_cash || 0)}.
              {t("physical_cash_desc")}
            </DialogDescription>
          </DialogHeader>
          <UniFieldInput
            label={t("declared_cash")}
            value={declaredCash}
            onChange={(event) => setDeclaredCash(event.target.value)}
            placeholder={t("Enter counted cash")}
            prefix={posOptions.currency_symbol}
            type="number"
          />
          <UniFieldInput
            as="textarea"
            label={t("closing_note")}
            value={closingNote}
            onChange={(event) => setClosingNote(event.target.value)}
            placeholder={t("optional_closing_note")}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleCloseShift}
              disabled={isClosingShift || declaredCash === ""}
            >
              {isClosingShift ? t("closing") : t("close_shift_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHeldCartDialogOpen} onOpenChange={setIsHeldCartDialogOpen}>
        <DialogContent className="flex h-[75vh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t("Orders")}</DialogTitle>
            <DialogDescription>
              {t("Review held, unpaid, and partially paid orders.")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-auto flex-col overflow-hidden">
            <div className="flex border-b">
              {[
                { value: "hold", label: t("On Hold") },
                { value: "unpaid", label: t("Unpaid") },
                { value: "partially_paid", label: t("Partially Paid") },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handlePendingTabChange(tab.value as "hold" | "unpaid" | "partially_paid")}
                  className={[
                    "px-4 py-2 text-sm font-semibold",
                    pendingOrdersTab === tab.value ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-600",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-1">
              <div className="flex overflow-hidden rounded border-2 border-gray-200">
                <input
                  value={pendingOrderSearch}
                  onChange={(event) => setPendingOrderSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleSearchPendingOrders()
                    }
                  }}
                  className="min-w-0 flex-auto p-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleSearchPendingOrders}
                  className="w-20 border-l text-sm font-semibold hover:bg-gray-50"
                >
                  {t("Search")}
                </button>
              </div>
            </div>

            <div className="flex-auto overflow-y-auto p-2">
              {pendingOrders.length ? (
                pendingOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="border-b py-3"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {order.title || order.code || t("Untitled Order")}
                    </h3>
                    <div className="mt-2 grid gap-2 px-2 text-sm text-gray-700 md:grid-cols-2">
                      <div className="space-y-1">
                        <p><strong>{t("Code")}</strong>: {order.code || "-"}</p>
                        <p><strong>{t("Cashier")}</strong>: {order.user__full_name || order.user_username || order.author_username || "-"}</p>
                        <p><strong>{t("Total")}</strong>: {formatMoney(order.total || 0)}</p>
                        <p><strong>{t("Tendered")}</strong>: {formatMoney(order.tendered_amount || order.tendered || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <p><strong>{t("Customer")}</strong>: {order.customer__full_name || order.customer__name || order.customer?.name || t("Walk-in Customer")}</p>
                        <p><strong>{t("Date")}</strong>: {order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</p>
                        <p><strong>{t("Type")}</strong>: {order.order_type || order.type || "-"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <div className="flex overflow-hidden rounded-lg border">
                        <button
                          type="button"
                          onClick={() => handleOpenPendingOrder(order)}
                          className="bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          {t("Open")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewPendingOrder(order)}
                          className="bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          {t("Products")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintPendingOrder(order)}
                          className="bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          {t("Print")}
                        </button>
                        {pendingOrdersTab === "hold" ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteHeldSale(order.id)}
                            className="bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            {t("delete")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center">
                  <h3 className="font-semibold text-gray-500">{t("Nothing to display...")}</h3>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHeldCartDialogOpen(false)}>
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHoldReferenceDialogOpen} onOpenChange={setIsHoldReferenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Hold Order")}</DialogTitle>
            <DialogDescription>
              {t("Set a reference before placing the current order on hold.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex h-16 items-center justify-center border-b text-4xl font-bold">
              {formatMoney(subtotal)}
            </div>
            <UniFieldInput
              label={t("Order Reference")}
              value={holdReference}
              onChange={(event) => setHoldReference(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleHoldSale()
                }
              }}
              placeholder={t("Order Reference")}
              autoFocus
            />
            <p className="text-sm text-gray-500">
              {t("The current order will be set on hold. You can retrieve this order from the pending order button. Providing a reference to it might help you to identify the order more quickly.")}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHoldReferenceDialogOpen(false)}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleHoldSale} disabled={isHoldingSale}>
              {isHoldingSale ? <Spinner /> : t("Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewPendingOrder)}
        onOpenChange={(open) => {
          if (!open) setPreviewPendingOrder(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("Products")}</DialogTitle>
            <DialogDescription>
              {previewPendingOrder?.code || previewPendingOrder?.title || t("Untitled Order")}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto">
            {(
              previewPendingOrder?.items ||
              previewPendingOrder?.products ||
              []
            ).length ? (
              (
                previewPendingOrder?.items ||
                previewPendingOrder?.products ||
                []
              ).map((item: any, index: number) => (
                <div
                  key={`${item.id || item.product_id || index}`}
                  className="flex items-center justify-between border-b py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {item.product_name || item.name || item.product?.name || t("Product")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("Quantity")}: {item.quantity || item.qty || 0}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatMoney(item.total_price || item.total || item.unit_price || 0)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-sm text-gray-500">
                {t("Nothing to display...")}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPendingOrder(null)}>
              {t("Close")}
            </Button>
            {previewPendingOrder ? (
              <Button
                onClick={() => {
                  const order = previewPendingOrder
                  setPreviewPendingOrder(null)
                  handleOpenPendingOrder(order)
                }}
              >
                {t("Open")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Unit Quantity Picker Dialog */}
      <Dialog open={isUnitPickerOpen} onOpenChange={(open) => {
        setIsUnitPickerOpen(open)
        if (!open) setUnitPickerProduct(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Select Selling Unit")}</DialogTitle>
            <DialogDescription>
              {t("Choose the unit you want to add for")} <strong>{unitPickerProduct?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(unitPickerProduct?.unit_quantities || []).map((uq) => (
              <button
                key={uq.id}
                onClick={() => {
                  setIsUnitPickerOpen(false)
                  setUnitPickerProduct(null)
                  if (unitPickerProduct) {
                    openQuantityDialog(unitPickerProduct, uq)
                  }
                }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <span>{uq.unit_name || uq.unit_short_name || uq.unit_identifier || `${t("Unit")} ${uq.id}`}</span>
                <span className="text-blue-600">{formatMoney(getDisplayPrice(uq))}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingCartProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingCartProduct(null)
            setQuantityInput("1")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Define Quantity")}</DialogTitle>
            <DialogDescription>
              {pendingCartProduct?.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex h-24 items-center justify-center rounded bg-blue-50 text-3xl font-bold text-blue-950">
              {quantityInput || "0"}
            </div>
            <UniFieldInput
              label={t("Quantity")}
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
              type="number"
              step={allowDecimalQuantities ? "0.01" : "1"}
              min="0"
            />
            {pendingCartProduct?.unitQuantity ? (
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700">
                <div className="flex justify-between">
                  <span>{t("Unit")}</span>
                  <span>
                    {pendingCartProduct.unitQuantity.unit_name ||
                      pendingCartProduct.unitQuantity.unit_short_name ||
                      pendingCartProduct.unitQuantity.unit_identifier ||
                      `${t("Unit")} ${pendingCartProduct.unitQuantity.id}`}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>{t("Available")}</span>
                  <span>{pendingCartProduct.unitQuantity.quantity}</span>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingCartProduct(null)
                setQuantityInput("1")
              }}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleConfirmQuantity}>
              {t("Apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(priceEditItem)}
        onOpenChange={(open) => {
          if (!open) {
            setPriceEditItem(null)
            setPriceInput("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Product Price")}</DialogTitle>
            <DialogDescription>
              {priceEditItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex h-16 items-center justify-center rounded bg-blue-50 text-2xl font-bold text-blue-950">
              {formatMoney(priceInput || priceEditItem?.price || 0)}
            </div>
            <UniFieldInput
              label={t("Price")}
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              type="number"
              min="0"
              prefix={posOptions.currency_symbol}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPriceEditItem(null)
                setPriceInput("")
              }}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleApplyProductPrice}>
              {t("Apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Comments")}</DialogTitle>
            <DialogDescription>
              {t("Add a note to the current order.")}
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={saleNote}
            onChange={(event) => setSaleNote(event.target.value)}
            placeholder={t("add_note_placeholder")}
            className="min-h-32 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={() => setIsNoteDialogOpen(false)}>
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCouponsDialogOpen} onOpenChange={setIsCouponsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Coupons")}</DialogTitle>
            <DialogDescription>
              {t("Input the coupon code that should apply to the POS. If a coupon is issued for a customer, that customer must be selected priorly.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <UniFieldSelect
              label={t("suggested_coupon")}
              value={selectedCouponId}
              onValueChange={setSelectedCouponId}
              placeholder={t("choose_coupon")}
              allowClear
            >
              {couponOptions.map((coupon: { id: number | string; name?: string; code?: string }) => (
                <SelectItem key={coupon.id} value={String(coupon.id)}>
                  {coupon.name} - {coupon.code}
                </SelectItem>
              ))}
            </UniFieldSelect>
            <UniFieldInput
              label={t("coupon_codes")}
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              placeholder={t("coupon_codes_placeholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCouponsDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={() => setIsCouponsDialogOpen(false)}>
              {t("Apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickProductDialogOpen} onOpenChange={setIsQuickProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Product / Service")}</DialogTitle>
            <DialogDescription>
              {t("Create a quick product or service for the current sale.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <UniFieldInput
              label={t("Name")}
              value={quickProductForm.name}
              onChange={(event) => updateQuickProductForm("name", event.target.value)}
              autoFocus
              required
            />
            <UniFieldSelect
              label={t("Product Type")}
              value={quickProductForm.product_type}
              onValueChange={(value) => updateQuickProductForm("product_type", value)}
              required
            >
              <SelectItem value="product">{t("Normal")}</SelectItem>
              <SelectItem value="dynamic">{t("Dynamic")}</SelectItem>
            </UniFieldSelect>

            {quickProductForm.product_type === "dynamic" ? (
              <UniFieldInput
                label={t("Rate")}
                value={quickProductForm.rate}
                onChange={(event) => updateQuickProductForm("rate", event.target.value)}
                type="number"
                min="0"
                required
              />
            ) : (
              <>
                <UniFieldInput
                  label={t("Unit Price")}
                  value={quickProductForm.unit_price}
                  onChange={(event) => updateQuickProductForm("unit_price", event.target.value)}
                  type="number"
                  min="0"
                  prefix={posOptions.currency_symbol}
                  required
                />
                <UniFieldInput
                  label={t("Quantity")}
                  value={quickProductForm.quantity}
                  onChange={(event) => updateQuickProductForm("quantity", event.target.value)}
                  type="number"
                  min="0"
                  required
                />
                <UniFieldSelect
                  label={t("Unit")}
                  value={quickProductForm.unit_id}
                  onValueChange={(value) => updateQuickProductForm("unit_id", value)}
                  placeholder={isUnitsLoading ? t("Loading") : t("Unit")}
                  required
                >
                  {unitOptions.map((unit: any) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
                <UniFieldSelect
                  label={t("Tax Type")}
                  value={quickProductForm.tax_type || "disabled"}
                  onValueChange={(value) =>
                    updateQuickProductForm("tax_type", value === "disabled" ? "" : value)
                  }
                >
                  <SelectItem value="disabled">{t("Disabled")}</SelectItem>
                  <SelectItem value="inclusive">{t("Inclusive")}</SelectItem>
                  <SelectItem value="exclusive">{t("Exclusive")}</SelectItem>
                </UniFieldSelect>
                <UniFieldSelect
                  label={t("Tax Group")}
                  value={quickProductForm.tax_group_id}
                  onValueChange={(value) => updateQuickProductForm("tax_group_id", value)}
                  placeholder={t("Tax Group")}
                >
                  {taxGroupOptions.map((group: any) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetQuickProductForm()
                setIsQuickProductDialogOpen(false)
              }}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleCreateQuickProduct} disabled={isCreatingQuickProduct}>
              {isCreatingQuickProduct ? <Spinner /> : t("Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderSettingsOpen} onOpenChange={setIsOrderSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Settings")}</DialogTitle>
            <DialogDescription>
              {t("Change the current order settings.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <UniFieldSelect
              label={t("order_type")}
              value={activeOrderType}
              onValueChange={setOrderType}
              placeholder={t("order_type_select")}
            >
              {enabledOrderTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </UniFieldSelect>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderSettingsOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={() => setIsOrderSettingsOpen(false)}>
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaxesDialogOpen} onOpenChange={setIsTaxesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Tax & Summary")}</DialogTitle>
            <DialogDescription>
              {t("Set the taxes to apply to the cart.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {["variable_vat", "products_variable_vat"].includes(String(posOptions.pos_vat)) ? (
              <div className="space-y-3 rounded border border-gray-200 bg-white p-3">
                <UniFieldSelect
                  label={t("Select Tax")}
                  value={cartTaxGroupId}
                  onValueChange={setCartTaxGroupId}
                  placeholder={t("Select Tax")}
                >
                  {taxGroupOptions.map((group: any) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
                <UniFieldSelect
                  label={t("Type")}
                  value={cartTaxType}
                  onValueChange={setCartTaxType}
                  placeholder={t("Type")}
                >
                  <SelectItem value="exclusive">{t("Exclusive")}</SelectItem>
                  <SelectItem value="inclusive">{t("Inclusive")}</SelectItem>
                </UniFieldSelect>
              </div>
            ) : (
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700">
                <div className="flex justify-between">
                  <span>{t("Tax Type")}</span>
                  <span>{cartTaxType || "-"}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>{t("Tax Group")}</span>
                  <span>
                    {taxGroupOptions.find((group: any) => String(group.id) === cartTaxGroupId)?.name ||
                      cartTaxGroupId ||
                      "-"}
                  </span>
                </div>
              </div>
            )}
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <div className="flex justify-between font-semibold">
                <span>{t("Summary")}</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>{t("VAT")}</span>
                <span>{String(posOptions.pos_vat || "disabled")}</span>
              </div>
              {posOptions.pos_vat === "products_vat" ? (
                <div className="mt-2 flex justify-between">
                  <span>{t("Product Taxes")}</span>
                  <span>{t("Applied from products")}</span>
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            {["variable_vat", "products_variable_vat"].includes(String(posOptions.pos_vat)) ? (
              <Button onClick={() => setIsTaxesDialogOpen(false)}>
                {t("Save")}
              </Button>
            ) : null}
            <Button onClick={() => setIsTaxesDialogOpen(false)}>
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCartDiscountDialogOpen} onOpenChange={setIsCartDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Cart Discount")}</DialogTitle>
            <DialogDescription>
              {t("Apply a flat or percentage discount to the cart subtotal.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <UniFieldSelect
              label={t("Discount Type")}
              value={cartDiscountType}
              onValueChange={(val) => setCartDiscountType(val as "flat" | "percentage")}
              placeholder={t("Select discount type")}
              required
            >
              <SelectItem value="flat">{t("Flat Amount")} ({posOptions.currency_symbol})</SelectItem>
              <SelectItem value="percentage">{t("Percentage")} (%)</SelectItem>
            </UniFieldSelect>
            <UniFieldInput
              label={t("Discount Value")}
              value={cartDiscountVal}
              onChange={(event) => setCartDiscountVal(event.target.value)}
              placeholder={t("Enter discount value")}
              type="number"
              prefix={cartDiscountType === "flat" ? posOptions.currency_symbol : "%"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCartDiscountDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleApplyCartDiscount}>
              {t("Apply Discount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Discount Dialog */}
      <Dialog
        open={activeDiscountItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDiscountItem(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Item Discount")}</DialogTitle>
            <DialogDescription>
              {t("Apply a flat or percentage discount to")} <strong>{activeDiscountItem?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <UniFieldSelect
              label={t("Discount Type")}
              value={itemDiscountType}
              onValueChange={(val) => setItemDiscountType(val as "flat" | "percentage")}
              placeholder={t("Select discount type")}
              required
            >
              <SelectItem value="flat">{t("Flat Amount")} ({posOptions.currency_symbol})</SelectItem>
              <SelectItem value="percentage">{t("Percentage")} (%)</SelectItem>
            </UniFieldSelect>

            <UniFieldInput
              label={t("Discount Value")}
              value={itemDiscountVal}
              onChange={(e) => setItemDiscountVal(e.target.value)}
              placeholder={t("Enter discount value")}
              type="number"
              prefix={itemDiscountType === "flat" ? posOptions.currency_symbol : "%"}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDiscountItem(null)}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleApplyItemDiscount}>
              {t("Apply Discount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </DashboardPage>
  )
}
