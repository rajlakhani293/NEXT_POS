"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useUpdateProductMutation,
  type ProductPayload,
  type ProductRecord,
} from "@/lib/api/products"
import { showToast } from "@/lib/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const defaultForm: ProductPayload = {
  name: "",
  sku: "",
  category: "",
  brand: "",
  productType: "stock",
  sellingPrice: 0,
  purchasePrice: 0,
  currentStock: 0,
  minStock: 0,
}

function statusBadge(status: ProductRecord["status"]) {
  if (status === "low_stock") {
    return (
      <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
        Low stock
      </Badge>
    )
  }

  if (status === "draft") {
    return (
      <Badge className="border border-slate-200 bg-slate-100 text-slate-600">
        Draft
      </Badge>
    )
  }

  return (
    <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
      Active
    </Badge>
  )
}

export function ProductsPageClient() {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<ProductRecord | null>(null)
  const [form, setForm] = React.useState<ProductPayload>(defaultForm)

  const { data, isLoading } = useGetProductsQuery(
    search ? { search } : undefined,
  )
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()

  const products = data?.data ?? []

  const lowStockCount = products.filter((product) => product.status === "low_stock").length

  const openCreateDialog = () => {
    setEditingProduct(null)
    setForm(defaultForm)
    setIsOpen(true)
  }

  const openEditDialog = (product: ProductRecord) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      productType: product.productType,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      currentStock: product.currentStock,
      minStock: product.minStock,
    })
    setIsOpen(true)
  }

  const onFieldChange = <K extends keyof ProductPayload>(
    key: K,
    value: ProductPayload[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      showToast.error("Product name and SKU are required.")
      return
    }

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, payLoad: form }).unwrap()
      } else {
        await createProduct({ payLoad: form }).unwrap()
      }
      setIsOpen(false)
      setEditingProduct(null)
      setForm(defaultForm)
    } catch {}
  }

  const onDelete = async (product: ProductRecord) => {
    try {
      await deleteProduct({ id: product.id }).unwrap()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="rounded-full border border-[#d7e0ff] bg-[#eff3ff] px-3 py-1 text-[#2648db]">
              Catalog module
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                Build a product catalog your POS can actually sell from.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                This is the first real module in the app: searchable products,
                create/edit flow, pricing, and stock-aware status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-2xl border-slate-200">
              Total products: {products.length}
            </Button>
            <Button variant="blue" className="rounded-2xl px-5" onClick={openCreateDialog}>
              <PlusIcon className="size-4" />
              Add product
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="gap-4 rounded-[24px] border-slate-200 py-5 shadow-sm">
          <CardHeader className="px-5">
            <CardDescription>Catalog size</CardDescription>
            <CardTitle className="text-2xl font-semibold text-slate-950">
              {products.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-4 rounded-[24px] border-slate-200 py-5 shadow-sm">
          <CardHeader className="px-5">
            <CardDescription>Low stock items</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
              {lowStockCount}
              {lowStockCount > 0 ? (
                <AlertTriangleIcon className="size-5 text-amber-500" />
              ) : null}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-4 rounded-[24px] border-slate-200 py-5 shadow-sm">
          <CardHeader className="px-5">
            <CardDescription>Searchable fields</CardDescription>
            <CardTitle className="text-2xl font-semibold text-slate-950">
              Name, SKU, brand
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="rounded-[26px] border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Products list</CardTitle>
            <CardDescription>
              This table is ready to swap from local RTK Query data to backend APIs.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, SKU, brand"
              className="rounded-2xl pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="px-6">Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No products found. Add your first item to start building the catalog.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-6">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">
                          {product.brand} · {product.productType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>₹{product.sellingPrice}</TableCell>
                    <TableCell>{product.currentStock}</TableCell>
                    <TableCell>{statusBadge(product.status)}</TableCell>
                    <TableCell className="px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openEditDialog(product)}
                        >
                          <PencilIcon className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-red-600"
                          onClick={() => onDelete(product)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit product" : "Create product"}
            </DialogTitle>
            <DialogDescription>
              Add the core catalog information now. We can extend this later with
              variants, barcode, tax group, and inventory details from the backend.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Product name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
            />
            <Input
              placeholder="SKU"
              value={form.sku}
              onChange={(event) => onFieldChange("sku", event.target.value)}
            />
            <Input
              placeholder="Category"
              value={form.category}
              onChange={(event) => onFieldChange("category", event.target.value)}
            />
            <Input
              placeholder="Brand"
              value={form.brand}
              onChange={(event) => onFieldChange("brand", event.target.value)}
            />
            <Input
              placeholder="Product type: stock / service / bundle"
              value={form.productType}
              onChange={(event) =>
                onFieldChange(
                  "productType",
                  event.target.value as ProductPayload["productType"],
                )
              }
            />
            <Input
              type="number"
              placeholder="Selling price"
              value={form.sellingPrice}
              onChange={(event) =>
                onFieldChange("sellingPrice", Number(event.target.value || 0))
              }
            />
            <Input
              type="number"
              placeholder="Purchase price"
              value={form.purchasePrice}
              onChange={(event) =>
                onFieldChange("purchasePrice", Number(event.target.value || 0))
              }
            />
            <Input
              type="number"
              placeholder="Current stock"
              value={form.currentStock}
              onChange={(event) =>
                onFieldChange("currentStock", Number(event.target.value || 0))
              }
            />
            <Input
              type="number"
              placeholder="Minimum stock"
              value={form.minStock}
              onChange={(event) =>
                onFieldChange("minStock", Number(event.target.value || 0))
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="blue" onClick={onSave} disabled={isCreating || isUpdating}>
              {editingProduct ? "Update product" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
