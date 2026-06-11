"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Package,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { settings } from "@/lib/api/settings"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const initialValues = {
  name: "",
  code: "",
  description: "",
  is_cashier: false,
  is_store_manager: false,
  permission_codenames: [] as string[],
}

type RoleFormValues = typeof initialValues

type PermissionItem = {
  codename: string
  name: string
}

type PermissionRow = {
  key: string
  title: string
  permissions: PermissionItem[]
  actions: Record<string, PermissionItem | undefined>
  other: PermissionItem[]
}

const actionColumns = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
]

const moduleSections = [
  {
    key: "sales",
    title: "Sales",
    icon: ShoppingCart,
    modules: ["sales", "returns"],
  },
  {
    key: "purchase",
    title: "Purchase",
    icon: Package,
    modules: ["purchases"],
  },
  {
    key: "inventory",
    title: "Inventory",
    icon: Boxes,
    modules: ["products", "inventory"],
  },
  {
    key: "customers",
    title: "Customers",
    icon: Users,
    modules: ["customers"],
  },
  {
    key: "finance",
    title: "Accounts & Finance",
    icon: CircleDollarSign,
    modules: ["payments", "expenses"],
  },
  {
    key: "registers",
    title: "Cash Registers",
    icon: ReceiptText,
    modules: ["cash_register"],
  },
  {
    key: "rewards",
    title: "Rewards & Coupons",
    icon: Sparkles,
    modules: ["rewards", "promotions"],
  },
  {
    key: "settings",
    title: "Settings",
    icon: Settings,
    modules: ["users", "roles", "branches", "settings"],
  },
  {
    key: "reports",
    title: "Reports",
    icon: ChartNoAxesCombined,
    modules: ["reports"],
  },
  {
    key: "special",
    title: "Special Access",
    icon: ShieldCheck,
    modules: ["special"],
  },
]

const moduleLabels: Record<string, string> = {
  users: "Users",
  roles: "Roles",
  settings: "Business Settings",
  branches: "Branches",
  customers: "Customers",
  products: "Products",
  inventory: "Stock & Inventory",
  purchases: "Purchase Orders",
  sales: "Sales Billing",
  returns: "Sale Returns",
  payments: "Payments",
  cash_register: "Cash Registers",
  expenses: "Expenses",
  rewards: "Reward Systems",
  promotions: "Coupons",
  reports: "Reports",
  special: "Special Permissions",
}

const actionAliases: Record<string, string> = {
  edit: "update",
}

function buildCode(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getModuleKey(codename: string) {
  if (!codename.includes("_")) return "special"
  const parts = codename.split("_")
  if (parts[0] === "cash" && parts[1] === "register") return "cash_register"
  return parts[0]
}

function getActionKey(codename: string, moduleKey: string) {
  if (moduleKey === "special") return "other"
  const prefix = `${moduleKey}_`
  const rawAction = codename.startsWith(prefix)
    ? codename.slice(prefix.length)
    : codename.split("_").slice(1).join("_")
  return actionAliases[rawAction] || rawAction || "other"
}

function buildPermissionRows(permissions: PermissionItem[], moduleKeys: string[]) {
  const moduleSet = new Set(moduleKeys)
  const grouped = permissions.reduce<Record<string, PermissionItem[]>>(
    (groups, permission) => {
      const moduleKey = getModuleKey(permission.codename)
      if (!moduleSet.has(moduleKey)) return groups
      groups[moduleKey] = groups[moduleKey] || []
      groups[moduleKey].push(permission)
      return groups
    },
    {}
  )

  return moduleKeys
    .map((moduleKey) => {
      const items = grouped[moduleKey] || []
      const actions: Record<string, PermissionItem | undefined> = {}
      const other: PermissionItem[] = []

      items.forEach((permission) => {
        const actionKey = getActionKey(permission.codename, moduleKey)
        if (actionColumns.some((column) => column.key === actionKey)) {
          actions[actionKey] = permission
        } else {
          other.push(permission)
        }
      })

      return {
        key: moduleKey,
        title: moduleLabels[moduleKey] || titleCase(moduleKey),
        permissions: items,
        actions,
        other,
      }
    })
    .filter((row) => row.permissions.length > 0)
}

export default function RoleFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isEdit = id !== "create"

  const [values, setValues] = useState<RoleFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeSectionKey, setActiveSectionKey] = useState(moduleSections[0].key)
  const [search, setSearch] = useState("")
  const loadKeyRef = useRef("")
  const pageScrollRef = useRef<HTMLDivElement | null>(null)
  const permissionSectionRef = useRef<HTMLElement | null>(null)
  const permissionsPanelRef = useRef<HTMLDivElement | null>(null)
  const programmaticScrollRef = useRef(false)
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [getPermissions, permissions] = (settings as any).useGetPermissionsMutation()
  const [getRoleById, role] = (settings as any).useGetRoleByIdMutation()
  const [createRole] = (settings as any).useCreateRoleMutation()
  const [editRole] = (settings as any).useEditRoleMutation()

  useEffect(() => {
    const loadKey = `${id}:${isEdit ? "edit" : "create"}`
    if (loadKeyRef.current === loadKey) return
    loadKeyRef.current = loadKey

    const load = async () => {
      await getPermissions()
      if (!isEdit) {
        setValues(initialValues)
        setErrors({})
        return
      }

      const result = await getRoleById({ id }).unwrap()
      const record = result?.data
      if (!record) return

      setValues({
        ...initialValues,
        ...record,
        code: record.code || "",
        permission_codenames: record.permissions || [],
      })
      setErrors({})
    }

    load()
  }, [getPermissions, getRoleById, id, isEdit])

  const permissionRows: PermissionItem[] = permissions.data?.data || []
  const selectedPermissions = values.permission_codenames || []

  const sections = useMemo(() => {
    return moduleSections
      .map((section) => ({
        ...section,
        rows: buildPermissionRows(permissionRows, section.modules),
      }))
      .filter((section) => section.rows.length > 0)
  }, [permissionRows])

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return sections
    return sections
      .map((section) => ({
        ...section,
        rows: section.rows.filter((row) => {
          return (
            row.title.toLowerCase().includes(term) ||
            row.permissions.some((permission) =>
              `${permission.name} ${permission.codename}`.toLowerCase().includes(term)
            )
          )
        }),
      }))
      .filter((section) => section.rows.length > 0)
  }, [search, sections])

  useEffect(() => {
    if (sections.length && !sections.some((section) => section.key === activeSectionKey)) {
      setActiveSectionKey(sections[0].key)
    }
  }, [activeSectionKey, sections])

  useEffect(() => {
    const panel = permissionsPanelRef.current
    if (!panel || !sections.length) return

    const handleScroll = () => {
      if (programmaticScrollRef.current) return

      const panelTop = panel.getBoundingClientRect().top
      let currentKey = sections[0].key

      sections.forEach((section) => {
        const element = document.getElementById(`role-permissions-${section.key}`)
        if (!element) return
        if (element.getBoundingClientRect().top - panelTop <= 100) {
          currentKey = section.key
        }
      })

      setActiveSectionKey(currentKey)
    }

    panel.addEventListener("scroll", handleScroll, { passive: true })
    return () => panel.removeEventListener("scroll", handleScroll)
  }, [sections])

  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current)
      }
    }
  }, [])

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

  const setPermissionCodes = (codes: string[]) => {
    setValues((current) => ({
      ...current,
      permission_codenames: Array.from(new Set(codes)),
    }))
  }

  const togglePermission = (codename: string, checked: boolean) => {
    setPermissionCodes(
      checked
        ? [...selectedPermissions, codename]
        : selectedPermissions.filter((item) => item !== codename)
    )
  }

  const toggleRow = (row: PermissionRow, checked: boolean) => {
    const rowCodes = row.permissions.map((permission) => permission.codename)
    setPermissionCodes(
      checked
        ? [...selectedPermissions, ...rowCodes]
        : selectedPermissions.filter((codename) => !rowCodes.includes(codename))
    )
  }

  const toggleSection = (section: (typeof sections)[number], checked: boolean) => {
    const sectionCodes = section.rows.flatMap((row) =>
      row.permissions.map((permission) => permission.codename)
    )
    setPermissionCodes(
      checked
        ? [...selectedPermissions, ...sectionCodes]
        : selectedPermissions.filter((codename) => !sectionCodes.includes(codename))
    )
  }

  const scrollToSection = (sectionKey: string) => {
    setActiveSectionKey(sectionKey)
    programmaticScrollRef.current = true
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current)
    }

    const releaseProgrammaticScroll = () => {
      programmaticScrollTimeoutRef.current = setTimeout(() => {
        programmaticScrollRef.current = false
      }, 550)
    }

    requestAnimationFrame(() => {
      const panel = permissionsPanelRef.current
      const pageScroller = pageScrollRef.current
      const permissionSection = permissionSectionRef.current
      const target = document.getElementById(`role-permissions-${sectionKey}`)
      if (!panel || !target) {
        programmaticScrollRef.current = false
        return
      }
      if (window.innerWidth < 1024) {
        target.scrollIntoView({ block: "start" })
        releaseProgrammaticScroll()
        return
      }

      const scrollPanelToTarget = () => {
        const panelTop = panel.getBoundingClientRect().top
        const targetTop = target.getBoundingClientRect().top
        panel.scrollTo({
          top: panel.scrollTop + targetTop - panelTop,
          behavior: "smooth",
        })
      }

      if (pageScroller && permissionSection) {
        const scrollerTop = pageScroller.getBoundingClientRect().top
        const sectionTop = permissionSection.getBoundingClientRect().top
        pageScroller.scrollTo({
          top: pageScroller.scrollTop + sectionTop - scrollerTop,
        })
      }

      scrollPanelToTarget()
      releaseProgrammaticScroll()
    })
  }

  const getSectionStats = (section: (typeof sections)[number]) => {
    const sectionPermissions = section.rows.flatMap((row) => row.permissions)
    return {
      selected: sectionPermissions.filter((permission) =>
        selectedPermissions.includes(permission.codename)
      ).length,
      total: sectionPermissions.length,
    }
  }

  const isSectionChecked = (section: (typeof sections)[number]) => {
    const sectionPermissions = section.rows.flatMap((row) => row.permissions)
    return (
      sectionPermissions.length > 0 &&
      sectionPermissions.every((permission) =>
        selectedPermissions.includes(permission.codename)
      )
    )
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = "Role name is required"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => router.push("/settings/roles")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const payLoad = {
      ...values,
      code: values.code.trim() ? values.code : buildCode(values.name),
    }

    setIsSubmitting(true)
    try {
      if (isEdit) {
        const response = await editRole({ id, payLoad }).unwrap()
        showToast.success(response?.message || "Role updated successfully.")
      } else {
        const response = await createRole(payLoad).unwrap()
        showToast.success(response?.message || "Role created successfully.")
      }
      goBack()
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPermissionTable = (rows: PermissionRow[]) => {
    return (
      <div className="min-w-0 rounded-xl border">
        <div className="thin-scrollbar w-full overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-[280px] border-b border-r px-4 py-4 text-left font-bold">
                  Title
                </th>
                <th className="border-b border-r px-4 py-4 text-center font-bold">
                  Full
                </th>
                {actionColumns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-r px-4 py-4 text-center font-bold"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="border-b px-4 py-4 text-left font-bold">
                  Other
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowCodes = row.permissions.map((permission) => permission.codename)
                const rowChecked = rowCodes.every((codename) =>
                  selectedPermissions.includes(codename)
                )

                return (
                  <tr key={row.key} className="border-b last:border-b-0">
                    <td className="border-r px-4 py-4">
                      <div className="font-semibold text-gray-900">{row.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {row.permissions.length} permission
                        {row.permissions.length === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="border-r px-4 py-4 text-center">
                      <Checkbox
                        checked={rowChecked}
                        onCheckedChange={(value) => toggleRow(row, Boolean(value))}
                      />
                    </td>
                    {actionColumns.map((column) => {
                      const permission = row.actions[column.key]
                      const checked = permission
                        ? selectedPermissions.includes(permission.codename)
                        : false

                      return (
                        <td key={column.key} className="border-r px-4 py-4 text-center">
                          {permission ? (
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                togglePermission(permission.codename, Boolean(value))
                              }
                            />
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-4">
                      {row.other.length ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold"
                            >
                              More actions
                              <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {row.other.length}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              {row.title} actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {row.other.map((permission) => {
                              const checked = selectedPermissions.includes(permission.codename)
                              return (
                                <DropdownMenuItem
                                  key={permission.codename}
                                  onSelect={(event) => event.preventDefault()}
                                  onClick={() => togglePermission(permission.codename, !checked)}
                                  className="cursor-pointer gap-3 text-sm"
                                >
                                  <Checkbox checked={checked} />
                                  <span>{permission.name || titleCase(permission.codename)}</span>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const isLoading = permissions.isLoading || (isEdit && role.isLoading)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-none flex-col gap-3 border-b bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={goBack}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{isEdit ? "Edit Role" : "Create Role"}</h1>
            </div>
          </div>
          <div className="flex flex-none justify-end gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={goBack} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? <Spinner /> : "Save Role"}
            </Button>
          </div>
        </div>

        <div
          ref={pageScrollRef}
          className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6"
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Loading role data...
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-5">
              <section className="rounded-xl border bg-white p-3 sm:p-4 lg:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BadgeCheck className="size-5 text-blue-600" />
                  <h2 className="text-base font-semibold">Role Information</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
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
                      as="textarea"
                      label="Description"
                      placeholder="Enter role description"
                      value={values.description}
                      onChange={(event) => updateField("description", event.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-semibold">Cashier Role</div>
                        <p className="text-xs text-muted-foreground">
                          Use this for register and billing users.
                        </p>
                      </div>
                      <Switch
                        checked={values.is_cashier}
                        onCheckedChange={(checked) => updateField("is_cashier", checked)}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-semibold">Store Manager Role</div>
                        <p className="text-xs text-muted-foreground">
                          Use this for branch manager users.
                        </p>
                      </div>
                      <Switch
                        checked={values.is_store_manager}
                        onCheckedChange={(checked) =>
                          updateField("is_store_manager", checked)
                        }
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section
                ref={permissionSectionRef}
                className="grid min-w-0 rounded-xl border bg-white lg:sticky lg:top-0 lg:z-10 lg:h-[calc(100svh-8.5rem)] lg:min-h-[560px] lg:overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]"
              >
                <aside className="hidden min-h-0 border-b bg-gray-50/70 p-3 sm:p-4 lg:block lg:border-r lg:border-b-0">
                  <div className="relative mb-4">
                    <UniFieldInput
                      prefix={<Search className="size-4" />}
                      placeholder="Search permissions..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      allowClear
                      onClear={() => setSearch("")}
                    />
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Building2 className="size-4" />
                    Modules
                  </div>
                  <div className="space-y-1">
                    {sections.map((section) => {
                      const Icon = section.icon
                      const stats = getSectionStats(section)
                      const isActive = section.key === activeSectionKey

                      return (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => scrollToSection(section.key)}
                          className={cn(
                            "flex min-w-max items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold duration-0 [transition:none] lg:w-full",
                            isActive
                              ? "bg-black text-white"
                              : "text-gray-700 hover:bg-white hover:text-gray-950"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="size-4" />
                            {section.title}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs duration-0 [transition:none]",
                              isActive ? "bg-white/15 text-white" : "bg-gray-200 text-gray-600"
                            )}
                          >
                            {stats.selected}/{stats.total}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </aside>

                <div
                  ref={permissionsPanelRef}
                  className="min-w-0 min-h-0 p-3 sm:p-4 lg:thin-scrollbar lg:overflow-y-auto"
                >
                  <div className="min-w-0 space-y-3">
                    {filteredSections.map((section) => {
                      const Icon = section.icon
                      return (
                        <div
                          key={section.key}
                          id={`role-permissions-${section.key}`}
                          className="scroll-mt-4"
                        >
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <div className="flex size-8 items-center justify-center rounded-lg">
                                <Icon className="size-5" />
                              </div>
                              <div>
                                <h2 className="text-base font-bold">{section.title}</h2>
                              </div>
                            </div>
                            <label className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm font-semibold">
                              <Checkbox
                                checked={isSectionChecked(section)}
                                onCheckedChange={(value) =>
                                  toggleSection(section, Boolean(value))
                                }
                              />
                              Full Access
                            </label>
                          </div>
                          {renderPermissionTable(section.rows)}
                        </div>
                      )
                    })}
                    {!filteredSections.length ? (
                      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No permissions found for this search.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
