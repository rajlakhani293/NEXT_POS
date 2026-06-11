"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  LogOut,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
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
import { PERMISSIONS } from "@/lib/permissions"
import { useAppSelector } from "@/lib/redux/hooks"
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

export default function SalesPage() {
  const router = useRouter()
  const loadedRef = useRef(false)
  const loadedShiftRef = useRef("")
  const loadedRewardCustomerRef = useRef("")
  const cashRegistersEnabled = useAppSelector(
    (state) => state.session.businessSettings?.settings?.enable_cash_registers
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
  const [draftId, setDraftId] = useState("")
  const [productId, setProductId] = useState("")
  const [barcode, setBarcode] = useState("")
  const [selectedUnitQuantityId, setSelectedUnitQuantityId] = useState("")
  const [couponInput, setCouponInput] = useState("")
  const [selectedCouponId, setSelectedCouponId] = useState("")
  const [orderType, setOrderType] = useState("takeaway")
  const [saleNote, setSaleNote] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentsRows, setPaymentsRows] = useState<PaymentRow[]>([
    emptyPaymentRow(),
  ])
  const [isHeldCartDialogOpen, setIsHeldCartDialogOpen] = useState(false)

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
  const [getProductsDropdown, { data: productsData, isLoading: isProductsLoading }] =
    (catalog as any).useGetProductsDropdownMutation()
  const [getPaymentTypesDropdown, { data: paymentTypesData, isLoading: isPaymentTypesLoading }] =
    (payments as any).useGetPaymentTypesDropdownMutation()
  const [getCouponsDropdown, { data: couponsData, isLoading: isCouponsLoading }] =
    (promotions as any).useGetCouponsDropdownMutation()
  const [getProductUnitQuantities, unitQuantitiesState] = (
    catalog as any
  ).useGetProductUnitQuantitiesMutation()
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
  const productOptions = productsData?.data || []
  const paymentTypeOptions = paymentTypesData?.data || []
  const couponOptions = couponsData?.data || []
  const registerOptions = registersDropdownData?.data || []

  const selectedProduct = productOptions.find(
    (product: any) => String(product.id) === productId
  )
  const productUnitQuantities = unitQuantitiesState.data?.data || []
  const selectedUnitQuantity = productUnitQuantities.find(
    (unitQuantity: any) => String(unitQuantity.id) === selectedUnitQuantityId
  )
  const rewardBalances = rewardBalanceState.data?.data || []
  const redeemableReward = rewardBalances.find(
    (balance: any) =>
      Number(balance.points || 0) >= Number(balance.target_points || 0) &&
      Number(balance.target_points || 0) > 0
  )
  const heldSales = heldSalesState.data?.data?.items || []

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.qty * item.price, 0),
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

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    getCustomersDropdown()
    getProductsDropdown()
    getPaymentTypesDropdown()
    getCouponsDropdown()
  }, [
    getCouponsDropdown,
    getCurrentShift,
    getCustomersDropdown,
    getPaymentTypesDropdown,
    getProductsDropdown,
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

  useEffect(() => {
    setSelectedUnitQuantityId("")
    if (!productId) return
    getProductUnitQuantities({ productId })
  }, [getProductUnitQuantities, productId])

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

  const addProductToCart = (product: any, unitQuantity?: any) => {
    if (!product) return

    const price = Number(
      unitQuantity?.sale_price || product.selling_price || product.price || 0
    )
    const availableStock = Number(product.current_stock || 0)
    const unitQuantityId = unitQuantity?.id ? String(unitQuantity.id) : ""
    const unitLabel =
      unitQuantity?.unit_short_name ||
      unitQuantity?.unit_name ||
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
            ? { ...item, qty: item.qty + 1 }
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
          qty: 1,
          price,
          available_stock: availableStock,
          sku: product.sku,
        },
      ]
    })
  }

  const handleAddProduct = () => {
    if (!selectedProduct) return
    addProductToCart(selectedProduct, selectedUnitQuantity)
    setProductId("")
    setSelectedUnitQuantityId("")
  }

  const handleBarcodeSearch = async () => {
    const reference = barcode.trim()
    if (!reference) return
    const response = await searchProductUsingBarcode({ reference }).unwrap()
    const product = response?.data
    if (!product) return
    addProductToCart(product, product.matched_unit_quantity)
    setBarcode("")
    showToast.success(`${product.name} added to cart.`)
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

  const resetSaleForm = () => {
    setDraftId("")
    setCustomerId("")
    setProductId("")
    setBarcode("")
    setSelectedUnitQuantityId("")
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
        discount_amount: "0",
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
        discount_amount: "0",
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
    isProductsLoading ||
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
          Preparing sales screen...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-gray-950">Sales Billing</h1>
          <p className="text-sm text-muted-foreground">
            {cashRegistersEnabled
              ? shift
                ? `Active shift: ${shift.register_name || "Register"}`
                : "Open a shift before starting sales."
              : "Cash registers are disabled. Sales can be billed directly."}
          </p>
        </div>
        {cashRegistersEnabled && shift ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={handleOpenHeldSales}>
              Held Carts
            </Button>
            {hasPermission(PERMISSIONS.cashRegister.cashIn) ? (
              <Button
                variant="outline"
                onClick={() => setShiftAction("cash_in")}
              >
                <BanknoteArrowDown className="size-4" />
                Cash In
              </Button>
            ) : null}
            {hasPermission(PERMISSIONS.cashRegister.cashOut) ? (
              <Button
                variant="outline"
                onClick={() => setShiftAction("cash_out")}
              >
                <BanknoteArrowUp className="size-4" />
                Cash Out
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
                Close Shift
              </Button>
            ) : null}
          </div>
        ) : cashRegistersEnabled ? (
          hasPermission(PERMISSIONS.cashRegister.open) ? (
            <Button onClick={() => setIsOpenShiftDialogOpen(true)}>
              Open Shift
            </Button>
          ) : null
        ) : (
          <Button variant="outline" onClick={handleOpenHeldSales}>
            Held Carts
          </Button>
        )}
      </div>

      {!cashRegistersEnabled || shift ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
          <div className="min-h-0 rounded-lg border border-gray-100 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <UniFieldSelect
                label="Customer"
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Walk-in customer"
                allowClear
              >
                {customerOptions.map((customer: any) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name}
                    {customer.phone ? ` - ${customer.phone}` : ""}
                  </SelectItem>
                ))}
              </UniFieldSelect>

              <div className="flex items-end gap-2">
                <UniFieldInput
                  label="Barcode"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleBarcodeSearch()
                    }
                  }}
                  placeholder="Scan or enter barcode"
                  containerClassName="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBarcodeSearch}
                  disabled={!barcode.trim() || barcodeSearchState.isLoading}
                >
                  {barcodeSearchState.isLoading ? <Spinner /> : "Add"}
                </Button>
              </div>

              <div className="flex items-end gap-2">
                <UniFieldSelect
                  label="Product"
                  value={productId}
                  onValueChange={setProductId}
                  placeholder="Select product"
                  containerClassName="flex-1"
                >
                  {productOptions.map((product: any) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </UniFieldSelect>
                {productUnitQuantities.length ? (
                  <UniFieldSelect
                    label="Selling Unit"
                    value={selectedUnitQuantityId}
                    onValueChange={setSelectedUnitQuantityId}
                    placeholder="Base unit"
                    allowClear
                    containerClassName="w-44"
                  >
                    {productUnitQuantities.map((unitQuantity: any) => (
                      <SelectItem
                        key={unitQuantity.id}
                        value={String(unitQuantity.id)}
                      >
                        {unitQuantity.unit_name || unitQuantity.unit_short_name}
                      </SelectItem>
                    ))}
                  </UniFieldSelect>
                ) : null}
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!productId}
                  className="mb-0"
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border">
              <div className="grid grid-cols-[1.4fr_130px_110px_120px_56px] bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
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
                        SKU: {item.sku || "-"}
                        {item.unit_label ? ` · Unit: ${item.unit_label}` : ""}
                      </p>
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
                      <span className="min-w-6 text-center">{item.qty}</span>
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
                    <span>₹{(item.qty * item.price).toFixed(2)}</span>
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
                  <p className="text-sm font-semibold">No items in cart yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-4">
            <h2 className="text-base font-bold">Bill Summary</h2>

            <div className="mt-4 space-y-4">
              <UniFieldSelect
                label="Order Type"
                value={orderType}
                onValueChange={setOrderType}
                placeholder="Choose order type"
              >
                <SelectItem value="takeaway">Take Order</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </UniFieldSelect>

              <UniFieldSelect
                label="Suggested Coupon"
                value={selectedCouponId}
                onValueChange={setSelectedCouponId}
                placeholder="Choose coupon"
                allowClear
              >
                {couponOptions.map((coupon: any) => (
                  <SelectItem key={coupon.id} value={String(coupon.id)}>
                    {coupon.name} - {coupon.code}
                  </SelectItem>
                ))}
              </UniFieldSelect>

              <UniFieldInput
                label="Coupon Codes"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder="Enter coupon codes separated by comma"
              />

              {customerId ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-blue-950">
                        Customer Rewards
                      </p>
                      <p className="mt-1 text-xs font-medium text-blue-700">
                        {rewardBalanceState.isLoading
                          ? "Loading reward balance..."
                          : redeemableReward
                            ? `${redeemableReward.points} points available. Redeem ${redeemableReward.target_points} points for coupon.`
                            : "No redeemable points right now."}
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
                      {redeemRewardState.isLoading ? <Spinner /> : "Redeem"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Payments</p>
                  <Button type="button" variant="outline" size="sm" onClick={addPaymentRow}>
                    Add Payment
                  </Button>
                </div>
                {paymentsRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_140px_44px]">
                      <UniFieldSelect
                        label={index === 0 ? "Payment Type" : undefined}
                        value={row.payment_type}
                        onValueChange={(value) =>
                          updatePaymentRow(row.id, "payment_type", value)
                        }
                        placeholder="Choose payment type"
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
                        label={index === 0 ? "Amount" : undefined}
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
                        placeholder="Reference number"
                      />
                      <UniFieldInput
                        value={row.note}
                        onChange={(event) =>
                          updatePaymentRow(row.id, "note", event.target.value)
                        }
                        placeholder="Payment note"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <UniFieldInput
                label="Sale Note"
                value={saleNote}
                onChange={(event) => setSaleNote(event.target.value)}
                placeholder="Add note if needed"
              />
            </div>

            <div className="mt-6 space-y-3 text-sm font-semibold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Received</span>
                <span>₹{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>Due</span>
                <span>₹{dueAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Change</span>
                <span>₹{changeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              disabled={!cartItems.length || isHoldingSale}
              onClick={handleHoldSale}
            >
              {isHoldingSale ? "Saving..." : "Hold Cart"}
            </Button>
            <Button
              className="mt-6 w-full"
              disabled={!cartItems.length || isCreatingSale}
              onClick={handleCompleteSale}
            >
              {isCreatingSale ? "Creating Sale..." : "Complete Sale"}
            </Button>
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
            <DialogTitle>Open Cashier Shift</DialogTitle>
            <DialogDescription>
              Select a register and enter its opening drawer cash before billing.
            </DialogDescription>
          </DialogHeader>
          <UniFieldSelect
            label="Cash Register"
            value={selectedRegisterId}
            onValueChange={setSelectedRegisterId}
            placeholder="Select cash register"
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
              <p className="font-semibold">No cash register is available.</p>
              <p className="mt-1">
                Create a register before opening the sales screen.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 bg-white"
                onClick={() => router.push("/registers")}
              >
                Create Cash Register
              </Button>
            </div>
          ) : null}
          <UniFieldInput
            label="Opening Cash"
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
            placeholder="Enter opening cash"
            prefix="₹"
            type="number"
          />
          <UniFieldInput
            as="textarea"
            label="Note"
            value={openingNote}
            onChange={(event) => setOpeningNote(event.target.value)}
            placeholder="Optional opening note"
          />
          <DialogFooter>
            <Button
              onClick={handleOpenShift}
              disabled={isOpeningShift || !selectedRegisterId}
            >
              {isOpeningShift ? "Opening..." : "Open Shift"}
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
              {shiftAction === "cash_out" ? "Cash Out" : "Cash In"}
            </DialogTitle>
            <DialogDescription>
              {shiftAction === "cash_out"
                ? "Record cash removed from the active register."
                : "Record additional cash placed into the active register."}
            </DialogDescription>
          </DialogHeader>
          <UniFieldInput
            label="Amount"
            value={movementAmount}
            onChange={(event) => setMovementAmount(event.target.value)}
            placeholder="Enter amount"
            prefix="₹"
            type="number"
          />
          <UniFieldInput
            as="textarea"
            label="Note"
            value={movementNote}
            onChange={(event) => setMovementNote(event.target.value)}
            placeholder="Why is this cash moving?"
          />
          <DialogFooter>
            <Button
              onClick={handleCashMovement}
              disabled={isCashingIn || isCashingOut}
            >
              {isCashingIn || isCashingOut
                ? "Saving..."
                : shiftAction === "cash_out"
                  ? "Record Cash Out"
                  : "Record Cash In"}
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
            <DialogTitle>Close Cashier Shift</DialogTitle>
            <DialogDescription>
              Expected cash is ₹{Number(shift?.expected_cash || 0).toFixed(2)}.
              Enter the physical cash counted in the drawer.
            </DialogDescription>
          </DialogHeader>
          <UniFieldInput
            label="Declared Cash"
            value={declaredCash}
            onChange={(event) => setDeclaredCash(event.target.value)}
            placeholder="Enter counted cash"
            prefix="₹"
            type="number"
          />
          <UniFieldInput
            as="textarea"
            label="Closing Note"
            value={closingNote}
            onChange={(event) => setClosingNote(event.target.value)}
            placeholder="Optional closing note"
          />
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleCloseShift}
              disabled={isClosingShift || declaredCash === ""}
            >
              {isClosingShift ? "Closing..." : "Close Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHeldCartDialogOpen} onOpenChange={setIsHeldCartDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Held Carts</DialogTitle>
            <DialogDescription>
              Resume or delete held carts saved for this branch.
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
                      {heldSale.total_items || 0} item(s) • ₹
                      {Number(heldSale.total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleResumeHeldSale(heldSale.id)}
                    >
                      Resume
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteHeldSale(heldSale.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-slate-500">
                No held carts found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
