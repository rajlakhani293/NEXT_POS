import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"

import type { ApiEnvelope } from "@/lib/api/auth"

export type ProductRecord = {
  id: number
  name: string
  sku: string
  category: string
  brand: string
  productType: "stock" | "service" | "bundle"
  sellingPrice: number
  purchasePrice: number
  currentStock: number
  minStock: number
  status: "active" | "low_stock" | "draft"
}

export type ProductPayload = {
  name: string
  sku: string
  category: string
  brand: string
  productType: "stock" | "service" | "bundle"
  sellingPrice: number
  purchasePrice: number
  currentStock: number
  minStock: number
}

let productSequence = 5

let mockProducts: ProductRecord[] = [
  {
    id: 1,
    name: "Aashirvaad Atta 10kg",
    sku: "ATT-10KG-001",
    category: "Groceries",
    brand: "Aashirvaad",
    productType: "stock",
    sellingPrice: 455,
    purchasePrice: 410,
    currentStock: 24,
    minStock: 8,
    status: "active",
  },
  {
    id: 2,
    name: "Tata Salt 1kg",
    sku: "SLT-1KG-002",
    category: "Groceries",
    brand: "Tata",
    productType: "stock",
    sellingPrice: 28,
    purchasePrice: 24,
    currentStock: 6,
    minStock: 10,
    status: "low_stock",
  },
  {
    id: 3,
    name: "Parle-G Family Pack",
    sku: "PRG-FAM-003",
    category: "Snacks",
    brand: "Parle",
    productType: "stock",
    sellingPrice: 62,
    purchasePrice: 51,
    currentStock: 38,
    minStock: 12,
    status: "active",
  },
  {
    id: 4,
    name: "Counter Delivery Service",
    sku: "SRV-DEL-004",
    category: "Services",
    brand: "In-house",
    productType: "service",
    sellingPrice: 40,
    purchasePrice: 0,
    currentStock: 0,
    minStock: 0,
    status: "draft",
  },
]

function buildEnvelope<T>(message: string, data: T): ApiEnvelope<T> {
  return {
    success: true,
    message,
    data,
    meta: null,
  }
}

function deriveStatus(payload: Pick<ProductPayload, "productType" | "currentStock" | "minStock">) {
  if (payload.productType === "service") return "draft"
  if (payload.currentStock <= payload.minStock) return "low_stock"
  return "active"
}

export const products = createApi({
  reducerPath: "products",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Products"],
  endpoints: (builder) => ({
    getProducts: builder.query<ApiEnvelope<ProductRecord[]>, { search?: string } | void>({
      queryFn: async (arg) => {
        const search = arg?.search?.trim().toLowerCase()
        const filtered = search
          ? mockProducts.filter((product) =>
              [product.name, product.sku, product.category, product.brand]
                .join(" ")
                .toLowerCase()
                .includes(search),
            )
          : mockProducts

        return { data: buildEnvelope("Products fetched successfully.", filtered) }
      },
      providesTags: ["Products"],
    }),
    createProduct: builder.mutation<ApiEnvelope<ProductRecord>, { payLoad: ProductPayload }>({
      queryFn: async ({ payLoad }) => {
        const newProduct: ProductRecord = {
          id: productSequence++,
          ...payLoad,
          status: deriveStatus(payLoad),
        }
        mockProducts = [newProduct, ...mockProducts]
        return { data: buildEnvelope("Product created successfully.", newProduct) }
      },
      invalidatesTags: ["Products"],
    }),
    updateProduct: builder.mutation<
      ApiEnvelope<ProductRecord>,
      { id: number; payLoad: ProductPayload }
    >({
      queryFn: async ({ id, payLoad }) => {
        const existing = mockProducts.find((product) => product.id === id)

        if (!existing) {
          return {
            error: {
              status: 404,
              data: {
                success: false,
                message: "Product not found.",
                data: null,
                meta: null,
              },
            },
          }
        }

        const updated: ProductRecord = {
          ...existing,
          ...payLoad,
          status: deriveStatus(payLoad),
        }

        mockProducts = mockProducts.map((product) =>
          product.id === id ? updated : product,
        )

        return { data: buildEnvelope("Product updated successfully.", updated) }
      },
      invalidatesTags: ["Products"],
    }),
    deleteProduct: builder.mutation<ApiEnvelope<{ id: number }>, { id: number }>({
      queryFn: async ({ id }) => {
        mockProducts = mockProducts.filter((product) => product.id !== id)
        return { data: buildEnvelope("Product deleted successfully.", { id }) }
      },
      invalidatesTags: ["Products"],
    }),
  }),
})

export const {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useUpdateProductMutation,
} = products
