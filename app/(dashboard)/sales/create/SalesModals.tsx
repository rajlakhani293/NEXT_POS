"use client"

import React from "react"
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  History,
  LogOut,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import CustomModal from "@/components/ui/customModal"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { DatePicker } from "@/components/date-picker"
import { formatBusinessDateTime, formatBusinessMoney } from "@/lib/format"
import { PERMISSIONS } from "@/lib/permissions"

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return undefined
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

const formatLocalDate = (date?: Date) => {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

interface SalesModalsProps {
  // Localization & Options
  t: (key: string) => string
  posOptions: any

  // Payment
  isPaymentDialogOpen: boolean
  setIsPaymentDialogOpen: (open: boolean) => void
  activePaymentLabel: string
  paymentTypeOptions: any[]
  activePaymentType: string
  setActivePaymentType: (type: string) => void
  paymentsRows: any[]
  removePaymentRow: (id: any) => void
  subtotal: number
  cartDiscount: number
  totalPaid: number
  changeAmount: number
  paymentAmountInput: string
  setPaymentAmountInput: (val: string) => void
  addPaymentFromPopup: (amount: number) => void
  paymentAmountShortcuts: number[]
  makeFullPaymentFromPopup: () => void
  confirmFullPaymentFromPopup: () => void
  handleCompleteSale: (opts?: {
    paymentStatus?: string
    layaway?: any
    additionalPayments?: Array<{
      payment_type: string
      amount: string
      reference_number?: string
      note?: string
    }>
  }) => void
  isCreatingSale: boolean
  ordersAllowUnpaid: boolean
  ordersAllowPartial: boolean
  handleSaveAsUnpaid: () => void
  openLayawayDialog: () => void
  isLayawayDialogOpen: boolean
  setIsLayawayDialogOpen: (open: boolean) => void
  layawayCount: string
  setLayawayCount: (value: string) => void
  layawayLines: { date: string; amount: string }[]
  setLayawayLines: React.Dispatch<React.SetStateAction<{ date: string; amount: string }[]>>
  minimumLayawayPayment: number
  handleSkipLayaway: () => void
  handleSubmitLayaway: () => void
  openCartDiscountDialog: () => void

  // Cart Item Price
  activePriceItem: any
  setActivePriceItem: (item: any) => void
  priceInput: string
  setPriceInput: (value: string) => void
  handleApplyItemPrice: () => void

  // Cashier Shift
  isOpenShiftDialogOpen: boolean
  setIsOpenShiftDialogOpen: (open: boolean) => void
  shift: any
  handleOpenShift: () => void
  isOpeningShift: boolean
  selectedRegisterId: string
  setSelectedRegisterId: (id: string) => void
  registerOptions: any[]
  isRegistersLoading: boolean
  openingCash: string
  setOpeningCash: (val: string) => void
  openingNote: string
  setOpeningNote: (val: string) => void
  router: any
  hasPermission: (permission: string) => boolean

  // Register Options / History
  isRegisterOptionsOpen: boolean
  setIsRegisterOptionsOpen: (open: boolean) => void
  isRegisterHistoryOpen: boolean
  setIsRegisterHistoryOpen: (open: boolean) => void
  openRegisterHistory: () => void
  registerHistoryState: any
  registerHistoryEntries: any[]
  registerHistorySummary: any[]
  registerTotalIn: number
  registerTotalOut: number

  // Cash Movement
  shiftAction: "cash_in" | "cash_out" | "close" | null
  setShiftAction: (action: "cash_in" | "cash_out" | "close" | null) => void
  movementAmount: string
  setMovementAmount: (val: string) => void
  movementNote: string
  setMovementNote: (val: string) => void
  isCashingIn: boolean
  isCashingOut: boolean
  handleCashMovement: () => void

  // Close Shift
  declaredCash: string
  setDeclaredCash: (val: string) => void
  closingNote: string
  setClosingNote: (val: string) => void
  isClosingShift: boolean
  handleCloseShift: () => void

  // Held Cart
  isHeldCartDialogOpen: boolean
  setIsHeldCartDialogOpen: (open: boolean) => void
  pendingOrdersTab: "hold" | "unpaid" | "partially_paid"
  handlePendingTabChange: (tab: "hold" | "unpaid" | "partially_paid") => void
  pendingOrderSearch: string
  setPendingOrderSearch: (val: string) => void
  handleSearchPendingOrders: () => void
  pendingOrders: any[]
  handleOpenPendingOrder: (order: any) => void
  handlePreviewPendingOrder: (order: any) => void
  handlePrintPendingOrder: (order: any) => void
  handleDeleteHeldSale: (id: any) => void

  // Hold Reference
  isHoldReferenceDialogOpen: boolean
  setIsHoldReferenceDialogOpen: (open: boolean) => void
  holdReference: string
  setHoldReference: (val: string) => void
  handleHoldSale: () => void
  isHoldingSale: boolean

  // Preview Order
  previewPendingOrder: any
  setPreviewPendingOrder: (order: any) => void

  // Unit Picker
  isUnitPickerOpen: boolean
  setIsUnitPickerOpen: (open: boolean) => void
  unitPickerProduct: any
  setUnitPickerProduct: (product: any) => void
  getUnitQuantityLabel: (uq: any) => string
  getDisplayPrice: (uq: any) => number
  handleUnitPickerSelect: (uq: any) => void

  // Define Quantity
  pendingCartProduct: any
  setPendingCartProduct: (product: any) => void
  quantityInput: string
  setQuantityInput: (val: string) => void
  allowDecimalQuantities: boolean
  handleConfirmQuantity: () => void

  // Comments / Note
  isNoteDialogOpen: boolean
  setIsNoteDialogOpen: (open: boolean) => void
  saleNote: string
  setSaleNote: (val: string) => void

  // Coupons
  isCouponsDialogOpen: boolean
  setIsCouponsDialogOpen: (open: boolean) => void
  selectedCouponId: string
  setSelectedCouponId: (id: string) => void
  couponOptions: any[]
  couponInput: string
  setCouponInput: (val: string) => void

  taxGroupOptions: any[]

  // Order Settings
  isOrderSettingsOpen: boolean
  setIsOrderSettingsOpen: (open: boolean) => void
  orderTitle: string
  setOrderTitle: (title: string) => void
  activeOrderType: string
  setOrderType: (type: string) => void
  enabledOrderTypes: any[]

  // Taxes Dialog
  isTaxesDialogOpen: boolean
  setIsTaxesDialogOpen: (open: boolean) => void
  cartTaxGroupId: string
  setCartTaxGroupId: (id: string) => void
  cartTaxType: string
  setCartTaxType: (type: string) => void

  // Cart Discount
  isCartDiscountDialogOpen: boolean
  setIsCartDiscountDialogOpen: (open: boolean) => void
  cartDiscountType: "flat" | "percentage"
  setCartDiscountType: (type: "flat" | "percentage") => void
  cartDiscountVal: string
  setCartDiscountVal: (val: string) => void
  handleApplyCartDiscount: () => void

  // Item Discount
  activeDiscountItem: any
  setActiveDiscountItem: (item: any) => void
  itemDiscountType: "flat" | "percentage"
  setItemDiscountType: (type: "flat" | "percentage") => void
  itemDiscountVal: string
  setItemDiscountVal: (val: string) => void
  handleApplyItemDiscount: () => void

  // Customer selection
  isCustomerSelectOpen: boolean
  setIsCustomerSelectOpen: (open: boolean) => void
  customerSearchTerm: string
  setCustomerSearchTerm: (term: string) => void
  customerOptions: any[]
  customerId: string
  setCustomerId: (id: string) => void
  onCustomerSelected?: (id: string) => void

  // Order Type Picker
  isOrderTypeOpen: boolean
  setIsOrderTypeOpen: (open: boolean) => void
  onOrderTypeSelected?: (type: string) => void

  // Shipping & Billing
  isShippingBillingOpen: boolean
  setIsShippingBillingOpen: (open: boolean) => void
  shippingBillingTab: "general" | "shipping" | "billing"
  setShippingBillingTab: (tab: "general" | "shipping" | "billing") => void
  shippingInfo: Record<string, any>
  setShippingInfo: React.Dispatch<React.SetStateAction<any>>
  selectedCustomer: any
  fillCustomerAddress: (type: "shipping" | "billing") => boolean
  saveShippingBilling: () => void
}

export default function SalesModals({
  t,
  posOptions,

  isCustomerSelectOpen,
  setIsCustomerSelectOpen,
  customerSearchTerm,
  setCustomerSearchTerm,
  customerOptions,
  customerId,
  setCustomerId,
  onCustomerSelected,

  isPaymentDialogOpen,
  setIsPaymentDialogOpen,
  activePaymentLabel,
  paymentTypeOptions,
  activePaymentType,
  setActivePaymentType,
  paymentsRows,
  removePaymentRow,
  subtotal,
  cartDiscount,
  totalPaid,
  changeAmount,
  paymentAmountInput,
  setPaymentAmountInput,
  addPaymentFromPopup,
  paymentAmountShortcuts,
  makeFullPaymentFromPopup,
  confirmFullPaymentFromPopup,
  handleCompleteSale,
  isCreatingSale,
  ordersAllowUnpaid,
  ordersAllowPartial,
  handleSaveAsUnpaid,
  openLayawayDialog,
  isLayawayDialogOpen,
  setIsLayawayDialogOpen,
  layawayCount,
  setLayawayCount,
  layawayLines,
  setLayawayLines,
  minimumLayawayPayment,
  handleSkipLayaway,
  handleSubmitLayaway,
  openCartDiscountDialog,

  activePriceItem,
  setActivePriceItem,
  priceInput,
  setPriceInput,
  handleApplyItemPrice,

  isOpenShiftDialogOpen,
  setIsOpenShiftDialogOpen,
  shift,
  handleOpenShift,
  isOpeningShift,
  selectedRegisterId,
  setSelectedRegisterId,
  registerOptions,
  isRegistersLoading,
  openingCash,
  setOpeningCash,
  openingNote,
  setOpeningNote,
  router,
  hasPermission,

  isRegisterOptionsOpen,
  setIsRegisterOptionsOpen,
  isRegisterHistoryOpen,
  setIsRegisterHistoryOpen,
  openRegisterHistory,
  registerHistoryState,
  registerHistoryEntries,
  registerHistorySummary,
  registerTotalIn,
  registerTotalOut,

  shiftAction,
  setShiftAction,
  movementAmount,
  setMovementAmount,
  movementNote,
  setMovementNote,
  isCashingIn,
  isCashingOut,
  handleCashMovement,

  declaredCash,
  setDeclaredCash,
  closingNote,
  setClosingNote,
  isClosingShift,
  handleCloseShift,

  isHeldCartDialogOpen,
  setIsHeldCartDialogOpen,
  pendingOrdersTab,
  handlePendingTabChange,
  pendingOrderSearch,
  setPendingOrderSearch,
  handleSearchPendingOrders,
  pendingOrders,
  handleOpenPendingOrder,
  handlePreviewPendingOrder,
  handlePrintPendingOrder,
  handleDeleteHeldSale,

  isHoldReferenceDialogOpen,
  setIsHoldReferenceDialogOpen,
  holdReference,
  setHoldReference,
  handleHoldSale,
  isHoldingSale,

  previewPendingOrder,
  setPreviewPendingOrder,

  isUnitPickerOpen,
  setIsUnitPickerOpen,
  unitPickerProduct,
  setUnitPickerProduct,
  getUnitQuantityLabel,
  getDisplayPrice,
  handleUnitPickerSelect,

  pendingCartProduct,
  setPendingCartProduct,
  quantityInput,
  setQuantityInput,
  allowDecimalQuantities,
  handleConfirmQuantity,

  isNoteDialogOpen,
  setIsNoteDialogOpen,
  saleNote,
  setSaleNote,

  isCouponsDialogOpen,
  setIsCouponsDialogOpen,
  selectedCouponId,
  setSelectedCouponId,
  couponOptions,
  couponInput,
  setCouponInput,

  taxGroupOptions,

  isOrderSettingsOpen,
  setIsOrderSettingsOpen,
  orderTitle,
  setOrderTitle,
  activeOrderType,
  setOrderType,
  enabledOrderTypes,

  isTaxesDialogOpen,
  setIsTaxesDialogOpen,
  cartTaxGroupId,
  setCartTaxGroupId,
  cartTaxType,
  setCartTaxType,

  isCartDiscountDialogOpen,
  setIsCartDiscountDialogOpen,
  cartDiscountType,
  setCartDiscountType,
  cartDiscountVal,
  setCartDiscountVal,
  handleApplyCartDiscount,

  activeDiscountItem,
  setActiveDiscountItem,
  itemDiscountType,
  setItemDiscountType,
  itemDiscountVal,
  setItemDiscountVal,
  handleApplyItemDiscount,

  isOrderTypeOpen,
  setIsOrderTypeOpen,
  onOrderTypeSelected,

  isShippingBillingOpen,
  setIsShippingBillingOpen,
  shippingBillingTab,
  setShippingBillingTab,
  shippingInfo,
  setShippingInfo,
  selectedCustomer,
  fillCustomerAddress,
  saveShippingBilling,
}: SalesModalsProps) {
  const formatMoney = (value: number | string | null | undefined) =>
    formatBusinessMoney(value, posOptions)
  const enteredPayments = paymentsRows.filter((row) => money(row.amount) > 0)
  const remainingAmount = Math.max(subtotal - totalPaid, 0)

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearchTerm.trim()) return customerOptions
    const term = customerSearchTerm.toLowerCase()
    return customerOptions.filter((c: any) =>
      c.name?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    )
  }, [customerOptions, customerSearchTerm])

  const addressFields = [
    ["first_name", t("First Name"), t("Provide the billing first name.")],
    ["last_name", t("Last Name"), t("Provide the billing last name.")],
    ["phone", t("Phone"), t("Billing phone number.")],
    ["address_1", t("Address 1"), t("Billing First Address.")],
    ["address_2", t("Address 2"), t("Billing Second Address.")],
    ["country", t("Country"), t("Billing Country.")],
    ["city", t("City"), t("City")],
    ["pobox", t("PO.Box"), t("Postal Address")],
    ["company", t("Company"), t("Company")],
    ["email", t("Email"), t("Email")],
  ] as const

  const customerDisplayName = (customer: any) =>
    customer?.name ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    customer?.username ||
    t("Customer")

  const customerGroupName = (customer: any) =>
    customer?.group?.name || customer?.group_name || customer?.group || t("No Group")

  const generateLayawayLines = (countValue: string) => {
    const count = Math.max(Number.parseInt(countValue || "0", 10) || 0, 0)
    const today = new Date().toISOString().slice(0, 10)
    setLayawayLines(
      Array.from({ length: count }).map((_, index) => ({
        date: index === 0 ? today : "",
        amount: index === 0 && minimumLayawayPayment > 0 ? String(minimumLayawayPayment) : "0",
      }))
    )
  }

  return (
    <>
      <CustomModal
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        title={t("Payment")}
        className="w-[96vw] !max-w-[96vw] overflow-hidden p-0 xl:!max-w-[1280px]"
        headerClassName="sr-only"
        bodyClassName="-mx-0 px-0 py-0 max-h-[86vh] border-y-0"
        showFooter={false}
      >
        <div className="flex max-h-[86vh] flex-col overflow-hidden bg-slate-50">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div>
              <h3 className="text-xl font-bold text-slate-950">{t("Payment")}</h3>
              <p className="text-sm font-medium text-muted-foreground">
                {activePaymentLabel || t("choose_payment_type")}
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              {t("Close")}
            </Button>
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
          ) : (
            <div className="grid min-h-0 flex-auto gap-3 overflow-y-auto p-4 lg:grid-cols-[240px_minmax(420px,1fr)_340px]">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">{t("Payment Type")}</p>
                <div className="grid gap-2">
                  {paymentTypeOptions.map((payment: any) => {
                    const identifier = payment.value || payment.identifier
                    return (
                      <Button
                        key={identifier}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setActivePaymentType(identifier)
                        }}
                        className={[
                          "justify-start border text-left font-semibold",
                          activePaymentType === identifier
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-400",
                        ].join(" ")}
                      >
                        <span>{payment.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">{t("Total")}</p>
                    <p className="mt-1 text-2xl font-bold">{formatMoney(subtotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openCartDiscountDialog}
                    className="rounded-md border border-red-100 bg-red-50 p-3 text-left"
                  >
                    <p className="text-xs font-bold uppercase text-red-700">{t("Discount")}</p>
                    <p className="mt-1 text-2xl font-bold text-red-700">{formatMoney(cartDiscount)}</p>
                  </button>
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs font-bold uppercase text-emerald-700">{t("Paid")}</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(totalPaid)}</p>
                  </div>
                  <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs font-bold uppercase text-amber-700">{t("Due")}</p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">{formatMoney(remainingAmount)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">{t("Amount")}</p>
                      <p className="text-sm font-semibold text-slate-700">{activePaymentLabel}</p>
                    </div>
                    <p className="text-2xl font-bold">{formatMoney(paymentAmountInput || 0)}</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px]">
                    <UniFieldInput
                      value={paymentAmountInput}
                      onChange={(event) => setPaymentAmountInput(event.target.value)}
                      type="number"
                      min="0"
                      prefix={posOptions.currency_symbol}
                      placeholder={t("0.00")}
                    />
                    <Button
                      type="button"
                      className="h-10"
                      onClick={() => addPaymentFromPopup(money(paymentAmountInput))}
                    >
                      {t("Add Payment")}
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {(paymentAmountShortcuts.length ? paymentAmountShortcuts : [5, 10, 20, 50]).map((amount) => (
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
                      onClick={confirmFullPaymentFromPopup}
                    >
                      {t("Full Payment")}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold">
                  <div className="flex justify-between">
                    <span>{t("Change")}</span>
                    <span className="text-green-700">{formatMoney(changeAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-4">
                  <h3 className="text-lg font-bold">{t("Payment List")}</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {enteredPayments.length} {t("payments")}
                  </p>
                </div>
                <div className="min-h-0 flex-auto overflow-y-auto p-3">
                  <ul className="space-y-2">
                    {enteredPayments.length ? (
                      enteredPayments.map((row) => (
                        <li
                          key={row.id}
                          className="rounded-md border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">
                              {
                                paymentTypeOptions.find(
                                  (payment: any) =>
                                    (payment.value || payment.identifier) === row.payment_type
                                )?.label || row.payment_type
                              }
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-500 hover:text-red-600"
                              onClick={() => removePaymentRow(row.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <p className="mt-1 text-xl font-bold">{formatMoney(row.amount)}</p>
                        </li>
                      ))
                    ) : (
                      <li className="rounded-md border border-dashed border-slate-200 p-5 text-center text-sm font-semibold text-muted-foreground">
                        {t("No Payment added.")}
                      </li>
                    )}
                  </ul>
                </div>
                <div className="space-y-2 border-t border-slate-200 p-4 text-sm font-semibold">
                  <div className="flex justify-between">
                    <span>{t("total")}</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("received")}</span>
                    <span>{formatMoney(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>{t("due")}</span>
                    <span>{formatMoney(remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-white p-3">
            {totalPaid >= subtotal ? (
              <Button onClick={() => handleCompleteSale()} disabled={isCreatingSale}>
                {isCreatingSale ? <Spinner /> : t("Submit Payment")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={openLayawayDialog}
                  disabled={
                    isCreatingSale ||
                    (totalPaid > 0 ? !ordersAllowPartial : !ordersAllowUnpaid)
                  }
                >
                  {totalPaid === 0
                    ? `${t("Layaway")} - ${formatMoney(minimumLayawayPayment)}`
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
          </div>
        </div>
      </CustomModal>

      <CustomModal
        open={isOpenShiftDialogOpen}
        onOpenChange={(open) => {
          if (shift) {
            setIsOpenShiftDialogOpen(open)
          } else {
            router.push("/sales")
          }
        }}
        title={t("open_cashier_shift")}
        description={t("open_shift_description")}
        showFooter={true}
        footer={
          <Button
            onClick={handleOpenShift}
            disabled={isOpeningShift || !selectedRegisterId}
          >
            {isOpeningShift ? t("opening") : t("open_shift")}
          </Button>
        }
      >
        <div className="space-y-4">
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
        </div>
      </CustomModal>

      <CustomModal
        open={isRegisterOptionsOpen}
        onOpenChange={setIsRegisterOptionsOpen}
        title={t("Register Options")}
        description={shift?.register_name || t("Cash Register")}
        className="max-w-2xl"
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase text-blue-700">{t("Sales")}</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">
                {formatMoney(shift?.total_sale_amount || shift?.total_sales || 0)}
              </p>
            </div>
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-700">{t("Balance")}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-950">
                {formatMoney(shift?.balance || shift?.expected_cash || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200 bg-white">
            {hasPermission(PERMISSIONS.cashRegister.close) ? (
              <button
                type="button"
                onClick={() => {
                  setDeclaredCash(String(shift?.balance || shift?.expected_cash || ""))
                  setShiftAction("close")
                }}
                className="flex min-h-32 flex-col items-center justify-center gap-2 border-b border-r border-slate-200 p-4 text-center font-semibold text-slate-800 hover:bg-blue-50"
              >
                <LogOut className="size-8 text-blue-700" />
                {t("Close")}
              </button>
            ) : null}
            {hasPermission(PERMISSIONS.cashRegister.cashIn) ? (
              <button
                type="button"
                onClick={() => setShiftAction("cash_in")}
                className="flex min-h-32 flex-col items-center justify-center gap-2 border-b border-slate-200 p-4 text-center font-semibold text-slate-800 hover:bg-emerald-50"
              >
                <PlusCircle className="size-8 text-emerald-700" />
                {t("Cash In")}
              </button>
            ) : null}
            {hasPermission(PERMISSIONS.cashRegister.cashOut) ? (
              <button
                type="button"
                onClick={() => setShiftAction("cash_out")}
                className="flex min-h-32 flex-col items-center justify-center gap-2 border-r border-slate-200 p-4 text-center font-semibold text-slate-800 hover:bg-red-50"
              >
                <MinusCircle className="size-8 text-red-700" />
                {t("Cash Out")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={openRegisterHistory}
              className="flex min-h-32 flex-col items-center justify-center gap-2 p-4 text-center font-semibold text-slate-800 hover:bg-slate-50"
            >
              {registerHistoryState.isLoading ? <Spinner /> : <History className="size-8 text-slate-700" />}
              {t("History")}
            </button>
          </div>
        </div>
      </CustomModal>

      <CustomModal
        open={isRegisterHistoryOpen}
        onOpenChange={setIsRegisterHistoryOpen}
        title={t("Register History")}
        description={shift?.register_name || t("Cash Register")}
        className="max-w-4xl"
        showFooter={false}
      >
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-2">
            <div className="bg-emerald-600 p-4 text-right text-2xl font-bold text-white">
              {formatMoney(registerTotalIn)}
            </div>
            <div className="bg-red-600 p-4 text-right text-2xl font-bold text-white">
              {formatMoney(registerTotalOut)}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto bg-white">
            {registerHistoryEntries.length ? (
              registerHistoryEntries.map((history: any) => {
                const action = history.action || history.entry_type
                const isOut = ["register-order-change", "register-closing", "register-close", "register-refund", "register-cash-out"].includes(action)
                return (
                  <div
                    key={history.id}
                    className={[
                      "flex items-start justify-between gap-4 border-b border-slate-100 p-3 text-sm",
                      isOut ? "bg-red-50/40" : "bg-emerald-50/40",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {history.description || history.label || t("Not Provided")}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {t("Type")}: {history.label || action}
                      </p>
                    </div>
                    <p className={["font-bold", isOut ? "text-red-700" : "text-emerald-700"].join(" ")}>
                      {formatMoney(history.value)}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
                {t("Nothing to display...")}
              </div>
            )}
          </div>
          <div className="bg-slate-50">
            {registerHistorySummary.map((summary: any, index: number) => (
              <div key={`${summary.label}-${index}`} className="flex justify-between border-t border-slate-200 px-3 py-2 text-sm font-semibold">
                <span>{summary.label}</span>
                <span>{formatMoney(summary.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CustomModal>

      <CustomModal
        open={shiftAction === "cash_in" || shiftAction === "cash_out"}
        onOpenChange={(open) => {
          if (!open) {
            setShiftAction(null)
            setMovementAmount("")
            setMovementNote("")
          }
        }}
        title={shiftAction === "cash_out" ? t("cash_movement_title_out") : t("cash_movement_title_in")}
        description={shiftAction === "cash_out" ? t("cash_movement_desc_out") : t("cash_movement_desc_in")}
        showFooter={true}
        footer={
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
        }
      >
        <div className="space-y-4">
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
        </div>
      </CustomModal>

      <CustomModal
        open={shiftAction === "close"}
        onOpenChange={(open) => {
          if (!open) {
            setShiftAction(null)
            setDeclaredCash("")
            setClosingNote("")
          }
        }}
        title={t("close_shift_dialog_title")}
        description={`${t("expected_cash_prefix")} ${formatMoney(shift?.expected_cash || 0)}. ${t("physical_cash_desc")}`}
        showFooter={true}
        footer={
          <Button
            variant="destructive"
            onClick={handleCloseShift}
            disabled={isClosingShift || declaredCash === ""}
          >
            {isClosingShift ? t("closing") : t("close_shift_btn")}
          </Button>
        }
      >
        <div className="space-y-4">
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
        </div>
      </CustomModal>

      <CustomModal
        open={isHeldCartDialogOpen}
        onOpenChange={setIsHeldCartDialogOpen}
        title={t("Orders")}
        description={t("Review held, unpaid, and partially paid orders.")}
        className="flex h-[75vh] max-w-4xl flex-col overflow-hidden"
        bodyClassName="-mx-0 px-0 py-0 max-h-none h-full border-y-0"
        showFooter={true}
        footer={
          <Button variant="outline" onClick={() => setIsHeldCartDialogOpen(false)}>
            {t("Close")}
          </Button>
        }
      >
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
            <UniFieldInput
              value={pendingOrderSearch}
              onChange={(event) => setPendingOrderSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleSearchPendingOrders()
                }
              }}
              placeholder={t("Search")}
              addonAfter={
                <Button type="button" variant="outline" className="h-10 rounded-l-none" onClick={handleSearchPendingOrders}>
                  {t("Search")}
                </Button>
              }
            />
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
                      <p><strong>{t("Date")}</strong>: {formatBusinessDateTime(order.created_at, posOptions)}</p>
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
      </CustomModal>

      <CustomModal
        open={isHoldReferenceDialogOpen}
        onOpenChange={setIsHoldReferenceDialogOpen}
        title={t("Hold Order")}
        description={t("Set a reference before placing the current order on hold.")}
        showFooter={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsHoldReferenceDialogOpen(false)}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleHoldSale} disabled={isHoldingSale}>
              {isHoldingSale ? <Spinner /> : t("Confirm")}
            </Button>
          </>
        }
      >
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
      </CustomModal>

      <CustomModal
        open={Boolean(previewPendingOrder)}
        onOpenChange={(open) => {
          if (!open) setPreviewPendingOrder(null)
        }}
        title={t("Products")}
        description={previewPendingOrder?.code || previewPendingOrder?.title || t("Untitled Order")}
        className="max-w-2xl"
        showFooter={true}
        footer={
          <>
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
          </>
        }
      >
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
      </CustomModal>

      <CustomModal
        open={isUnitPickerOpen}
        onOpenChange={(open) => {
          setIsUnitPickerOpen(open)
          if (!open) setUnitPickerProduct(null)
        }}
        title={t("Select Selling Unit")}
        description={`${t("Choose the unit you want to add for")} ${unitPickerProduct?.name || ""}.`}
        showFooter={false}
      >
        <div className="space-y-2">
          {(unitPickerProduct?.unit_quantities || []).map((uq: any) => (
            <button
              key={uq.id}
              onClick={() => {
                handleUnitPickerSelect(uq)
              }}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <span>{getUnitQuantityLabel(uq)}</span>
              <span className="text-blue-600">{formatMoney(getDisplayPrice(uq))}</span>
            </button>
          ))}
        </div>
      </CustomModal>

      <CustomModal
        open={Boolean(pendingCartProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingCartProduct(null)
            setQuantityInput("1")
          }
        }}
        title={t("Define Quantity")}
        description={pendingCartProduct?.product?.name}
        showFooter={true}
        footer={
          <>
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
          </>
        }
      >
        <div className="space-y-4">
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
                  {getUnitQuantityLabel(pendingCartProduct.unitQuantity)}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>{t("Available")}</span>
                <span>{pendingCartProduct.unitQuantity.quantity}</span>
              </div>
            </div>
          ) : null}
        </div>
      </CustomModal>

      <CustomModal
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        title={t("Comments")}
        showFooter={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={() => setIsNoteDialogOpen(false)}>
              {t("Save")}
            </Button>
          </>
        }
      >
        <UniFieldInput
          as="textarea"
          value={saleNote}
          onChange={(event) => setSaleNote(event.target.value)}
          placeholder={t("add_note_placeholder")}
          rows={4}
        />
      </CustomModal>

      <CustomModal
        open={isLayawayDialogOpen}
        onOpenChange={setIsLayawayDialogOpen}
        title={t("Layaway Parameters")}
        className="w-[94vw] !max-w-[94vw] md:!max-w-[760px]"
        bodyClassName="max-h-[72vh] overflow-y-auto"
        showFooter={true}
        footer={
          <div className="flex w-full flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={handleSkipLayaway}>
              {t("Skip Instalments")}
            </Button>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => setIsLayawayDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmitLayaway}>{t("Proceed")}</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 p-3 text-lg font-bold text-blue-950">
            <span>{t("Minimum Payment")}</span>
            <span>{formatMoney(minimumLayawayPayment)}</span>
          </div>
          <UniFieldInput
            label={t("Installments")}
            value={layawayCount}
            onChange={(event) => {
              setLayawayCount(event.target.value)
              generateLayawayLines(event.target.value)
            }}
            type="number"
            min="0"
            placeholder={t("Define the installments for the current order.")}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-lg font-bold">{t("Instalments & Payments")}</h3>
              <div className="text-sm font-semibold">
                <span>{formatMoney(layawayLines.reduce((sum, line) => sum + money(line.amount), 0))}</span>
                <span className="mx-1 text-muted-foreground">/</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
            </div>
            <div className="rounded-md bg-green-50 p-2 text-center text-sm font-semibold text-green-700">
              {t("The final payment date must be the last within the instalments.")}
            </div>
            {layawayLines.length ? (
              <div className="space-y-2">
                {layawayLines.map((line, index) => (
                  <div key={index} className="grid gap-2 rounded-md border border-slate-200 p-2 md:grid-cols-[1fr_1fr_auto]">
                    <DatePicker
                      label={t("Date")}
                      value={parseLocalDate(line.date)}
                      onChange={(date) =>
                        setLayawayLines((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, date: formatLocalDate(date) } : item
                          )
                        )
                      }
                    />
                    <UniFieldInput
                      label={t("Amount")}
                      type="number"
                      min="0"
                      prefix={posOptions.currency_symbol}
                      value={line.amount}
                      onChange={(event) =>
                        setLayawayLines((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, amount: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="self-end text-red-500 hover:text-red-600"
                      onClick={() => setLayawayLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 p-3 text-center text-sm font-semibold text-muted-foreground">
                {t("There is no instalment defined. Please set how many instalments are allowed for this order")}
              </div>
            )}
          </div>
        </div>
      </CustomModal>

      <CustomModal
        open={isCouponsDialogOpen}
        onOpenChange={setIsCouponsDialogOpen}
        title={t("Load Coupon")}
        className="w-[95vw] !max-w-[560px]"
        showFooter={Boolean(couponInput.trim())}
        footer={
          couponInput.trim() ? (
            <div className="grid w-full grid-cols-2 gap-2">
              <Button type="button" onClick={() => setIsCouponsDialogOpen(false)}>
                {t("Apply")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setCouponInput("")
                  setSelectedCouponId("")
                }}
              >
                {t("Cancel")}
              </Button>
            </div>
          ) : null
        }
        bodyClassName="pt-0 px-4 pb-4"
      >
        <Tabs defaultValue={(couponInput || selectedCouponId) ? "active-coupons" : "apply-coupon"}>
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="apply-coupon">{t("Apply A Coupon")}</TabsTrigger>
            <TabsTrigger value="active-coupons">{t("Active Coupons")}</TabsTrigger>
          </TabsList>
          <TabsContent value="apply-coupon" className="space-y-4 pt-4">
            <UniFieldInput
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              placeholder={t("Coupon Code")}
              addonAfter={
                <Button type="button" variant="outline" className="h-10 border-2 rounded-l-none" onClick={() => setIsCouponsDialogOpen(false)}>
                  {t("Load")}
                </Button>
              }
            />
            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm font-medium text-blue-900">
              {t("Input the coupon code that should apply to the POS. If a coupon is issued for a customer, that customer must be selected priorly.")}
            </div>
            {customerId ? (
              <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-medium text-green-900">
                {t("Loading Coupon For : ")} {customerDisplayName(selectedCustomer)}
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full" onClick={() => setIsCustomerSelectOpen(true)}>
                {t("Click here to choose a customer.")}
              </Button>
            )}
          </TabsContent>
          <TabsContent value="active-coupons" className="pt-4">
            <div className="space-y-2">
              {selectedCouponId || couponInput ? (
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {couponOptions.find((coupon: any) => String(coupon.id) === selectedCouponId)?.name ||
                          couponInput ||
                          t("Coupon")}
                      </p>
                      {couponInput ? (
                        <p className="text-xs font-medium text-muted-foreground">{couponInput}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => {
                        setSelectedCouponId("")
                        setCouponInput("")
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-sm font-semibold text-muted-foreground">
                  {t("No coupons applies to the cart.")}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CustomModal>

      <CustomModal
        open={isOrderSettingsOpen}
        onOpenChange={setIsOrderSettingsOpen}
        title={t("Settings")}
        description={t("Change the current order settings.")}
        showFooter={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOrderSettingsOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={() => setIsOrderSettingsOpen(false)}>
              {t("Save")}
            </Button>
          </>
        }
      >
        <UniFieldInput
          label={t("Name")}
          value={orderTitle}
          onChange={(event) => setOrderTitle(event.target.value)}
          placeholder={t("Order Reference")}
        />
      </CustomModal>

      <CustomModal
        open={isTaxesDialogOpen}
        onOpenChange={setIsTaxesDialogOpen}
        title={t("Tax & Summary")}
        showFooter={false}
        bodyClassName="px-4 pb-4 pt-0"
      >
        <Tabs defaultValue="settings">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="settings">{t("Settings")}</TabsTrigger>
            <TabsTrigger value="summary">{t("Summary")}</TabsTrigger>
            {["products_vat", "products_variable_vat"].includes(String(posOptions.pos_vat)) ? (
              <TabsTrigger value="product-taxes">{t("Product Taxes")}</TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="settings" className="space-y-4 pt-4">
            <UniFieldSelect
              label={t("Select Tax")}
              value={cartTaxGroupId}
              onValueChange={setCartTaxGroupId}
              placeholder={t("Select Tax")}
              disabled={!["variable_vat", "products_variable_vat"].includes(String(posOptions.pos_vat))}
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
              disabled={!["variable_vat", "products_variable_vat"].includes(String(posOptions.pos_vat))}
            >
              <SelectItem value="exclusive">{t("Exclusive")}</SelectItem>
              <SelectItem value="inclusive">{t("Inclusive")}</SelectItem>
            </UniFieldSelect>
            <div className="flex justify-end">
              <Button onClick={() => setIsTaxesDialogOpen(false)}>
                {t("Save")}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="summary" className="space-y-2 pt-4">
            <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-sm font-semibold text-muted-foreground">
              {t("No tax is active")}
            </div>
          </TabsContent>
          <TabsContent value="product-taxes" className="pt-4">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold">
              <span>{t("Product Taxes")}</span>
              <span>{formatMoney(0)}</span>
            </div>
          </TabsContent>
        </Tabs>
      </CustomModal>

      <CustomModal
        open={isCartDiscountDialogOpen}
        onOpenChange={setIsCartDiscountDialogOpen}
        title={t("Cart Discount")}
        description={t("Apply a flat or percentage discount to the cart subtotal.")}
        showFooter={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCartDiscountDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleApplyCartDiscount}>
              {t("Apply Discount")}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
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
      </CustomModal>

      <CustomModal
        open={activePriceItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActivePriceItem(null)
            setPriceInput("")
          }
        }}
        title={t("Price")}
        description={activePriceItem?.name || ""}
        showFooter
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setActivePriceItem(null)
                setPriceInput("")
              }}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleApplyItemPrice}>{t("Save")}</Button>
          </>
        }
      >
        <UniFieldInput
          label={t("Price")}
          value={priceInput}
          onChange={(event) => setPriceInput(event.target.value)}
          placeholder={t("Enter price")}
          prefix={posOptions.currency_symbol}
          type="number"
          min="0"
        />
      </CustomModal>

      <CustomModal
        open={activeDiscountItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDiscountItem(null)
          }
        }}
        title={t("Item Discount")}
        description={`${t("Apply a flat or percentage discount to")} ${activeDiscountItem?.name || ""}.`}
        showFooter={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setActiveDiscountItem(null)}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleApplyItemDiscount}>
              {t("Apply Discount")}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
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
      </CustomModal>

      <CustomModal
        open={isShippingBillingOpen}
        onOpenChange={setIsShippingBillingOpen}
        title={t("Shipping & Billing")}
        description={customerDisplayName(selectedCustomer)}
        className="w-[94vw] !max-w-[94vw] overflow-hidden p-0 lg:!max-w-[1120px]"
        bodyClassName="max-h-[78vh] overflow-y-auto px-5 py-4"
        showFooter={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsShippingBillingOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={saveShippingBilling}>{t("Save")}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {!selectedCustomer ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              {t("Please select a customer before proceeding")}
            </div>
          ) : null}

          <Tabs
            value={shippingBillingTab}
            onValueChange={(value) => setShippingBillingTab(value as "general" | "shipping" | "billing")}
          >
            <TabsList variant="line" className="w-full justify-start border-b border-slate-200">
              <TabsTrigger value="general">{t("General Shipping")}</TabsTrigger>
              <TabsTrigger value="billing">{t("Billing Address")}</TabsTrigger>
              <TabsTrigger value="shipping">{t("Shipping Address")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-5">
              <div className="grid gap-4 md:grid-cols-2">
                <UniFieldSelect
                  label={t("Shipping Type")}
                  value={shippingInfo.shipping_type || "flat"}
                  onValueChange={(value) => setShippingInfo((current: any) => ({ ...current, shipping_type: value }))}
                  placeholder={t("Choose an option")}
                  required
                >
                  <SelectItem value="flat">{t("Flat")}</SelectItem>
                </UniFieldSelect>
                <UniFieldInput
                  label={t("Shipping Fees")}
                  value={shippingInfo.shipping}
                  onChange={(event) => setShippingInfo((current: any) => ({ ...current, shipping: event.target.value }))}
                  type="number"
                  min="0"
                  prefix={posOptions.currency_symbol}
                  placeholder={t("0")}
                />
              </div>
            </TabsContent>

            {(["billing", "shipping"] as const).map((type) => (
              <TabsContent key={type} value={type} className="mt-5">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(shippingInfo[`use_customer_${type}`])}
                      onChange={(event) => {
                        const checked = event.target.checked
                        if (checked && !fillCustomerAddress(type)) return
                        setShippingInfo((current: any) => ({
                          ...current,
                          [`use_customer_${type}`]: checked,
                        }))
                      }}
                    />
                    {type === "shipping" ? t("Use Customer Shipping") : t("Use Customer Billing")}
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {addressFields.map(([field, label, placeholder]) => (
                      <UniFieldInput
                        key={`${type}-${field}`}
                        label={label}
                        placeholder={placeholder}
                        value={shippingInfo[`${type}_${field}`] || ""}
                        onChange={(event) =>
                          setShippingInfo((current: any) => ({
                            ...current,
                            [`${type}_${field}`]: event.target.value,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </CustomModal>

      <CustomModal
        open={isCustomerSelectOpen}
        onOpenChange={setIsCustomerSelectOpen}
        title={t("Customer List")}
        className="w-[90vw] !max-w-[720px]"
        showFooter={false}
      >
        <div className="flex min-h-[460px] flex-col p-2">
          <div className="border-b pb-3">
            <UniFieldInput
              value={customerSearchTerm}
              onChange={(event) => setCustomerSearchTerm(event.target.value)}
              placeholder={t("Search Customer")}
            />
          </div>
          <div className="flex-auto overflow-y-auto pt-3">
            {filteredCustomers.length ? (
              <ul className="space-y-1">
                {filteredCustomers.map((customer: any) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const selectedId = String(customer.id)
                        setCustomerId(selectedId)
                        setIsCustomerSelectOpen(false)
                        setCustomerSearchTerm("")
                        onCustomerSelected?.(selectedId)
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-slate-900">
                          {customerDisplayName(customer)}
                        </h4>
                        <p className="text-xs font-medium text-muted-foreground">
                          {customerGroupName(customer)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-sm font-semibold">
                        <div className="text-slate-900">
                          {formatMoney(customer.purchases_amount || customer.total_sales || 0)}
                        </div>
                        <div className={money(customer.owed_amount) > 0 ? "text-red-600" : "text-muted-foreground"}>
                          {formatMoney(customer.owed_amount || customer.account_amount || 0)}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {t("No customers found.")}
              </p>
            )}
          </div>
        </div>
      </CustomModal>

      {/* Order Type Picker */}
      <CustomModal
        open={isOrderTypeOpen}
        onOpenChange={setIsOrderTypeOpen}
        title={t("Order Type")}
        showFooter={false}
        className="sm:max-w-[380px]"
      >
        <div className="grid grid-cols-2 gap-3 p-2">
          {enabledOrderTypes.map((type) => {
            const isActive = activeOrderType === type.value
            const Icon = type.value === "delivery" ? Truck : ShoppingBag
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setOrderType(type.value)
                  setIsOrderTypeOpen(false)
                  onOrderTypeSelected?.(type.value)
                }}
                className={[
                  "group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 px-4 py-8 text-center transition-all duration-150",
                  isActive
                    ? "border-slate-900 bg-slate-900 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm",
                ].join(" ")}
              >
                {isActive && (
                  <CheckCircle2 className="absolute right-2.5 top-2.5 size-4 text-white" />
                )}
                <div className={[
                  "flex size-12 items-center justify-center rounded-full",
                  isActive ? "bg-white/15" : "bg-slate-100 group-hover:bg-slate-200",
                ].join(" ")}>
                  <Icon className={[
                    "size-6 transition",
                    isActive ? "text-white" : "text-slate-600",
                  ].join(" ")} />
                </div>
                <span className={[
                  "text-sm font-semibold",
                  isActive ? "text-white" : "text-slate-800",
                ].join(" ")}>
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>
      </CustomModal>
    </>
  )
}
