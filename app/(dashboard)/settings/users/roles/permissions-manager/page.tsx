"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { SaveIcon, SearchIcon } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

type RoleRecord = {
  id: number
  name: string
  namespace: string
  permissions?: string[]
}

type PermissionRecord = {
  codename: string
  name: string
}

function permissionLabel(permission: PermissionRecord) {
  return permission.name || permission.codename.replace(/_/g, " ")
}

export default function PermissionsManagerPage() {
  const { t } = useTranslation()
  const hasLoadedRef = useRef(false)
  const [search, setSearch] = useState("")
  const [matrix, setMatrix] = useState<Record<number, string[]>>({})
  const [dirtyRoleIds, setDirtyRoleIds] = useState<Set<number>>(new Set())
  const [getRoles, rolesState] = (settings as any).useGetRolesMutation()
  const [getPermissions, permissionsState] = (settings as any).useGetPermissionsMutation()
  const [editRole, editRoleState] = (settings as any).useEditRoleMutation()

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    async function load() {
      const [rolesResponse] = await Promise.all([getRoles().unwrap(), getPermissions().unwrap()])
      const nextMatrix = (rolesResponse?.data || []).reduce(
        (current: Record<number, string[]>, role: RoleRecord) => {
          current[role.id] = role.permissions || []
          return current
        },
        {}
      )
      setMatrix(nextMatrix)
    }

    load().catch((error: any) => {
      showToast.error(error?.data?.message || t("Unable to load permissions."))
    })
  }, [getPermissions, getRoles, t])

  const roles: RoleRecord[] = rolesState.data?.data || []
  const permissions: PermissionRecord[] = permissionsState.data?.data || []
  const filteredPermissions = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return permissions
    return permissions.filter((permission) =>
      `${permission.name} ${permission.codename}`.toLowerCase().includes(term)
    )
  }, [permissions, search])

  const isLoading = rolesState.isLoading || permissionsState.isLoading
  const isSaving = editRoleState.isLoading

  const togglePermission = (role: RoleRecord, codename: string, checked: boolean) => {
    setMatrix((current) => {
      const existing = current[role.id] || []
      return {
        ...current,
        [role.id]: checked
          ? Array.from(new Set([...existing, codename]))
          : existing.filter((item) => item !== codename),
      }
    })
    setDirtyRoleIds((current) => new Set(current).add(role.id))
  }

  const savePermissions = async () => {
    for (const roleId of dirtyRoleIds) {
      await editRole({
        id: roleId,
        payLoad: {
          permission_codenames: matrix[roleId] || [],
        },
      }).unwrap()
    }
    setDirtyRoleIds(new Set())
    showToast.success(t("The permissions has been updated."))
  }

  return (
    <PermissionGuard permission={PERMISSIONS.roles.update}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">{t("Permission Manager")}</h1>
            <p className="text-sm text-slate-500">{t("Manage all permissions and roles")}</p>
          </div>
          <Button
            type="button"
            onClick={savePermissions}
            disabled={!dirtyRoleIds.size || isSaving}
          >
            {isSaving ? <Spinner /> : <SaveIcon className="size-4" />}
            {t("Save")}
          </Button>
        </div>

        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Search")}
            className="pl-9"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-white">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="w-[320px] border-b border-r px-4 py-3 text-left font-semibold">
                      {t("Permissions")}
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.id}
                        className="min-w-40 border-b border-r px-4 py-3 text-center font-semibold"
                      >
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => (
                    <tr key={permission.codename} className="hover:bg-gray-50">
                      <td className="border-b border-r px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {t(permissionLabel(permission))}
                        </div>
                        <div className="text-xs text-slate-500">{permission.codename}</div>
                      </td>
                      {roles.map((role) => (
                        <td
                          key={`${role.id}-${permission.codename}`}
                          className="border-b border-r px-4 py-3 text-center"
                        >
                          <Checkbox
                            checked={(matrix[role.id] || []).includes(permission.codename)}
                            onCheckedChange={(checked) =>
                              togglePermission(role, permission.codename, checked === true)
                            }
                            aria-label={`${role.name} ${permission.codename}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!filteredPermissions.length ? (
                    <tr>
                      <td
                        colSpan={roles.length + 1}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        {t("There is nothing to display here.")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  )
}
