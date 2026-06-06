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
  // Company profile
  getStatesDropdown: { query: () => getMutation("organizations/states/dropdown-list") },
  getCompany: { query: () => getMutation("organizations/company") },
  updateCompany: { query: ({ payLoad }: { payLoad: any }) => putMutation("organizations/company", payLoad) },

  // Business settings
  getBusinessSettings: { query: () => getMutation("settings/business") },
  updateBusinessSettings: { query: ({ payLoad }: { payLoad: any }) => putMutation("settings/business", payLoad) },

  // Branches
  getBranchesDropdown: { query: () => getMutation("organizations/branches/dropdown-list") },
  getBranchesData: { query: postMutation("organizations/branches/get-transactions") },
  createBranch: { query: createMutation("organizations/branches/") },
  editBranch: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`organizations/branches/${id}`, payLoad) },
  deleteBranch: { query: deleteMutation("organizations/branches/delete") },
  updateBranchStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("organizations/branches/status", payLoad) },
  getBranchById: { query: ({ id }: { id: number }) => getMutation(`organizations/branches/${id}`) },

  // Roles
  getPermissions: { query: () => getMutation("accounts/permissions") },
  getRoles: { query: () => getMutation("accounts/roles") },
  getRoleById: { query: ({ id }: { id: number | string }) => getMutation(`accounts/roles/${id}`) },
  createRole: { query: createMutation("accounts/roles") },
  editRole: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`accounts/roles/${id}`, payLoad) },
  deleteRole: { query: ({ id }: { id: number }) => ({ url: `accounts/roles/${id}`, method: "DELETE" }) },

  // Users
  getUsersDropdown: { query: () => getMutation("accounts/users/dropdown-list") },
  getUsersData: { query: postMutation("accounts/users/get-transactions") },
  createUser: { query: createMutation("accounts/users/") },
  editUser: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`accounts/users/${id}`, payLoad) },
  deleteUser: { query: deleteMutation("accounts/users/delete") },
  updateUserStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("accounts/users/status", payLoad) },
  getUserById: { query: ({ id }: { id: number }) => getMutation(`accounts/users/${id}`) },
  assignRole: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`accounts/users/${id}/assign-role`)(payLoad) },
}

export const settings = createApi({
  reducerPath: "settings",
  baseQuery: createBaseQueryWithInterceptor(""),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {}
    for (const [name, config] of Object.entries(endpointsConfig)) {
      finalEndpoints[name] = builder.mutation(config as any)
    }
    return finalEndpoints
  },
})
