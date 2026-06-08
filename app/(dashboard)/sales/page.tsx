"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

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
import { registers } from "@/lib/api/registers"
import { sales } from "@/lib/api/sales"
import { showToast } from "@/lib/toast"

type CartItem = {
  product_id: string
  name: string
  qty: number
  price: number
  available_stock: number
  sku?: string
}

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

const parseCouponCodes = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

export default function SalesPage() {
  const router = useRouter()
  const loadedRef = useRef(false)

  const [shift, setShift] = useState<any>(null)
  const [isOpenShiftDialogOpen, setIsOpenShiftDialogOpen] = useState(false)
  const [openingCash, setOpeningCash] = useState("")
  const [declaredCash, setDeclaredCash] = useState("")

  const [customerId, setCustomerId] = useState("")
  const [productId, setProductId] = useState("")
  const [couponInput, setCouponInput] = useState("")
  const [selectedCouponId, setSelectedCouponId] = useState("")
  const [paymentType, setPaymentType] = useState("cash-payment")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [saleNote, setSaleNote] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const [getCurrentShift, { isLoading: isCheckingShift }] = (
    registers as any
  ).useGetCurrentShiftMutation()
  const [openShift, { isLoading: isOpeningShift }] = (
    registers as any
  ).useOpenShiftMutation()
  const [closeShift, { isLoading: isClosingShift }] = (
    registers as any
  ).useCloseShiftMutation()
  const [getCustomersDropdown, { data: customersData, isLoading: isCustomersLoading }] =
    (customers as any).useGetCustomersDropdownMutation()
  const [getProductsDropdown, { data: productsData, isLoading: isProductsLoading }] =
    (catalog as any).useGetProductsDropdownMutation()
  const [getPaymentTypesDropdown, { data: paymentTypesData, isLoading: isPaymentTypesLoading }] =
    (payments as any).useGetPaymentTypesDropdownMutation()
  const [getCouponsDropdown, { data: couponsData, isLoading: isCouponsLoading }] =
    (promotions as any).useGetCouponsDropdownMutation()
  const [createSale, { isLoading: isCreatingSale }] = (
    sales as any
  ).useCreateSaleMutation()

  const customerOptions = customersData?.data || []
  const productOptions = productsData?.data || []
  const paymentTypeOptions = paymentTypesData?.data || []
  const couponOptions = couponsData?.data || []

  const selectedProduct = productOptions.find(
    (product: any) => String(product.id) === productId
  )

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.qty * item.price, 0),
    [cartItems]
  )
  const couponCodes = useMemo(() => parseCouponCodes(couponInput), [couponInput])
  const dueAmount = Math.max(subtotal - money(paymentAmount), 0)
  const changeAmount = Math.max(money(paymentAmount) - subtotal, 0)

  const loadShift = async () => {
    const response = await getCurrentShift().unwrap()
    const activeShift = response?.data || null
    setShift(activeShift)
    setIsOpenShiftDialogOpen(!activeShift)
  }

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    loadShift()
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
    if (!subtotal) {
      setPaymentAmount("")
      return
    }
    setPaymentAmount((current) => {
      if (!current) return subtotal.toFixed(2)
      return current
    })
  }, [subtotal])

  const handleOpenShift = async () => {
    const response = await openShift({
      opening_cash: openingCash || "0",
      note: "",
    }).unwrap()
    setShift(response?.data || null)
    setOpeningCash("")
    setIsOpenShiftDialogOpen(false)
    showToast.success(response?.message || "Shift opened successfully.")
  }

  const handleCloseShift = async () => {
    const response = await closeShift({
      shift_id: shift?.id,
      declared_cash: declaredCash || shift?.expected_cash || "0",
      note: "",
    }).unwrap()
    setShift(null)
    setDeclaredCash("")
    setCartItems([])
    setCouponInput("")
    setSaleNote("")
    setIsOpenShiftDialogOpen(true)
    showToast.success(response?.message || "Shift closed successfully.")
  }

  const handleAddProduct = () => {
    if (!selectedProduct) return

    const price = Number(selectedProduct.selling_price || selectedProduct.price || 0)
    const availableStock = Number(selectedProduct.current_stock || 0)

    setCartItems((items) => {
      const existing = items.find((item) => item.product_id === productId)
      if (existing) {
        return items.map((item) =>
          item.product_id === productId
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      }

      return [
        ...items,
        {
          product_id: productId,
          name: selectedProduct.name,
          qty: 1,
          price,
          available_stock: availableStock,
          sku: selectedProduct.sku,
        },
      ]
    })
    setProductId("")
  }

  const updateQuantity = (product_id: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.product_id === product_id
            ? { ...item, qty: Math.max(item.qty + delta, 0) }
            : item
        )
        .filter((item) => item.qty > 0)
    )
  }

  const removeItem = (product_id: string) => {
    setCartItems((items) => items.filter((item) => item.product_id !== product_id))
  }

  const resetSaleForm = () => {
    setCustomerId("")
    setProductId("")
    setCouponInput("")
    setSelectedCouponId("")
    setPaymentAmount("")
    setSaleNote("")
    setCartItems([])
  }

  const handleCompleteSale = async () => {
    if (!shift?.id) {
      showToast.error("Open shift is required before billing.")
      return
    }
    if (!cartItems.length) {
      showToast.error("Add at least one product to cart.")
      return
    }
    if (!paymentType) {
      showToast.error("Choose payment type.")
      return
    }

    const paidAmount = money(paymentAmount)
    const payLoad = {
      customer_id: customerId ? Number(customerId) : null,
      shift_id: shift.id,
      order_type: "pos",
      note: saleNote,
      coupon_codes: couponCodes,
      items: cartItems.map((item) => ({
        product_id: Number(item.product_id),
        quantity: String(item.qty),
        unit_price: String(item.price),
        discount_amount: "0",
        tax_amount: "0",
      })),
      payments:
        paidAmount > 0
          ? [
              {
                payment_type: paymentType,
                amount: String(paidAmount),
                reference_number: "",
                note: saleNote,
              },
            ]
          : [],
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
    isCheckingShift ||
    isCustomersLoading ||
    isProductsLoading ||
    isPaymentTypesLoading ||
    isCouponsLoading

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
            {shift
              ? `Active shift: ${shift.register_name || "Register"}`
              : "Open a shift before starting sales."}
          </p>
        </div>
        {shift ? (
          <div className="flex items-center gap-2">
            <UniFieldInput
              value={declaredCash}
              onChange={(event) => setDeclaredCash(event.target.value)}
              placeholder="Declared cash"
              prefix="₹"
              type="number"
              containerClassName="w-44"
            />
            <Button
              variant="outline"
              onClick={handleCloseShift}
              disabled={isClosingShift}
            >
              Close Shift
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsOpenShiftDialogOpen(true)}>Open Shift</Button>
        )}
      </div>

      {shift ? (
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
                    key={item.product_id}
                    className="grid grid-cols-[1.4fr_130px_110px_120px_56px] items-center border-t px-4 py-3 text-sm font-semibold"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        SKU: {item.sku || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => updateQuantity(item.product_id, -1)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="min-w-6 text-center">{item.qty}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => updateQuantity(item.product_id, 1)}
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
                      onClick={() => removeItem(item.product_id)}
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

              <UniFieldSelect
                label="Payment Type"
                value={paymentType}
                onValueChange={setPaymentType}
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
                label="Receive Amount"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="Enter paid amount"
                prefix="₹"
                type="number"
              />

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
                <span>₹{money(paymentAmount).toFixed(2)}</span>
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
              Enter opening cash before starting billing for this branch.
            </DialogDescription>
          </DialogHeader>
          <UniFieldInput
            label="Opening Cash"
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
            placeholder="Enter opening cash"
            prefix="₹"
            type="number"
          />
          <DialogFooter>
            <Button onClick={handleOpenShift} disabled={isOpeningShift}>
              {isOpeningShift ? "Opening..." : "Open Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
