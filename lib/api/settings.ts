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
  // Business settings
  getBusinessSettings: { query: () => getMutation("settings/business") },
  getSettingsForm: { query: ({ identifier }: { identifier: string }) => getMutation(`settings/${identifier}`) },
  saveSettingsForm: { query: ({ identifier, payLoad }: { identifier: string; payLoad: any }) => postMutation(`settings/${identifier}`)(payLoad) },

  // Branches
  createBranch: { query: createMutation("organizations/branches/") },
  editBranch: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`organizations/branches/${id}`, payLoad) },
  getBranchById: { query: ({ id }: { id: number }) => getMutation(`organizations/branches/${id}`) },

  // Roles
  getPermissions: { query: () => getMutation("accounts/permissions") },
  getRoles: { query: () => getMutation("accounts/roles") },
  getRoleById: { query: ({ id }: { id: number | string }) => getMutation(`accounts/roles/${id}`) },
  createRole: { query: createMutation("accounts/roles") },
  editRole: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`accounts/roles/${id}`, payLoad) },
  deleteRole: { query: ({ id }: { id: number }) => ({ url: `accounts/roles/${id}`, method: "DELETE" }) },
  cloneRole: { query: ({ id }: { id: number | string }) => getMutation(`users/roles/${id}/clone`) },

  // Users
  getUsersDropdown: { query: () => getMutation("accounts/users/dropdown-list") },
  getUsersData: { query: postMutation("accounts/users/get-transactions") },
  createUser: { query: createMutation("accounts/users/") },
  editUser: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`accounts/users/${id}`, payLoad) },
  deleteUser: { query: deleteMutation("accounts/users/delete") },
  updateUserStatus: { query: ({ payLoad }: { payLoad: any }) => patchMutation("accounts/users/status", payLoad) },
  getUserById: { query: ({ id }: { id: number | string }) => getMutation(`accounts/users/${id}`) },
  assignRole: { query: ({ id, payLoad }: { id: any; payLoad: any }) => postMutation(`accounts/users/${id}/assign-role`)(payLoad) },

  resetDatabase: { query: () => postMutation("settings/reset")({}) },

  // Modules
  getModules: { query: ({ segment = "" }: { segment?: string } = {}) => getMutation(`modules${segment ? `/${segment}` : ""}`) },
  uploadModule: { query: ({ payLoad }: { payLoad: FormData }) => ({ url: "modules", method: "POST", body: payLoad }) },
  enableModule: { query: ({ namespace }: { namespace: string }) => putMutation(`modules/${namespace}/enable`, {}) },
  disableModule: { query: ({ namespace }: { namespace: string }) => putMutation(`modules/${namespace}/disable`, {}) },
  deleteModule: { query: ({ namespace }: { namespace: string }) => ({ url: `modules/${namespace}/delete`, method: "DELETE" }) },
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
