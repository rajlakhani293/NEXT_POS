"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChevronRight,
  Folder,
  Home,
  LogOut,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
  product_id: string
  unit_quantity_id?: string
  unit_id?: string
  unit_label?: string
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

type POSProduct = {
  id: number
  name: string
  sku?: string
  pinned?: boolean
  stock_management?: string
  type?: string
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


export default function SalesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const loadedRef = useRef(false)
  const loadedShiftRef = useRef("")
  const loadedRewardCustomerRef = useRef("")
  const posOptions = usePosOptions()
  const cashRegistersEnabled = posOptions.enable_cash_registers
  const ordersAllowUnpaid = posOptions.orders_allow_unpaid
  const allowDecimalQuantities = posOptions.allow_decimal_quantities
  const showQuantity = posOptions.show_quantity
  const hideEmptyCategories = posOptions.hide_empty_categories
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
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentsRows, setPaymentsRows] = useState<PaymentRow[]>([
    emptyPaymentRow(),
  ])
  const [isHeldCartDialogOpen, setIsHeldCartDialogOpen] = useState(false)
  const [activeDiscountItem, setActiveDiscountItem] = useState<CartItem | null>(null)
  const [itemDiscountVal, setItemDiscountVal] = useState("")
  const [itemDiscountType, setItemDiscountType] = useState<"flat" | "percentage">("flat")


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
  const rewardBalances = rewardBalanceState.data?.data || []
  const redeemableReward = rewardBalances.find(
    (balance: any) =>
      Number(balance.points || 0) >= Number(balance.target_points || 0) &&
      Number(balance.target_points || 0) > 0
  )
  const heldSales = heldSalesState.data?.data?.items || []

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + (item.qty * item.price - getCartItemDiscount(item)),
        0
      ),
    [cartItems]
  )

  const couponCodes = useMemo(() => parseCouponCodes(couponInput), [couponInput])
  const totalPaid = useMemo(
    () =>
      paymentsRows.reduce((sum, row) => sum + money(row.amount), 0),
    [paymentsRows]
  )
  const dueAmount = Math.max(subtotal - totalPaid, 0)
  const changeAmount = Math.max(totalPaid - subtotal, 0)

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
    loadGrid()
  }, [
    getCouponsDropdown,
    getCurrentShift,
    getCustomersDropdown,
    getPaymentTypesDropdown,
    loadGrid,
  ])

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

  useEffect(() => {
    if (!subtotal) {
      setPaymentsRows((current) =>
        current.map((row, index) =>
          index === 0 ? { ...row, amount: "" } : row
        )
      )
      return
    }

    setPaymentsRows((current) => {
      if (!current.length) {
        return [{ ...emptyPaymentRow(), amount: subtotal.toFixed(2) }]
      }
      if (current.some((row) => row.amount)) return current
      return current.map((row, index) =>
        index === 0 ? { ...row, amount: subtotal.toFixed(2) } : row
      )
    })
  }, [subtotal])

  const handleOpenShift = async () => {
    if (!selectedRegisterId) {
      showToast.error("Please select a cash register.")
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
    showToast.success(response?.message || "Shift opened successfully.")
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
      showToast.error("Amount must be greater than 0.")
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
    showToast.success(response?.message || "Cash movement recorded.")
  }

  const addProductToCart = (product: POSProduct | any, unitQuantity?: POSUnitQuantity | any, initialQty = 1) => {
    if (!product) return false
    const stockManaged =
      product.stock_management !== "disabled" && product.type !== "dematerialized"

    if (stockManaged && !unitQuantity?.id) {
      showToast.error("Select a selling unit before adding this product.")
      return false
    }

    const price = Number(unitQuantity?.sale_price || 0)
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
      if (existing) {
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
          product_id: String(product.id),
          unit_quantity_id: unitQuantityId || undefined,
          unit_id: unitQuantity?.unit_id
            ? String(unitQuantity.unit_id)
            : product.unit_id
              ? String(product.unit_id)
              : undefined,
          unit_label: unitLabel,
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
      // No unit quantities — add directly with price 0
      addProductToCart(product, undefined)
      return
    }
    if (unitQuantities.length === 1) {
      addProductToCart(product, unitQuantities[0])
      return
    }
    // Multiple units — open picker
    setUnitPickerProduct(product)
    setIsUnitPickerOpen(true)
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
      showToast.success(`${product.name} added to cart.`)
    }
  }

  const updateQuantity = (product_id: string, delta: number, unit_quantity_id = "") => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.product_id === product_id &&
          (item.unit_quantity_id || "") === unit_quantity_id
            ? { ...item, qty: Math.max(item.qty + delta, 0) }
            : item
        )
        .filter((item) => item.qty > 0)
    )
  }

  const removeItem = (product_id: string, unit_quantity_id = "") => {
    setCartItems((items) =>
      items.filter(
        (item) =>
          item.product_id !== product_id ||
          (item.unit_quantity_id || "") !== unit_quantity_id
      )
    )
  }

  const openItemDiscountDialog = (item: CartItem) => {
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
          (item.unit_quantity_id || "") === (activeDiscountItem.unit_quantity_id || "")
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

  const resetSaleForm = () => {

    setDraftId("")
    setCustomerId("")
    setBarcode("")
    setCouponInput("")
    setSelectedCouponId("")
    setOrderType("takeaway")
    setSaleNote("")
    setCartItems([])
    setPaymentsRows([emptyPaymentRow()])
  }

  const refreshHeldSales = async () => {
    await getHeldSalesData({
      page: 1,
      limit: 20,
      search: undefined,
    }).unwrap()
  }

  const handleOpenHeldSales = async () => {
    await refreshHeldSales()
    setIsHeldCartDialogOpen(true)
  }

  const handleResumeHeldSale = async (heldSaleId: number | string) => {
    const response = await getHeldSaleById({ id: heldSaleId }).unwrap()
    const heldSale = response?.data
    if (!heldSale) return

    setDraftId(String(heldSale.id))
    setCustomerId(heldSale.customer_id ? String(heldSale.customer_id) : "")
    setCouponInput((heldSale.coupon_codes || []).join(", "))
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
        unit_quantity_id: item.unit_quantity_id ? String(item.unit_quantity_id) : undefined,
        name: item.product_name,
        qty: Number(item.quantity || 0),
        price: Number(item.unit_price || 0),
        available_stock: 0,
        sku: item.sku,
      }))
    )
    setIsHeldCartDialogOpen(false)
    showToast.success("Held cart loaded successfully.")
  }

  const handleDeleteHeldSale = async (heldSaleId: number | string) => {
    const response = await deleteHeldSale({ id: heldSaleId }).unwrap()
    showToast.success(response?.message || "Held cart deleted successfully.")
    await refreshHeldSales()
  }

  const handleRedeemReward = async () => {
    if (!customerId) {
      showToast.error("Choose customer before redeeming reward.")
      return
    }
    if (!redeemableReward) {
      showToast.error("No redeemable reward balance for this customer.")
      return
    }
    const response = await redeemCustomerReward({
      customer_id: Number(customerId),
      reward_system_id: Number(redeemableReward.reward_system_id),
      points: Number(redeemableReward.target_points),
      note: "Redeemed from POS checkout.",
    }).unwrap()
    const couponCode = response?.data?.issued_coupon?.code
    if (couponCode) {
      setCouponInput((current) => {
        const existing = parseCouponCodes(current)
        if (existing.includes(couponCode)) return current
        return [...existing, couponCode].join(", ")
      })
      showToast.success(`Reward redeemed. Coupon ${couponCode} added.`)
    } else {
      showToast.success(response?.message || "Reward redeemed successfully.")
    }
    await getCustomerRewardBalance({ id: customerId })
  }

  const handleHoldSale = async () => {
    if (!cartItems.length) {
      showToast.error("Add at least one product before holding cart.")
      return
    }

    const payLoad = {
      customer_id: customerId ? Number(customerId) : null,
      coupon_codes: couponCodes,
      note: saleNote,
      items: cartItems.map((item) => ({
        product_id: Number(item.product_id),
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
    await refreshHeldSales()
  }

  const handleCompleteSale = async () => {
    if (cashRegistersEnabled && !shift?.id) {
      showToast.error("Open shift is required before billing.")
      return
    }
    if (!cartItems.length) {
      showToast.error("Add at least one product to cart.")
      return
    }
    if (ordersAllowUnpaid === false && totalPaid < subtotal) {
      showToast.error(`Unpaid or partially paid orders are not allowed. Total paid (₹${totalPaid.toFixed(2)}) is less than subtotal (₹${subtotal.toFixed(2)}).`)
      return
    }
    const validPayments = paymentsRows.filter((row) => money(row.amount) > 0)
    const payLoad = {
      draft_id: draftId ? Number(draftId) : null,
      customer_id: customerId ? Number(customerId) : null,
      shift_id: cashRegistersEnabled ? shift.id : null,
      order_type: orderType,
      note: saleNote,
      coupon_codes: couponCodes,
      items: cartItems.map((item) => ({
        product_id: Number(item.product_id),
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
    showToast.success(response?.message || "Sale created successfully.")
    resetSaleForm()
    await loadShift()
    if (sale?.id) {
      router.push(`/sales/${sale.id}`)
    }
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
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-gray-950">{t("sales_billing")}</h1>
          <p className="text-sm text-muted-foreground">
            {cashRegistersEnabled
              ? shift
                ? `${t("active_shift")}: ${shift.register_name || "Register"}`
                : t("open_shift_message")
              : t("registers_disabled_message")}
          </p>
        </div>
        {cashRegistersEnabled && shift ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={handleOpenHeldSales}>
              {t("held_carts")}
            </Button>
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
          </div>
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

      {!cashRegistersEnabled || shift ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
          {/* ======== LEFT: Product Grid ======== */}
          <div className="flex min-h-0 flex-col rounded-lg border border-gray-100 bg-white overflow-hidden">
            {/* Top bar: customer + barcode search */}
            <div className="flex flex-col sm:flex-row gap-3 border-b border-gray-100 p-3">
              <UniFieldSelect
                label={t("customer")}
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Walk-in customer"
                allowClear
                containerClassName="flex-1"
              >
                {customerOptions.map((customer: any) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name}
                    {customer.phone ? ` - ${customer.phone}` : ""}
                  </SelectItem>
                ))}
              </UniFieldSelect>

              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
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
                    className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBarcodeSearch}
                  disabled={!barcode.trim() || barcodeSearchState.isLoading}
                  className="shrink-0"
                >
                  {barcodeSearchState.isLoading ? <Spinner /> : t("search")}
                </Button>
              </div>
            </div>

            {/* Breadcrumb navigation */}
            <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <button
                onClick={() => navigateBreadcrumb(-1)}
                className="flex items-center gap-1 rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
              >
                <Home className="size-3.5" />
                <span>Home</span>
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
            {gridData.pinnedProducts.length > 0 && (
              <div className="border-b border-gray-100 bg-amber-50/60 px-3 py-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">Pinned</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gridData.pinnedProducts.map((product) => {
                    const uq = product.unit_quantities?.[0]
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleGridProductClick(product)}
                        className="group relative flex h-20 w-28 shrink-0 flex-col items-center justify-end overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition hover:border-amber-400 hover:shadow-md"
                      >
                        {product.galleries && product.galleries.length > 0 ? (
                          <img
                            src={(product.galleries.find((g) => g.featured) || product.galleries[0]).url}
                            alt={product.name}
                            className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition"
                          />
                        ) : (
                          <Package className="absolute top-2 size-8 text-gray-300" />
                        )}
                        <div className="relative z-10 w-full bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1.5 pt-4">
                          <p className="truncate text-center text-xs font-semibold text-white">{product.name}</p>
                          {uq && (
                            <div className="flex items-center justify-between text-[10px] text-amber-200">
                              <span>₹{Number(uq.sale_price).toFixed(2)}</span>
                              {showQuantity && <span>Qty: {uq.quantity}</span>}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Grid area: categories + products */}
            <div className="flex-1 overflow-y-auto p-3">
              {!gridLoading && gridData.categories.length === 0 && gridData.products.length === 0 && gridData.pinnedProducts.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                  <Package className="size-14 opacity-30" />
                  <p className="text-sm font-medium">No categories or products found.</p>
                  <p className="text-xs">Add products with <strong>displays_on_pos</strong> enabled.</p>
                </div>
              )}

              {/* Category tiles */}
              {gridData.categories.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {gridData.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => drillIntoCategory(category)}
                      className="group relative flex h-32 flex-col items-center justify-end overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-blue-400 hover:shadow-md"
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
              {gridData.products.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {gridData.products.map((product) => {
                    const uq = product.unit_quantities?.[0]
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleGridProductClick(product)}
                        className="group relative flex h-32 flex-col items-center justify-end overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-blue-400 hover:shadow-md"
                      >
                        {product.galleries && product.galleries.length > 0 ? (
                          <img
                            src={(product.galleries.find((g) => g.featured) || product.galleries[0]).url}
                            alt={product.name}
                            className="absolute inset-0 h-full w-full object-cover opacity-75 group-hover:opacity-100 transition"
                          />
                        ) : (
                          <Package className="absolute top-4 size-10 text-gray-200 group-hover:text-gray-300 transition" />
                        )}
                        <div className="relative z-10 w-full bg-gradient-to-t from-black/65 to-transparent px-2 pb-2 pt-6">
                          <p className="truncate text-center text-xs font-bold text-white">{product.name}</p>
                          {uq && (
                            <div className="flex items-center justify-between text-xs text-blue-200">
                              <span>₹{Number(uq.sale_price).toFixed(2)}</span>
                              {showQuantity && <span className="text-[10px] text-gray-300">Qty: {uq.quantity}</span>}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ======== RIGHT: Cart + Checkout ======== */}
          <div className="flex min-h-0 flex-col rounded-lg border border-gray-100 bg-white overflow-hidden">
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-[1.4fr_130px_110px_120px_56px] bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 sticky top-0">
                <span>{t("item")}</span>
                <span>{t("qty")}</span>
                <span>{t("price")}</span>
                <span>{t("total")}</span>
                <span />
              </div>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div
                    key={`${item.product_id}:${item.unit_quantity_id || "base"}`}
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
                              Discount: {item.discount_type === "percentage" ? `${item.discount_value}%` : `${item.discount_value}`} (-₹{getCartItemDiscount(item).toFixed(2)})
                            </span>
                          ) : (
                            "+ Add Discount"
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
                          updateQuantity(
                            item.product_id,
                            -1,
                            item.unit_quantity_id || ""
                          )
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
                                  i.product_id === item.product_id &&
                                  (i.unit_quantity_id || "") === (item.unit_quantity_id || "")
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
                          updateQuantity(
                            item.product_id,
                            1,
                            item.unit_quantity_id || ""
                          )
                        }
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <span>₹{item.price.toFixed(2)}</span>
                    <span>₹{(item.qty * item.price - getCartItemDiscount(item)).toFixed(2)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-500 hover:text-red-600"
                      onClick={() =>
                        removeItem(item.product_id, item.unit_quantity_id || "")
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
                value={orderType}
                onValueChange={setOrderType}
                placeholder={t("order_type_select")}
              >
                <SelectItem value="takeaway">{t("take_order")}</SelectItem>
                <SelectItem value="delivery">{t("delivery")}</SelectItem>
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
                        placeholder="0.00"
                        prefix="₹"
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
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("received")}</span>
                <span>₹{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>{t("due")}</span>
                <span>₹{dueAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>{t("change")}</span>
                <span>₹{changeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>{t("total")}</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              disabled={!cartItems.length || isHoldingSale}
              onClick={handleHoldSale}
            >
              {isHoldingSale ? t("saving") : t("hold_cart")}
            </Button>
            <Button
              className="mt-6 w-full"
              disabled={!cartItems.length || isCreatingSale}
              onClick={handleCompleteSale}
            >
              {isCreatingSale ? t("completing_sale") : t("complete_sale")}
            </Button>
            </div>
          </div>
        </div>
      ) : null}

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
            placeholder="Enter opening cash"
            prefix="₹"
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
            placeholder="Enter amount"
            prefix="₹"
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
              {t("expected_cash_prefix")} ₹{Number(shift?.expected_cash || 0).toFixed(2)}.
              {t("physical_cash_desc")}
            </DialogDescription>
          </DialogHeader>
          <UniFieldInput
            label={t("declared_cash")}
            value={declaredCash}
            onChange={(event) => setDeclaredCash(event.target.value)}
            placeholder="Enter counted cash"
            prefix="₹"
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("held_carts")}</DialogTitle>
            <DialogDescription>
              {t("held_carts_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[420px] space-y-3 overflow-auto">
            {heldSales.length ? (
              heldSales.map((heldSale: any) => (
                <div
                  key={heldSale.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{heldSale.code}</p>
                    <p className="text-sm text-slate-500">
                      {heldSale.customer?.name || heldSale.customer__name || "Walk-in customer"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {heldSale.total_items || 0} {t("item_s")} • ₹
                      {Number(heldSale.total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleResumeHeldSale(heldSale.id)}
                    >
                      {t("resume")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteHeldSale(heldSale.id)}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-slate-500">
                {t("no_held_carts")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Unit Quantity Picker Dialog */}
      <Dialog open={isUnitPickerOpen} onOpenChange={(open) => {
        setIsUnitPickerOpen(open)
        if (!open) setUnitPickerProduct(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Selling Unit</DialogTitle>
            <DialogDescription>
              Choose the unit you want to add for <strong>{unitPickerProduct?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(unitPickerProduct?.unit_quantities || []).map((uq) => (
              <button
                key={uq.id}
                onClick={() => {
                  if (unitPickerProduct) {
                    addProductToCart(unitPickerProduct, uq)
                  }
                  setIsUnitPickerOpen(false)
                  setUnitPickerProduct(null)
                }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <span>{uq.unit_name || uq.unit_short_name || uq.unit_identifier || `Unit ${uq.id}`}</span>
                <span className="text-blue-600">₹{Number(uq.sale_price).toFixed(2)}</span>
              </button>
            ))}
          </div>
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
            <DialogTitle>Item Discount</DialogTitle>
            <DialogDescription>
              Apply a flat or percentage discount to <strong>{activeDiscountItem?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <UniFieldSelect
              label="Discount Type"
              value={itemDiscountType}
              onValueChange={(val: any) => setItemDiscountType(val)}
              placeholder="Select discount type"
              required
            >
              <SelectItem value="flat">Flat Amount (₹)</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
            </UniFieldSelect>

            <UniFieldInput
              label="Discount Value"
              value={itemDiscountVal}
              onChange={(e) => setItemDiscountVal(e.target.value)}
              placeholder="Enter discount value"
              type="number"
              prefix={itemDiscountType === "flat" ? "₹" : "%"}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDiscountItem(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleApplyItemDiscount}>
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
