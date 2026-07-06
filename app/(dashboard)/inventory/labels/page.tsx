"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Home, Printer, Search, Settings, Eye, Trash2, Sliders } from "lucide-react"
import { useRouter } from "next/navigation"
import JsBarcode from "jsbarcode"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { catalog } from "@/lib/api/catalog"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
import { useAppSelector } from "@/lib/redux/hooks"
import { showToast } from "@/lib/toast"

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
  copies: number
  unit_quantities: any[]
  selected_unit_quantity_id: string
}

export default function PrintLabelsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const posOptions = usePosOptions()
  const storeNameSetting = useAppSelector(
    (state) => state.session.businessSettings?.settings?.store_name
  )
  const companyName = useAppSelector((state) => state.session.company?.name)
  const storeName = storeNameSetting || companyName || t("POS Store")
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

  const handleUpdateCopies = (id: string, copies: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, copies: Math.max(copies, 1) } : p))
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

      for (let i = 0; i < p.copies; i++) {
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
    <div className="flex h-full min-h-0 flex-col">
      {/* Top Header Section */}
      <div className="flex-none border-b border-gray-200 bg-white px-6 py-4 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => router.push("/inventory/products")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t("Print Barcode Labels")}</h1>
              <p className="text-sm text-gray-500">
                {t("Generate and print custom barcode labels for store inventory items.")}
              </p>
            </div>
          </div>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="size-4" />
            {t("Print Labels")}
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT COLUMN: Printable Preview Paper */}
        <div className="flex flex-col rounded-3xl border border-gray-200 bg-slate-900 overflow-hidden no-print">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3 text-slate-400">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-200">{t("Layout Preview")}</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {t("Rendering {count} total labels").replace("{count}", String(labelsToPrint.length))}
            </span>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
            {labelsToPrint.length > 0 ? (
              <div
                id="label-printing-paper"
                className="bg-white p-4 shadow-2xl transition-all"
                style={{
                  width: `${documentWidth}px`,
                  minHeight: "400px",
                }}
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
                      className="p-3 text-center flex flex-col justify-between"
                      style={{
                        height: `${labelHeight}px`,
                        border: borderStyle !== "none" ? `1px ${borderStyle} #000000` : "none",
                      }}
                    >
                      {showStoreName && (
                        <p className="text-[10px] font-bold tracking-wider text-black uppercase truncate">
                          {storeName}
                        </p>
                      )}
                      <div>
                        {showProductName && (
                          <p className="text-xs font-bold text-black truncate leading-tight">
                            {label.name}
                          </p>
                        )}
                        {label.unitName && (
                          <p className="text-[9px] text-gray-500 truncate leading-none mt-0.5">
                            {t("Unit")}: {label.unitName}
                          </p>
                        )}
                      </div>
                      
                      <div className="my-1">
                        <BarcodeRender value={label.barcode} height={barcodeHeight} displayValue={false} />
                        {showBarcodeText && (
                          <p className="text-[9px] font-mono tracking-widest text-black mt-0.5">
                            {label.barcode}
                          </p>
                        )}
                      </div>

                      {showProductPrice && (
                        <p className="text-xs font-bold text-black leading-none mt-0.5">
                          {formatMoney(label.price)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-slate-500 gap-3">
                <Sliders className="size-16 opacity-20 text-slate-400" />
                <p className="text-sm font-semibold">{t("Preview Paper is Empty")}</p>
                <p className="text-xs text-slate-600">{t("Search and add products to start designing labels.")}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Control Panel */}
        <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar no-print">
          {/* Section 1: Search & Add Products */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">{t("Add Products")}</h2>
              <p className="text-xs text-gray-500">{t("Scan barcode or search items to print.")}</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("Search by name, SKU, or barcode...")}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />

              {filteredSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1">
                  {filteredSuggestions.map((product: any) => (
                    <li
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="flex flex-col px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-b-0"
                    >
                      <span className="text-xs font-bold text-gray-900">{product.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {t("SKU")}: {product.sku || "-"} · {t("Barcode")}: {product.barcode || "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* List of included products */}
            {selectedProducts.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Included Items")}</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-xl border border-gray-100 bg-slate-50/70 p-3 space-y-2 relative"
                    >
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      <div className="pr-6">
                        <p className="text-xs font-bold text-gray-950 truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-500">{t("SKU")}: {product.sku || "-"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-0.5">{t("Selling Unit")}</label>
                          <Select
                            value={product.selected_unit_quantity_id}
                            onValueChange={(val) => handleUpdateUnit(product.id, val)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-white">
                            <SelectValue placeholder={t("Unit")} />
                            </SelectTrigger>
                            <SelectContent className="max-h-40">
                              {product.unit_quantities.map((uq: any) => (
                                <SelectItem key={uq.id} value={String(uq.id)}>
                                  {uq.unit_name || uq.unit__name} ({formatMoney(uq.sale_price)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-0.5">{t("No. of Labels")}</label>
                          <input
                            type="number"
                            min={1}
                            value={product.copies}
                            onChange={(e) => handleUpdateCopies(product.id, Number(e.target.value))}
                            className="h-7 w-full rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Layout Options */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">{t("Layout Settings")}</h2>
              <p className="text-xs text-gray-500">{t("Customize paper size, column structure, and label heights.")}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Max Columns")}</label>
                <Select value={String(maxColumns)} onValueChange={(val) => setMaxColumns(Number(val))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("Columns")} />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((col) => (
                      <SelectItem key={col} value={String(col)}>
                        {col} {t(col > 1 ? "Columns" : "Column")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Border Style")}</label>
                <Select value={borderStyle} onValueChange={(val: any) => setBorderStyle(val)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("Border Style")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">{t("Solid Line")}</SelectItem>
                    <SelectItem value="dashed">{t("Dashed Line")}</SelectItem>
                    <SelectItem value="none">{t("No Border")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">{t("Paper Width")}</label>
                  <input
                    type="number"
                    value={documentWidth}
                    onChange={(e) => setDocumentWidth(Number(e.target.value))}
                    className="h-9 w-full rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">{t("Label Height")}</label>
                  <input
                    type="number"
                    value={labelHeight}
                    onChange={(e) => setLabelHeight(Number(e.target.value))}
                    className="h-9 w-full rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">{t("Barcode Height")}</label>
                  <input
                    type="number"
                    value={barcodeHeight}
                    onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                    className="h-9 w-full rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-center font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Visibility Settings */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">{t("Field Visibility")}</h2>
              <p className="text-xs text-gray-500">{t("Toggle values to include on the printed sticker.")}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-50 p-2">
                <div>
                  <p className="text-xs font-bold text-gray-900">{t("Show Store Name")}</p>
                  <p className="text-[10px] text-gray-500">{storeName}</p>
                </div>
                <Switch checked={showStoreName} onCheckedChange={setShowStoreName} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-50 p-2">
                <p className="text-xs font-bold text-gray-900">{t("Show Product Name")}</p>
                <Switch checked={showProductName} onCheckedChange={setShowProductName} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-50 p-2">
                <p className="text-xs font-bold text-gray-900">{t("Show Product Price")}</p>
                <Switch checked={showProductPrice} onCheckedChange={setShowProductPrice} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-50 p-2">
                <p className="text-xs font-bold text-gray-900">{t("Show Barcode Text")}</p>
                <Switch checked={showBarcodeText} onCheckedChange={setShowBarcodeText} />
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
  )
}
