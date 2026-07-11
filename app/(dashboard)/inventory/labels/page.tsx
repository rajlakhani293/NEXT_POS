"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Home, Printer, Search, Settings, Eye, Trash2, Sliders, LayoutGrid } from "lucide-react"
import { useRouter } from "next/navigation"
import JsBarcode from "jsbarcode"

import { Button } from "@/components/ui/button"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { PermissionGuard } from "@/components/permission-guard"
import { Spinner } from "@/components/ui/spinner"
import { SelectItem } from "@/components/ui/select"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { Switch } from "@/components/ui/switch"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { useAppSelector } from "@/lib/redux/hooks"
import { showToast } from "@/lib/toast"
import { PERMISSIONS } from "@/lib/permissions"

// Barcode rendering component wrapping JsBarcode
function BarcodeRender({ value, height = 40, displayValue = true }: { value: string; height?: number; displayValue?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          height: height,
          displayValue: displayValue,
          margin: 0,
          fontSize: 12,
          textMargin: 2,
        })
      } catch (e) {
        console.error("Barcode generation error", e)
      }
    }
  }, [value, height, displayValue])

  return <svg ref={svgRef} className="mx-auto max-w-full" />
}

interface SelectedProduct {
  id: string
  name: string
  sku?: string
  copies: number | string
  unit_quantities: any[]
  selected_unit_quantity_id: string
}

export default function PrintLabelsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const companyName = useAppSelector((state) => state.session.company?.name)
  const storeName = companyName || t("POS Store")
  const currencyIndicator =
    posOptions.currency_preferred === "iso"
      ? posOptions.currency_iso
      : posOptions.currency_symbol
  const formatMoney = (value: any) => {
    const amount = Number(value || 0).toFixed(posOptions.currency_precision)
    return posOptions.currency_position === "after"
      ? `${amount}${currencyIndicator}`
      : `${currencyIndicator}${amount}`
  }

  const [getProductsDropdown, { data: productsResponse, isLoading: isProductsLoading }] = (
    catalog as any
  ).useGetProductsDropdownMutation()
  const [getProductUnitQuantities] = (catalog as any).useGetProductUnitQuantitiesMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])

  // Tab state for mobile responsiveness
  const [activeTab, setActiveTab] = useState<"preview" | "settings">("preview")

  // Basic settings
  const [maxColumns, setMaxColumns] = useState(3)
  const [barcodeHeight, setBarcodeHeight] = useState(40)
  const [documentWidth, setDocumentWidth] = useState(800)
  const [labelHeight, setLabelHeight] = useState(130)
  const [borderStyle, setBorderStyle] = useState<"solid" | "dashed" | "none">("solid")

  // Visibility settings
  const [showStoreName, setShowStoreName] = useState(true)
  const [showProductName, setShowProductName] = useState(true)
  const [showProductPrice, setShowProductPrice] = useState(true)
  const [showBarcodeText, setShowBarcodeText] = useState(true)

  useEffect(() => {
    getProductsDropdown()
  }, [getProductsDropdown])

  const productsList = productsResponse?.data || []

  // Filter products dropdown matching search
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return []
    const term = searchTerm.toLowerCase()
    return productsList.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term)
    )
  }, [searchTerm, productsList])

  const handleAddProduct = async (product: any) => {
    setSearchTerm("")
    // Prevent adding duplicates of the same product
    if (selectedProducts.some((p) => p.id === String(product.id))) {
      showToast.error(t("{product} is already added.").replace("{product}", product.name))
      return
    }

    try {
      const unitsRes = await getProductUnitQuantities({ productId: product.id }).unwrap()
      const unitQuantities = unitsRes?.data || []

      const defaultUnitId = unitQuantities.length > 0 ? String(unitQuantities[0].id) : ""

      const newSelected: SelectedProduct = {
        id: String(product.id),
        name: product.name,
        sku: product.sku,
        copies: 1,
        unit_quantities: unitQuantities,
        selected_unit_quantity_id: defaultUnitId,
      }
      setSelectedProducts((prev) => [...prev, newSelected])
      showToast.success(t("{product} added to list.").replace("{product}", product.name))
    } catch {
      showToast.error(t("Failed to load unit configurations for {product}.").replace("{product}", product.name))
    }
  }

  const handleUpdateCopies = (id: string, copies: string | number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const val = copies === "" ? "" : Number(copies)
          return { ...p, copies: val }
        }
        return p
      })
    )
  }

  const handleUpdateUnit = (id: string, unitQtyId: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected_unit_quantity_id: unitQtyId } : p))
    )
  }

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id))
  }

  // Build the list of labels to render based on product copies count
  const labelsToPrint = useMemo(() => {
    const list: Array<{
      key: string
      name: string
      barcode: string
      price: number
      unitName: string
    }> = []

    selectedProducts.forEach((p) => {
      const selectedUQ = p.unit_quantities.find(
        (uq) => String(uq.id) === p.selected_unit_quantity_id
      )
      const barcodeValue = selectedUQ?.barcode || p.sku || "000000"
      const price = Number(selectedUQ?.sale_price || 0)
      const unitName = selectedUQ?.unit_name || selectedUQ?.unit__name || ""

      for (let i = 0; i < (p.copies as number); i++) {
        list.push({
          key: `${p.id}-${p.selected_unit_quantity_id}-${i}`,
          name: p.name,
          barcode: barcodeValue,
          price,
          unitName,
        })
      }
    })

    return list
  }, [selectedProducts])

  const handlePrint = () => {
    if (labelsToPrint.length === 0) {
      showToast.error(t("Add at least one product label to print."))
      return
    }
    window.print()
  }

  return (
    <DashboardPage padding="none">
      <PermissionGuard permission={PERMISSIONS.products.labels}>
        <div className="flex h-full min-h-0 flex-col">
        {/* Top Header Section */}
        <div className="flex-none border-b border-gray-200 bg-white px-6 py-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 transition-all hover:bg-slate-50"
                onClick={() => router.push("/inventory/products")}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t("Print Barcode Labels")}</h1>
                <p className="text-sm text-gray-500">
                  {t("Generate and print custom barcode labels for store inventory items.")}
                </p>
              </div>
            </div>
            <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:shadow-md">
              <Printer className="size-4" />
              {t("Print Labels")}
            </Button>
          </div>
        </div>

        {/* Mobile Tab Switched - Hidden on Desktop (lg) */}
        <div className="flex border-b border-slate-200 bg-white lg:hidden no-print flex-none">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${activeTab === "preview"
              ? "border-blue-600 text-blue-600 bg-blue-50/10"
              : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            {t("Design Preview")} ({labelsToPrint.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${activeTab === "settings"
              ? "border-blue-600 text-blue-600 bg-blue-50/10"
              : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            {t("Settings & Items")} ({selectedProducts.length})
          </button>
        </div>

        {/* Main Workspace */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_390px]">
          {/* LEFT COLUMN: Printable Preview Paper */}
          <div className={`flex flex-col bg-slate-50/60 overflow-hidden no-print ${activeTab === "preview" ? "flex" : "hidden lg:flex"}`}>
            <div className="flex-1 overflow-auto bg-slate-50 p-6 flex justify-center items-start">
              {labelsToPrint.length > 0 ? (
                <div
                  id="label-printing-paper"
                  className=" h-full w-full text-slate-400 gap-4 p-8 bg-white rounded-2xl border border-dashed border-slate-200"
                >
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${maxColumns}, minmax(0, 1fr))`,
                    }}
                  >
                    {labelsToPrint.map((label) => (
                      <div
                        key={label.key}
                        className="p-2 text-center flex flex-col justify-between text-black dark:text-black"
                        style={{
                          height: `${labelHeight}px`,
                          border: borderStyle !== "none" ? `1px ${borderStyle} #000000` : "none",
                        }}
                      >
                        {showStoreName && (
                          <p className="text-[10px] font-bold tracking-wider text-black dark:text-black uppercase truncate shrink-0 text-left w-full">
                            {storeName}
                          </p>
                        )}
                        <div className="shrink-0">
                          {showProductName && (
                            <p className="text-xs font-bold text-black dark:text-black truncate leading-tight">
                              {label.name}
                            </p>
                          )}
                          {label.unitName && (
                            <p className="text-[9px] text-gray-500 dark:text-gray-500 truncate leading-none mt-0.5">
                              {t("Unit")}: {label.unitName}
                            </p>
                          )}
                        </div>

                        <div className="my-1 shrink-0">
                          <BarcodeRender value={label.barcode} height={barcodeHeight} displayValue={false} />
                          {showBarcodeText && (
                            <p className="text-[9px] font-mono tracking-widest text-black dark:text-black mt-0.5">
                              {label.barcode}
                            </p>
                          )}
                        </div>

                        {showProductPrice && (
                          <p className="text-xs font-bold text-black dark:text-black leading-none mt-0.5 shrink-0">
                            {formatMoney(label.price)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 gap-4 p-8 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="p-4 bg-slate-50 rounded-full">
                    <Sliders className="size-10 text-slate-400 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-800">{t("Preview Paper is Empty")}</p>
                    <p className="text-xs text-slate-500 max-w-xs">{t("Search and add products to start designing labels.")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Control Panel */}
          <div className={`bg-white p-6 overflow-y-auto no-scrollbar no-print space-y-6 lg:border-l lg:border-slate-200 ${activeTab === "settings" ? "block" : "hidden lg:block"}`}>
            {/* Section 1: Search & Add Products */}
            <div className="space-y-4">
              <div className="relative">
                <UniFieldInput
                  label={t("Add Products")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Search by name, SKU, or barcode...")}
                  prefix={<Search className="size-4 text-slate-400" />}
                  allowClear
                  onClear={() => setSearchTerm("")}
                />

                {filteredSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-50 py-1 divide-y divide-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {filteredSuggestions.map((product: any) => (
                      <li
                        key={product.id}
                        onClick={() => handleAddProduct(product)}
                        className="flex flex-col px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-900">{product.name}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{t("SKU")}: <strong className="text-slate-700">{product.sku || "-"}</strong></span>
                          <span className="text-slate-300">•</span>
                          <span>{t("Barcode")}: <strong className="text-slate-700">{product.barcode || "-"}</strong></span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* List of included products */}
              {selectedProducts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">{t("Included Items")}</h3>
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-3 relative hover:border-slate-200 transition-all duration-200"
                      >
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="absolute right-2.5 top-2.5 p-1.5 hover:bg-red-50 text-red-500 rounded-sm transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <div className="pr-6">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t("SKU")}: {product.sku || "-"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 items-end">
                          <UniFieldSelect
                            label={t("Selling Unit")}
                            value={product.selected_unit_quantity_id}
                            onValueChange={(val) => handleUpdateUnit(product.id, val)}
                            size="sm"
                          >
                            {product.unit_quantities.map((uq: any) => (
                              <SelectItem key={uq.id} value={String(uq.id)}>
                                {uq.unit_name || uq.unit__name} ({formatMoney(uq.sale_price)})
                              </SelectItem>
                            ))}
                          </UniFieldSelect>
                          <UniFieldInput
                            label={t("No. of Labels")}
                            type="number"
                            min={1}
                            value={product.copies}
                            onChange={(e) => handleUpdateCopies(product.id, e.target.value)}
                            className="h-8 text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Layout Options */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900">{t("Layout Settings")}</h2>

              <div className="space-y-3">
                <UniFieldSelect
                  label={t("Max Columns")}
                  value={String(maxColumns)}
                  onValueChange={(val) => setMaxColumns(Number(val))}
                >
                  {[1, 2, 3, 4, 5, 6].map((col) => (
                    <SelectItem key={col} value={String(col)}>
                      {col} {t(col > 1 ? "Columns" : "Column")}
                    </SelectItem>
                  ))}
                </UniFieldSelect>

                <UniFieldSelect
                  label={t("Border Style")}
                  value={borderStyle}
                  onValueChange={(val: any) => setBorderStyle(val)}
                >
                  <SelectItem value="solid">{t("Solid Line")}</SelectItem>
                  <SelectItem value="dashed">{t("Dashed Line")}</SelectItem>
                  <SelectItem value="none">{t("No Border")}</SelectItem>
                </UniFieldSelect>

                <div className="grid grid-cols-3 gap-2.5">
                  <UniFieldInput
                    label={t("Paper Width")}
                    type="number"
                    value={documentWidth}
                    onChange={(e) => setDocumentWidth(Number(e.target.value))}
                    className="font-bold text-center border-slate-200"
                  />
                  <UniFieldInput
                    label={t("Label Height")}
                    type="number"
                    value={labelHeight}
                    onChange={(e) => setLabelHeight(Number(e.target.value))}
                    className="font-bold text-center border-slate-200"
                  />
                  <UniFieldInput
                    label={t("Barcode Height")}
                    type="number"
                    value={barcodeHeight}
                    onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                    className="font-bold text-center border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Visibility Settings */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900">{t("Field Visibility")}</h2>

              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">{t("Show Store Name")}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{storeName}</p>
                  </div>
                  <Switch checked={showStoreName} onCheckedChange={setShowStoreName} className="data-[state=checked]:bg-blue-600" />
                </div>

                <div className="flex items-center justify-between py-3">
                  <p className="text-sm font-bold text-slate-900">{t("Show Product Name")}</p>
                  <Switch checked={showProductName} onCheckedChange={setShowProductName} className="data-[state=checked]:bg-blue-600" />
                </div>

                <div className="flex items-center justify-between py-3">
                  <p className="text-sm font-bold text-slate-900">{t("Show Product Price")}</p>
                  <Switch checked={showProductPrice} onCheckedChange={setShowProductPrice} className="data-[state=checked]:bg-blue-600" />
                </div>

                <div className="flex items-center justify-between py-3">
                  <p className="text-sm font-bold text-slate-900">{t("Show Barcode Text")}</p>
                  <Switch checked={showBarcodeText} onCheckedChange={setShowBarcodeText} className="data-[state=checked]:bg-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global CSS style block for printing */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            /* Reset body padding/margin to print absolute paper bounds */
            div, section, main, body, html {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              overflow: visible !important;
              height: auto !important;
              min-height: 0 !important;
            }
            /* Render only the printing paper */
            #label-printing-paper {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
              visibility: visible !important;
            }
            #label-printing-paper * {
              visibility: visible !important;
            }
          }
        `
        }} />
        </div>
      </PermissionGuard>
    </DashboardPage>
  )
}
