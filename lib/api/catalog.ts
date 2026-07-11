import { createApi } from "@reduxjs/toolkit/query/react"

import { createBaseQueryWithInterceptor } from "@/lib/api/base"
import {
  createMutation,
  deleteMutation,
  getMutation,
  patchMutation,
  postMutation,
  putMutation,
} from "@/lib/api/apiUtils"

const endpointsConfig = {
  // Categories
  getCategoriesDropdown: { query: () => getMutation("categories/dropdown-list") },
  getCategoriesData: { query: postMutation("categories/get-transactions") },
  createCategory: { query: createMutation("categories/") },
  editCategory: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`categories/${id}`, payLoad) },
  deleteCategory: { query: deleteMutation("categories/delete") },
  updateCategoryStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("categories/status", payLoad) },
  getCategoryById: { query: ({ id }: { id: number }) => getMutation(`categories/${id}`) },
  computeCategoryProducts: { query: ({ id }: { id: number | string }) => getMutation(`categories/${id}/compute-products`) },

  // Unit groups
  getUnitGroupsDropdown: { query: () => getMutation("unit-groups/dropdown-list") },
  getUnitGroupsData: { query: postMutation("unit-groups/get-transactions") },
  createUnitGroup: { query: createMutation("unit-groups/") },
  editUnitGroup: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`unit-groups/${id}`, payLoad) },
  deleteUnitGroup: { query: deleteMutation("unit-groups/delete") },
  updateUnitGroupStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("unit-groups/status", payLoad) },
  getUnitGroupById: { query: ({ id }: { id: number }) => getMutation(`unit-groups/${id}`) },

  // Units
  getUnitsDropdown: { query: () => getMutation("units/dropdown-list") },
  getUnitsData: { query: postMutation("units/get-transactions") },
  createUnit: { query: createMutation("units/") },
  editUnit: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`units/${id}`, payLoad) },
  deleteUnit: { query: deleteMutation("units/delete") },
  updateUnitStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("units/status", payLoad) },
  getUnitById: { query: ({ id }: { id: number }) => getMutation(`units/${id}`) },
  getUnitSiblings: { query: ({ id }: { id: number }) => getMutation(`units/${id}/siblings`) },

  // Scale ranges
  getScaleRangesDropdown: { query: () => getMutation("scale-ranges/dropdown-list") },
  getScaleRangesData: { query: postMutation("scale-ranges/get-transactions") },
  createScaleRange: { query: createMutation("scale-ranges/") },
  editScaleRange: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`scale-ranges/${id}`, payLoad) },
  deleteScaleRange: { query: deleteMutation("scale-ranges/delete") },
  updateScaleRangeStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("scale-ranges/status", payLoad) },
  getScaleRangeById: { query: ({ id }: { id: number }) => getMutation(`scale-ranges/${id}`) },

  // Tax groups
  getTaxGroupsDropdown: { query: () => getMutation("tax-groups/dropdown-list") },
  getTaxGroupsData: { query: postMutation("tax-groups/get-transactions") },
  createTaxGroup: { query: createMutation("tax-groups/") },
  editTaxGroup: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`tax-groups/${id}`, payLoad) },
  deleteTaxGroup: { query: deleteMutation("tax-groups/delete") },
  updateTaxGroupStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("tax-groups/status", payLoad) },
  getTaxGroupById: { query: ({ id }: { id: number }) => getMutation(`tax-groups/${id}`) },

  // Taxes
  getTaxesDropdown: { query: () => getMutation("taxes/dropdown-list") },
  getTaxGroupsSource: { query: () => getMutation("taxes/groups") },
  getTaxesData: { query: postMutation("taxes/get-transactions") },
  createTax: { query: createMutation("taxes/") },
  editTax: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`taxes/${id}`, payLoad) },
  deleteTax: { query: deleteMutation("taxes/delete") },
  updateTaxStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("taxes/status", payLoad) },
  getTaxById: { query: ({ id }: { id: number }) => getMutation(`taxes/${id}`) },

  // POS grid category/product navigation
  getPOSGrid: { query: () => getMutation("categories/pos") },
  getPOSGridByCategory: { query: ({ parentId }: { parentId: number }) => getMutation(`categories/pos/${parentId}`) },

  // Products
  getProductsDropdown: { query: () => getMutation("products/dropdown-list") },
  getProductsData: { query: postMutation("products/get-transactions") },
  createProduct: { query: createMutation("products/") },
  editProduct: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`products/${id}`, payLoad) },
  deleteProduct: { query: deleteMutation("products/delete") },
  updateProductStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("products/status", payLoad) },
  getProductById: { query: ({ id }: { id: number }) => getMutation(`products/${id}`) },
  getProductUnitQuantities: { query: ({ productId }: { productId: any }) => getMutation(`products/${productId}/units/quantities`) },
  createProductUnitQuantity: { query: ({ productId, payLoad }: { productId: any; payLoad: any }) => createMutation(`products/${productId}/units/quantities`)(payLoad) },
  editProductUnitQuantity: { query: ({ productId, id, payLoad }: { productId: any; id: any; payLoad: any }) => putMutation(`products/${productId}/units/quantities/${id}`, payLoad) },
  deleteProductUnitQuantity: { query: ({ productId, id }: { productId: any; id: any }) => deleteMutation(`products/${productId}/units/quantities/${id}`)({}) },
  searchProductUsingBarcode: { query: ({ reference }: { reference: string }) => getMutation(`products/search/using-barcode/${reference}`) },
  addProductGalleryImage: { query: ({ productId, payLoad }: { productId: any; payLoad: any }) => postMutation(`products/${productId}/gallery`)(payLoad) },
  deleteProductGalleryImage: { query: ({ productId, id }: { productId: any; id: any }) => deleteMutation(`products/${productId}/gallery/${id}`)({}) },
}


export const catalog = createApi({
  reducerPath: "catalog",
  baseQuery: createBaseQueryWithInterceptor("catalog"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
