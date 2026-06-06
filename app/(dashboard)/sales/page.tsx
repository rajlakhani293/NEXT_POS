"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, ShoppingCart } from "lucide-react"

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
import { registers } from "@/lib/api/registers"
import { rewards } from "@/lib/api/rewards"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"
import { usePermissions } from "@/hooks/use-permissions"

type CartItem = {
  product_id: string
  name: string
  qty: number
  price: number
}

export default function SalesPage() {
  const loadedRef = useRef(false)
  const [shift, setShift] = useState<any>(null)
  const [isOpenShiftDialogOpen, setIsOpenShiftDialogOpen] = useState(false)
  const [openingCash, setOpeningCash] = useState("")
  const [declaredCash, setDeclaredCash] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [productId, setProductId] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [rewardBalances, setRewardBalances] = useState<any[]>([])
  const { hasPermission } = usePermissions()
  const canViewRewards = hasPermission(PERMISSIONS.rewards.view)
  const canUpdateRewards = hasPermission(PERMISSIONS.rewards.update)

  const [getCurrentShift, { isLoading: isCheckingShift }] = (
    registers as any
  ).useGetCurrentShiftMutation()
  const [openShift, { isLoading: isOpeningShift }] = (
    registers as any
  ).useOpenShiftMutation()
  const [closeShift, { isLoading: isClosingShift }] = (
    registers as any
  ).useCloseShiftMutation()
  const [getCustomersDropdown, { data: customersData }] = (
    customers as any
  ).useGetCustomersDropdownMutation()
  const [getProductsDropdown, { data: productsData }] = (
    catalog as any
  ).useGetProductsDropdownMutation()
  const [getCustomerRewardBalance] = (
    rewards as any
  ).useGetCustomerRewardBalanceMutation()
  const [earnCustomerRewardFromSale, { isLoading: isProcessingReward }] = (
    rewards as any
  ).useEarnCustomerRewardFromSaleMutation()

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
  }, [getCurrentShift, getCustomersDropdown, getProductsDropdown])

  useEffect(() => {
    if (!customerId || !canViewRewards) {
      setRewardBalances([])
      return
    }

    getCustomerRewardBalance({ id: customerId })
      .unwrap()
      .then((response: any) => setRewardBalances(response?.data || []))
      .catch(() => setRewardBalances([]))
  }, [canViewRewards, customerId, getCustomerRewardBalance])

  const customerOptions = customersData?.data || []
  const productOptions = productsData?.data || []
  const selectedProduct = productOptions.find(
    (product: any) => String(product.id) === productId
  )
  const subtotal = cartItems.reduce((total, item) => total + item.qty * item.price, 0)

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
    setIsOpenShiftDialogOpen(true)
    showToast.success(response?.message || "Shift closed successfully.")
  }

  const handleAddProduct = () => {
    if (!selectedProduct) return
    const price = Number(selectedProduct.selling_price || selectedProduct.price || 0)
    setCartItems((items) => {
      const existing = items.find((item) => item.product_id === productId)
      if (existing) {
        return items.map((item) =>
          item.product_id === productId ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [
        ...items,
        {
          product_id: productId,
          name: selectedProduct.name,
          qty: 1,
          price,
        },
      ]
    })
    setProductId("")
  }

  const refreshRewardBalance = async () => {
    if (!customerId || !canViewRewards) return
    const response = await getCustomerRewardBalance({ id: customerId }).unwrap()
    setRewardBalances(response?.data || [])
  }

  const handleContinuePayment = async () => {
    if (!cartItems.length) return

    if (!customerId || !canUpdateRewards) {
      showToast.success("Sale ready for payment.")
      return
    }

    const response = await earnCustomerRewardFromSale({
      customer_id: Number(customerId),
      cart_total: subtotal,
      note: "Reward earned from POS sale.",
    }).unwrap()
    const rewardData = response?.data || {}
    const issuedCount = rewardData.issued_coupons?.length || 0

    if (rewardData.earned_points > 0) {
      showToast.success(
        `${rewardData.earned_points} reward point(s) earned${issuedCount ? ` and ${issuedCount} coupon issued` : ""}.`
      )
    } else {
      showToast.success(response?.message || "Sale ready for payment.")
    }

    await refreshRewardBalance()
  }

  if (isCheckingShift && !shift) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Checking cashier shift...
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
          <Button onClick={() => setIsOpenShiftDialogOpen(true)}>
            Open Shift
          </Button>
        )}
      </div>

      {shift ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
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
              <div className="grid grid-cols-[1fr_80px_100px_110px] bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="grid grid-cols-[1fr_80px_100px_110px] border-t px-4 py-3 text-sm font-semibold"
                  >
                    <span>{item.name}</span>
                    <span>{item.qty}</span>
                    <span>₹{item.price.toFixed(2)}</span>
                    <span>₹{(item.qty * item.price).toFixed(2)}</span>
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
            {rewardBalances.length ? (
              <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm font-bold text-blue-950">Rewards</p>
                <div className="mt-2 space-y-1">
                  {rewardBalances.map((balance: any) => (
                    <div
                      key={balance.id}
                      className="flex justify-between text-xs font-semibold text-blue-900"
                    >
                      <span>{balance.reward_system_name}</span>
                      <span>{balance.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 space-y-3 text-sm font-semibold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
            <Button
              className="mt-6 w-full"
              disabled={!cartItems.length || isProcessingReward}
              onClick={handleContinuePayment}
            >
              {isProcessingReward ? "Processing Rewards..." : "Continue Payment"}
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
