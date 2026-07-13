"use client"

import { useEffect, useState } from "react"
import { ArrowLeftRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import CustomModal from "@/components/ui/customModal"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

interface ProductModalsProps {
  quantitiesProduct: any
  quantitiesMode: "list" | "preview"
  onClose: () => void
  formatMoney: (value: any) => string
  currencyIndicator: string
  posOptions: any
  triggerRefresh: () => void
}

export function ProductModals({
  quantitiesProduct,
  quantitiesMode,
  onClose,
  formatMoney,
  currencyIndicator,
  posOptions,
  triggerRefresh,
}: ProductModalsProps) {
  const { t } = useTranslation()
  const [getProductUnitQuantities, productUnitQuantities] = (catalog as any).useGetProductUnitQuantitiesMutation()
  const [convertProductUnits, convertProductUnitsState] = (catalog as any).useConvertProductUnitsMutation()

  const [conversionProduct, setConversionProduct] = useState<any>(null)
  const [conversionFromId, setConversionFromId] = useState("")
  const [conversionToId, setConversionToId] = useState("")
  const [conversionQuantity, setConversionQuantity] = useState("0")
  const [conversionConfirmMessage, setConversionConfirmMessage] = useState("")

  const quantityRows = productUnitQuantities.data?.data || []

  useEffect(() => {
    if (quantitiesProduct?.id) {
      getProductUnitQuantities({ productId: quantitiesProduct.id })
    }
  }, [quantitiesProduct?.id, getProductUnitQuantities])

  const getQuantityUnit = (quantity: any) => quantity?.unit || {}
  const getQuantityUnitId = (quantity: any) => String(quantity?.unit_id || quantity?.unit?.id || "")
  const getQuantityUnitName = (quantity: any) =>
    quantity?.unit_name ||
    quantity?.unit_short_name ||
    quantity?.unit_identifier ||
    quantity?.unit?.name ||
    quantity?.unit?.identifier ||
    "-"
  const getUnitValue = (quantity: any) => Number(getQuantityUnit(quantity)?.value || quantity?.unit_value || 1)
  const getConversionSource = () =>
    quantityRows.find((quantity: any) => getQuantityUnitId(quantity) === conversionFromId)
  const getConversionDestination = () =>
    quantityRows.find((quantity: any) => getQuantityUnitId(quantity) === conversionToId)
  const getBaseUnitQuantity = () =>
    quantityRows.find((quantity: any) => getQuantityUnit(quantity)?.base_unit || quantity?.base_unit) || quantityRows[0]

  const getConversionState = () => {
    const source = getConversionSource()
    const destination = getConversionDestination()
    const enteredQuantity = Number(conversionQuantity || 0)
    if (!source || !destination) {
      return { source, destination, enteredQuantity, realQuantity: 0, destinationQuantity: 0 }
    }

    const baseUnit = getBaseUnitQuantity()
    const sourceValue = getUnitValue(source)
    const destinationValue = getUnitValue(destination)
    const baseUnitValue = getUnitValue(baseUnit)
    const baseValue = enteredQuantity * sourceValue * baseUnitValue
    const destinationQuantity = destinationValue ? baseValue / destinationValue : 0
    const realQuantity =
      sourceValue < destinationValue
        ? Math.floor(destinationQuantity) * destinationValue
        : enteredQuantity

    return { source, destination, enteredQuantity, realQuantity, destinationQuantity }
  }

  const openConversion = (unitQuantity: any) => {
    const fromId = getQuantityUnitId(unitQuantity)
    const destination = quantityRows.find((quantity: any) => getQuantityUnitId(quantity) !== fromId)
    setConversionProduct(quantitiesProduct)
    setConversionFromId(fromId)
    setConversionToId(destination ? getQuantityUnitId(destination) : "")
    setConversionQuantity("0")
    setConversionConfirmMessage("")
  }

  const closeConversion = () => {
    setConversionProduct(null)
    setConversionConfirmMessage("")
  }

  const updateConversionQuantity = (value: any) => {
    const source = quantityRows.find((quantity: any) => getQuantityUnitId(quantity) === conversionFromId)
    const maxQuantity = Number(source?.quantity || 0)
    let nextQuantity = Number(value || 0)
    if (nextQuantity > maxQuantity) {
      nextQuantity = maxQuantity
      showToast.success(t("The quantity has been set to the maximum available"))
    }
    setConversionQuantity(String(nextQuantity))
  }

  const handleConversionUnitChange = (direction: "from" | "to", unitId: string) => {
    if (direction === "from") {
      setConversionFromId(unitId)
      if (unitId === conversionToId) {
        const nextDestination = quantityRows.find((quantity: any) => getQuantityUnitId(quantity) !== unitId)
        setConversionToId(nextDestination ? getQuantityUnitId(nextDestination) : "")
      }
      updateConversionQuantity(conversionQuantity)
      return
    }

    setConversionToId(unitId)
    if (unitId === conversionFromId) {
      const nextSource = quantityRows.find((quantity: any) => getQuantityUnitId(quantity) !== unitId)
      setConversionFromId(nextSource ? getQuantityUnitId(nextSource) : "")
    }
  }

  const switchConversionPair = () => {
    const state = getConversionState()
    setConversionFromId(conversionToId)
    setConversionToId(conversionFromId)
    setConversionQuantity(String(Math.floor(state.destinationQuantity || 0)))
  }

  const submitConversion = async (force = false) => {
    const state = getConversionState()
    if (state.enteredQuantity <= 0) {
      showToast.error(t("The quantity should be greater than 0"))
      return
    }
    if (Math.floor(state.destinationQuantity) === 0) {
      showToast.error(
        t('The provided quantity can\'t result in any convertion for unit "{destination}"').replace(
          "{destination}",
          getQuantityUnitName(state.destination)
        )
      )
      return
    }

    const sourceName = getQuantityUnitName(state.source)
    const destinationName = getQuantityUnitName(state.destination)
    if (!force) {
      const message =
        state.enteredQuantity !== state.realQuantity
          ? t("Only {quantity}({source}) can be converted to {destinationCount}({destination}). Would you like to proceed ?")
            .replace("{quantity}", String(state.realQuantity))
            .replace("{source}", sourceName)
            .replace("{destinationCount}", String(Math.floor(state.destinationQuantity)))
            .replace("{destination}", destinationName)
          : t("You're about to convert {quantity}({source}) to {destinationCount}({destination}). Would you like to proceed?")
            .replace("{quantity}", String(state.enteredQuantity))
            .replace("{source}", sourceName)
            .replace("{destinationCount}", String(Math.floor(state.destinationQuantity)))
            .replace("{destination}", destinationName)
      setConversionConfirmMessage(message)
      return
    }

    const response = await convertProductUnits({
      productId: conversionProduct.id,
      payLoad: {
        from: Number(conversionFromId),
        to: Number(conversionToId),
        quantity: state.realQuantity,
      },
    }).unwrap()
    showToast.success(response?.message || t("The product {product} has been converted successfully.").replace("{product}", conversionProduct?.name || ""))
    setConversionConfirmMessage("")
    closeConversion()
    triggerRefresh()
    await getProductUnitQuantities({ productId: conversionProduct.id })
  }

  return (
    <>
      <CustomModal
        open={Boolean(quantitiesProduct)}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        title={
          quantitiesMode === "preview"
            ? `${t("Previewing :")} ${quantitiesProduct?.name || ""}`
            : t("Product Unit Quantities List")
        }
        description={
          quantitiesMode === "preview"
            ? t("Units & Quantities")
            : t("Display all product unit quantities.")
        }
        className="sm:max-w-3xl"
        bodyClassName="p-0"
        showFooter={false}
      >
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
          {quantitiesProduct?.name || t("Product")}
        </div>
        <div className="max-h-[50vh] overflow-auto">
          <Table className="w-full text-sm">
            <TableHeader className="sticky top-0 bg-gray-50 text-left text-xs font-bold uppercase text-gray-500">
              {quantitiesMode === "preview" ? (
                <TableRow>
                  <TableHead className="px-4 py-3">{t("Unit")}</TableHead>
                  <TableHead className="px-4 py-3 text-right">{t("Sale Price")}</TableHead>
                  <TableHead className="px-4 py-3 text-right">{t("Wholesale Price")}</TableHead>
                  <TableHead className="px-4 py-3 text-right">{t("Quantity")}</TableHead>
                </TableRow>
              ) : (
                <TableRow>
                  <TableHead className="px-4 py-3">{t("Product")}</TableHead>
                  <TableHead className="px-4 py-3">{t("Unit")}</TableHead>
                  <TableHead className="px-4 py-3 text-right">{t("Quantity")}</TableHead>
                  <TableHead className="px-4 py-3">{t("Updated At")}</TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {productUnitQuantities.isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Spinner />
                      {t("Loading...")}
                    </div>
                  </TableCell>
                </TableRow>
              ) : quantityRows.length ? (
                quantityRows.map((quantity: any) => {
                  const unitName =
                    quantity.unit_name ||
                    quantity.unit_short_name ||
                    quantity.unit_identifier ||
                    quantity.unit?.name ||
                    quantity.unit?.identifier ||
                    "-"
                  return quantitiesMode === "preview" ? (
                    <TableRow key={quantity.id} className="border-t border-gray-100">
                      <TableCell className="px-4 py-3">
                        <span className="font-medium text-gray-900">{unitName}</span>
                        {(quantitiesProduct?.type === "materialized" || quantitiesProduct?.type === "product") &&
                          (quantitiesProduct?.stock_management === "enabled" || quantitiesProduct?.track_stock) ? (
                          <button
                            type="button"
                            className="ml-2 text-xs font-semibold text-blue-600 hover:underline"
                            onClick={() => openConversion(quantity)}
                          >
                            {t("Convert")}
                          </button>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">{formatMoney(quantity.sale_price)}</TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">{formatMoney(quantity.wholesale_price)}</TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {Number(quantity.quantity || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={quantity.id} className="border-t border-gray-100">
                      <TableCell className="px-4 py-3 font-medium text-gray-900">
                        {quantitiesProduct?.name || quantity.product_name || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3">{unitName}</TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {Number(quantity.quantity || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {quantity.updated_at ? new Date(quantity.updated_at).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-10 text-center text-sm font-medium text-gray-500">
                    {t("No product unit quantities has been registered")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CustomModal>

      <CustomModal
        open={Boolean(conversionProduct)}
        onOpenChange={(open) => {
          if (!open) closeConversion()
        }}
        title={t("Unit Conversion : {product}").replace("{product}", conversionProduct?.name || "")}
        showFooter
        className="sm:max-w-3xl"
        bodyClassName="p-0"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeConversion}>
              {t("Close")}
            </Button>
            <Button type="button" onClick={() => submitConversion()} disabled={convertProductUnitsState.isLoading}>
              {convertProductUnitsState.isLoading ? t("Loading...") : t("Convert")}
            </Button>
          </>
        }
      >
        {quantityRows.length > 1 ? (
          <div className="space-y-4 p-4">
            <div className="grid overflow-hidden rounded-md border md:grid-cols-[1fr_auto_1fr]">
              <button
                type="button"
                className="bg-blue-600 p-4 text-center text-white"
              >
                <span className="block text-sm font-semibold">{getQuantityUnitName(getConversionState().source)}</span>
                <span className="mt-2 block text-3xl font-bold">{Number(conversionQuantity || 0).toLocaleString()}</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center border-y bg-gray-50 p-3 md:border-x md:border-y-0"
                onClick={switchConversionPair}
              >
                <ArrowLeftRightIcon className="size-6" />
              </button>
              <button type="button" className="p-4 text-center">
                <span className="block text-sm font-semibold">{getQuantityUnitName(getConversionState().destination)}</span>
                <span className="mt-2 block text-3xl font-bold">
                  {Math.floor(getConversionState().destinationQuantity || 0).toLocaleString()}
                </span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <UniFieldSelect
                label={t("Assigned Unit")}
                value={conversionFromId}
                onValueChange={(value) => handleConversionUnitChange("from", value)}
                hasOptions={Boolean(quantityRows.length)}
              >
                {quantityRows.map((quantity: any) => (
                  <SelectItem key={`conversion-from-${quantity.id}`} value={getQuantityUnitId(quantity)}>
                    {getQuantityUnitName(quantity)}
                  </SelectItem>
                ))}
              </UniFieldSelect>
              <UniFieldSelect
                label={t("Assigned Unit")}
                value={conversionToId}
                onValueChange={(value) => handleConversionUnitChange("to", value)}
                hasOptions={Boolean(quantityRows.length)}
              >
                {quantityRows.map((quantity: any) => (
                  <SelectItem key={`conversion-to-${quantity.id}`} value={getQuantityUnitId(quantity)}>
                    {getQuantityUnitName(quantity)}
                  </SelectItem>
                ))}
              </UniFieldSelect>
            </div>

            <UniFieldInput
              type="number"
              label={t("Quantity")}
              value={conversionQuantity}
              min="0"
              step="0.01"
              onChange={(event) => updateConversionQuantity(event.target.value)}
              addonAfter={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-full rounded-none px-3 text-xs font-bold"
                  onClick={() => updateConversionQuantity(getConversionState().source?.quantity || 0)}
                >
                  {t("Convert {quantity} available").replace(
                    "{quantity}",
                    Number(getConversionState().source?.quantity || 0).toLocaleString()
                  )}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="p-8 text-center text-sm font-medium text-gray-500">
            {productUnitQuantities.isLoading ? t("Loading...") : t("No product unit quantities has been registered")}
          </div>
        )}
      </CustomModal>

      <CustomModal
        open={Boolean(conversionConfirmMessage)}
        onOpenChange={(open) => {
          if (!open) setConversionConfirmMessage("")
        }}
        title={
          getConversionState().enteredQuantity !== getConversionState().realQuantity
            ? t("Conversion Warning")
            : t("Confirm Conversion")
        }
        showFooter
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setConversionConfirmMessage("")}>
              {t("Close")}
            </Button>
            <Button type="button" onClick={() => submitConversion(true)} disabled={convertProductUnitsState.isLoading}>
              {convertProductUnitsState.isLoading ? t("Loading...") : t("Confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm font-medium text-gray-700">{conversionConfirmMessage}</p>
      </CustomModal>
    </>
  )
}
