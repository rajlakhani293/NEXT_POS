"use client"

import React from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import CustomModal from "@/components/ui/customModal"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { formatBusinessDateTime, formatBusinessMoney } from "@/lib/format"

const money = (value: string | number | null | undefined) =>
  Number(value || 0) || 0

interface SalesModalsProps {
  // Localization & Options
  t: (key: string) => string
  posOptions: any

  // Product Search
  isProductSearchOpen: boolean
  setIsProductSearchOpen: (open: boolean) => void
  productSearchTerm: string
  setProductSearchTerm: (term: string) => void
  handleProductSearch: () => void
  productSearchState: { isLoading: boolean }
  productSearchResults: any[]
  handleProductSearchPick: (product: any) => void

  // Payment
  isPaymentDialogOpen: boolean
  setIsPaymentDialogOpen: (open: boolean) => void
  activePaymentLabel: string
  paymentTypeOptions: any[]
  activePaymentType: string
  setActivePaymentType: (type: string) => void
  showPaymentList: boolean
  setShowPaymentList: (show: boolean) => void
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
  handleCompleteSale: (opts?: { paymentStatus?: string }) => void
  isCreatingSale: boolean
  ordersAllowUnpaid: boolean
  ordersAllowPartial: boolean
  handleSaveAsUnpaid: () => void
  openCartDiscountDialog: () => void

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
  openQuantityDialog: (product: any, uq: any) => void

  // Define Quantity
  pendingCartProduct: any
  setPendingCartProduct: (product: any) => void
  quantityInput: string
  setQuantityInput: (val: string) => void
  allowDecimalQuantities: boolean
  handleConfirmQuantity: () => void

  // Product Price
  priceEditItem: any
  setPriceEditItem: (item: any) => void
  priceInput: string
  setPriceInput: (val: string) => void
  handleApplyProductPrice: () => void

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

  // Quick Product
  isQuickProductDialogOpen: boolean
  setIsQuickProductDialogOpen: (open: boolean) => void
  quickProductForm: any
  updateQuickProductForm: (field: any, value: any) => void
  resetQuickProductForm: () => void
  handleCreateQuickProduct: () => void
  isCreatingQuickProduct: boolean
  isUnitsLoading: boolean
  unitOptions: any[]
  taxGroupOptions: any[]

  // Order Settings
  isOrderSettingsOpen: boolean
  setIsOrderSettingsOpen: (open: boolean) => void
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
}

export default function SalesModals({
  t,
  posOptions,

  isProductSearchOpen,
  setIsProductSearchOpen,
  productSearchTerm,
  setProductSearchTerm,
  handleProductSearch,
  productSearchState,
  productSearchResults,
  handleProductSearchPick,

  isPaymentDialogOpen,
  setIsPaymentDialogOpen,
  activePaymentLabel,
  paymentTypeOptions,
  activePaymentType,
  setActivePaymentType,
  showPaymentList,
  setShowPaymentList,
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
  handleCompleteSale,
  isCreatingSale,
  ordersAllowUnpaid,
  ordersAllowPartial,
  handleSaveAsUnpaid,
  openCartDiscountDialog,

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
  openQuantityDialog,

  pendingCartProduct,
  setPendingCartProduct,
  quantityInput,
  setQuantityInput,
  allowDecimalQuantities,
  handleConfirmQuantity,

  priceEditItem,
  setPriceEditItem,
  priceInput,
  setPriceInput,
  handleApplyProductPrice,

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

  isQuickProductDialogOpen,
  setIsQuickProductDialogOpen,
  quickProductForm,
  updateQuickProductForm,
  resetQuickProductForm,
  handleCreateQuickProduct,
  isCreatingQuickProduct,
  isUnitsLoading,
  unitOptions,
  taxGroupOptions,

  isOrderSettingsOpen,
  setIsOrderSettingsOpen,
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
}: SalesModalsProps) {
  const formatMoney = (value: number | string | null | undefined) =>
    formatBusinessMoney(value, posOptions)

  return (
    <>
      <CustomModal
        open={isProductSearchOpen}
        onOpenChange={setIsProductSearchOpen}
        title={t("Search Product")}
        description={t("Search and select a product to add to the current cart.")}
        className="max-w-3xl"
        showFooter={false}
      >
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
      </CustomModal>

      <CustomModal
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        title={t("Payment")}
        className="h-[92vh] max-w-6xl overflow-hidden p-0"
        headerClassName="sr-only"
        bodyClassName="-mx-0 px-0 py-0 max-h-none h-full border-y-0"
        showFooter={false}
      >
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
      </CustomModal>

      <CustomModal
        open={isOpenShiftDialogOpen}
        onOpenChange={(open) => {
          if (shift) setIsOpenShiftDialogOpen(open)
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
                setIsUnitPickerOpen(false)
                setUnitPickerProduct(null)
                if (unitPickerProduct) {
                  openQuantityDialog(unitPickerProduct, uq)
                }
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
        open={Boolean(priceEditItem)}
        onOpenChange={(open) => {
          if (!open) {
            setPriceEditItem(null)
            setPriceInput("")
          }
        }}
        title={t("Product Price")}
        description={priceEditItem?.name}
        showFooter={true}
        footer={
          <>
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
          </>
        }
      >
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
      </CustomModal>

      <CustomModal
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        title={t("Comments")}
        description={t("Add a note to the current order.")}
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
        <textarea
          value={saleNote}
          onChange={(event) => setSaleNote(event.target.value)}
          placeholder={t("add_note_placeholder")}
          className="min-h-32 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
      </CustomModal>

      <CustomModal
        open={isCouponsDialogOpen}
        onOpenChange={setIsCouponsDialogOpen}
        title={t("Coupons")}
        description={t("Input the coupon code that should apply to the POS. If a coupon is issued for a customer, that customer must be selected priorly.")}
        showFooter={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCouponsDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={() => setIsCouponsDialogOpen(false)}>
              {t("Apply")}
            </Button>
          </>
        }
      >
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
      </CustomModal>

      <CustomModal
        open={isQuickProductDialogOpen}
        onOpenChange={setIsQuickProductDialogOpen}
        title={t("Product / Service")}
        description={t("Create a quick product or service for the current sale.")}
        showFooter={true}
        footer={
          <>
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
          </>
        }
      >
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
        <div className="space-y-4 py-2">
          <UniFieldSelect
            label={t("order_type")}
            value={activeOrderType}
            onValueChange={setOrderType}
            placeholder={t("order_type_select")}
          >
            {enabledOrderTypes.map((type: any) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </UniFieldSelect>
        </div>
      </CustomModal>

      <CustomModal
        open={isTaxesDialogOpen}
        onOpenChange={setIsTaxesDialogOpen}
        title={t("Tax & Summary")}
        description={t("Set the taxes to apply to the cart.")}
        showFooter={true}
        footer={
          <>
            {["variable_vat", "products_variable_vat"].includes(String(posOptions.pos_vat)) ? (
              <Button onClick={() => setIsTaxesDialogOpen(false)}>
                {t("Save")}
              </Button>
            ) : null}
            <Button onClick={() => setIsTaxesDialogOpen(false)}>
              {t("Close")}
            </Button>
          </>
        }
      >
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
      </CustomModal>
    </>
  )
}
