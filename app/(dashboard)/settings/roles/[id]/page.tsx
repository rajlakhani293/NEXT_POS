"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { settings } from "@/lib/api/settings"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

const initialValues = {
  name: "",
  code: "",
  description: "",
  is_cashier: false,
  is_store_manager: false,
  permission_codenames: [] as string[],
}

type RoleFormValues = typeof initialValues

function buildCode(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function RoleFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"
  const requiredPermission = isEdit ? PERMISSIONS.roles.update : PERMISSIONS.roles.create

  const [values, setValues] = useState<RoleFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const permissions = (settings as any).useGetPermissionsQuery()
  const role = (settings as any).useGetRoleByIdQuery(
    { id },
    { skip: !isEdit },
  )
  const [createRole] = (settings as any).useCreateRoleMutation()
  const [editRole] = (settings as any).useEditRoleMutation()

  useEffect(() => {
    const record = role.data?.data
    if (!record || !isEdit) return

    setValues({
      ...initialValues,
      ...record,
      permission_codenames: record.permissions || [],
    })
    setErrors({})
  }, [isEdit, role.data])

  const permissionRows = permissions.data?.data || []
  const groupedPermissions = useMemo(() => {
    return permissionRows.reduce((groups: Record<string, any[]>, permission: any) => {
      const groupName = permission.codename?.split("_")[0] || "other"
      groups[groupName] = groups[groupName] || []
      groups[groupName].push(permission)
      return groups
    }, {})
  }, [permissionRows])

  const updateField = (name: keyof RoleFormValues, value: any) => {
    setValues((current) => ({
      ...current,
      [name]: value,
      ...(name === "name" && !isEdit && !current.code ? { code: buildCode(value) } : {}),
    }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }))
    }
  }

  const togglePermission = (codename: string, checked: boolean) => {
    setValues((current) => {
      const currentPermissions = current.permission_codenames || []
      return {
        ...current,
        permission_codenames: checked
          ? Array.from(new Set([...currentPermissions, codename]))
          : currentPermissions.filter((item) => item !== codename),
      }
    })
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = "Role name is required"
    if (!values.code.trim()) nextErrors.code = "Code is required"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/settings/roles")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (isEdit) {
        const response = await editRole({ id, payLoad: values }).unwrap()
        showToast.success(response?.message || "Role updated successfully.")
      } else {
        const response = await createRole(values).unwrap()
        showToast.success(response?.message || "Role created successfully.")
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = permissions.isLoading || (isEdit && role.isLoading)

  return (
    <PermissionGuard permission={requiredPermission}>
      <div className="-m-6 flex min-h-0 flex-1 flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-4">
            <div className="mb-5 flex items-center gap-3">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={goBack}>
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isEdit ? "Edit Role" : "Create Role"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage role details and permission access.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Loading role data...
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="rounded-xl border bg-white p-5">
                  <h2 className="mb-4 text-base font-semibold">Role Details</h2>
                  <div className="space-y-4">
                    <UniFieldInput
                      label="Role Name"
                      placeholder="Enter role name"
                      value={values.name}
                      required
                      error={errors.name}
                      onChange={(event) => updateField("name", event.target.value)}
                    />
                    <UniFieldInput
                      label="Code"
                      placeholder="administrator"
                      value={values.code}
                      required
                      error={errors.code}
                      onChange={(event) => updateField("code", buildCode(event.target.value))}
                    />
                    <UniFieldInput
                      as="textarea"
                      label="Description"
                      placeholder="Enter role description"
                      value={values.description}
                      onChange={(event) => updateField("description", event.target.value)}
                    />
                    <div className="space-y-3 rounded-lg border p-3">
                      <label className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">Cashier Role</div>
                          <p className="text-xs text-muted-foreground">Use this for register/cashier users.</p>
                        </div>
                        <Switch
                          checked={values.is_cashier}
                          onCheckedChange={(checked) => updateField("is_cashier", checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">Store Manager Role</div>
                          <p className="text-xs text-muted-foreground">Use this for branch manager users.</p>
                        </div>
                        <Switch
                          checked={values.is_store_manager}
                          onCheckedChange={(checked) => updateField("is_store_manager", checked)}
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-white p-5">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold">Permissions</h2>
                    <p className="text-sm text-muted-foreground">Select what this role can access.</p>
                  </div>
                  <div className="space-y-5">
                    {Object.entries(groupedPermissions).map(([groupName, items]: any) => (
                      <div key={groupName} className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          {groupName}
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {items.map((permission: any) => {
                            const checked = values.permission_codenames.includes(permission.codename)
                            return (
                              <label
                                key={permission.codename}
                                className="flex items-center gap-2 rounded-md border p-2 text-sm transition hover:border-gray-300"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => togglePermission(permission.codename, Boolean(value))}
                                />
                                <span>{permission.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="flex flex-none justify-end gap-3 border-t bg-white px-6 py-1.5">
            <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? <Spinner /> : "Save Role"}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  )
}
