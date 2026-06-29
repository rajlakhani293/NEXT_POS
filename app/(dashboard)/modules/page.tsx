"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArchiveIcon, RefreshCwIcon, SearchIcon, Trash2Icon, UploadIcon } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

type ModuleRecord = {
  namespace: string
  name: string
  author?: string
  version?: string
  description?: string | Record<string, string>
  enabled?: boolean
  autoloaded?: boolean
  invalid?: boolean
  "psr-4-compliance"?: boolean
}

type ModuleSegment = "" | "enabled" | "disabled" | "invalid"

const descriptionText = (description: ModuleRecord["description"], language: string) => {
  if (!description) return ""
  if (typeof description === "string") return description
  return description[language] || description.en || Object.values(description)[0] || ""
}

const truncateWords = (value: string, maxWords = 20) => {
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return value
  return `${words.slice(0, maxWords).join(" ")}...`
}

export default function ModulesPage() {
  const { t, language } = useTranslation()
  const [segment, setSegment] = useState<ModuleSegment>("")
  const [searchText, setSearchText] = useState("")
  const [expandedModule, setExpandedModule] = useState<ModuleRecord | null>(null)
  const [getModules, modulesState] = (settings as any).useGetModulesMutation()
  const [enableModule, enableState] = (settings as any).useEnableModuleMutation()
  const [disableModule, disableState] = (settings as any).useDisableModuleMutation()
  const [deleteModule, deleteState] = (settings as any).useDeleteModuleMutation()

  const loadModules = useCallback(
    async (nextSegment: ModuleSegment = segment) => {
      const response = await getModules({ segment: nextSegment }).unwrap()
      return response
    },
    [getModules, segment]
  )

  useEffect(() => {
    loadModules("").catch((error: any) => {
      showToast.error(error?.data?.message || t("Unable to load modules."))
    })
  }, [])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault()
        document.getElementById("module-search")?.focus()
      }
    }
    document.addEventListener("keypress", handleKeyPress)
    return () => document.removeEventListener("keypress", handleKeyPress)
  }, [])

  const payload = modulesState.data?.data || {}
  const modules: ModuleRecord[] = useMemo(() => {
    const values = Object.values(payload.modules || {}) as ModuleRecord[]
    if (!searchText.trim()) return values
    const regex = new RegExp(searchText.trim(), "i")
    return values.filter((item) => regex.test(item.name || item.namespace))
  }, [payload.modules, searchText])

  const changeSegment = async (nextSegment: ModuleSegment) => {
    setSegment(nextSegment)
    await loadModules(nextSegment)
  }

  const refreshModules = async () => {
    await loadModules(segment)
    showToast.success(t("Report Refreshed"))
  }

  const runOperation = async (operation: "enable" | "disable" | "delete", module: ModuleRecord) => {
    if (operation === "delete") {
      const confirmed = window.confirm(
        t('Would you like to delete "{module}"? All data created by the module might also be deleted.').replace("{module}", module.name)
      )
      if (!confirmed) return
    }

    const mutation =
      operation === "enable" ? enableModule : operation === "disable" ? disableModule : deleteModule
    const response = await mutation({ namespace: module.namespace }).unwrap()
    showToast.success(response?.message || t("The operation was successful."))
    await loadModules(segment)
  }

  const isBusy =
    modulesState.isLoading ||
    enableState.isLoading ||
    disableState.isLoading ||
    deleteState.isLoading

  return (
    <PermissionGuard permission={PERMISSIONS.special.manageModules}>
      <div className="flex h-full flex-col space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button type="button" variant="outline" onClick={refreshModules} disabled={isBusy}>
              {modulesState.isLoading ? <Spinner /> : <RefreshCwIcon className="size-4" />}
              {t("Refresh")}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/modules/upload">
                {t("Upload")}
                <UploadIcon className="size-4" />
              </Link>
            </Button>
            <div className="relative md:w-72">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="module-search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={t('Press "/" to search modules')}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-semibold text-blue-600">
            <button type="button" className="hover:underline" onClick={() => changeSegment("enabled")}>
              {t("Enabled")}({payload.total_enabled || 0})
            </button>
            <button type="button" className="hover:underline" onClick={() => changeSegment("disabled")}>
              {t("Disabled")} ({payload.total_disabled || 0})
            </button>
            <button type="button" className="hover:underline" onClick={() => changeSegment("invalid")}>
              {t("Invalid")} ({payload.total_invalid || 0})
            </button>
          </div>
        </div>

        {modulesState.isLoading ? (
          <div className="flex h-32 items-center justify-center border border-dashed">
            <Spinner />
          </div>
        ) : modules.length === 0 ? (
          <div className="flex h-32 items-center justify-center border border-dashed text-sm text-slate-500">
            {searchText ? t("No modules matches your search term.") : t("There is nothing to display here.")}
          </div>
        ) : (
          <div className="-mx-4 flex flex-wrap">
            {modules.map((module) => {
              const description = descriptionText(module.description, language)
              const canOperate = !module.autoloaded && module["psr-4-compliance"] !== false && !module.invalid
              return (
                <div key={module.namespace} className="w-full px-4 py-4 md:w-1/2 xl:w-1/3">
                  <div className="overflow-hidden rounded-md border bg-white shadow-sm">
                    <div className="h-36 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-950">{module.name}</h3>
                        <Badge variant={module.enabled ? "default" : module.invalid ? "destructive" : "secondary"}>
                          {module.invalid ? t("Invalid") : module.enabled ? t("Enabled") : t("Disabled")}
                        </Badge>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span>{module.author || "-"}</span>
                        <strong>v{module.version || "-"}</strong>
                      </div>
                      {module["psr-4-compliance"] === false ? (
                        <p className="mt-1 text-xs font-semibold text-rose-600">{t("not PSR-4 Compliant")}</p>
                      ) : null}
                      {description ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {truncateWords(description)}
                          {description.split(/\s+/).length > 20 ? (
                            <button
                              type="button"
                              className="ml-1 text-xs font-semibold text-blue-600 hover:underline"
                              onClick={() => setExpandedModule(module)}
                            >
                              [{t("Read More")}]
                            </button>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between border-t p-2">
                      {module.enabled ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!canOperate || isBusy}
                          onClick={() => runOperation("disable", module)}
                        >
                          {t("Disable")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!canOperate || isBusy}
                          onClick={() => runOperation("enable", module)}
                        >
                          {t("Enable")}
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="icon" disabled={module.autoloaded} title={t("Download")}>
                          <ArchiveIcon className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          disabled={module.autoloaded || isBusy}
                          title={t("Delete")}
                          onClick={() => runOperation("delete", module)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {expandedModule ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setExpandedModule(null)}>
            <div className="max-w-lg rounded-md bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <h2 className="text-lg font-semibold">{expandedModule.name}</h2>
              <p className="mt-3 text-sm text-slate-600">{descriptionText(expandedModule.description, language)}</p>
              <div className="mt-4 flex justify-end">
                <Button type="button" onClick={() => setExpandedModule(null)}>
                  {t("Close")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  )
}
