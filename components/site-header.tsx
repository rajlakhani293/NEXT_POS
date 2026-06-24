"use client"

import { useEffect, useRef, useState } from "react"
import Cookies from "js-cookie"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { HeaderNotifications } from "@/components/header-notifications"
import { NavUser } from "@/components/nav-user"
import { SearchForm } from "@/components/search-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth } from "@/lib/api/auth"
import { catalog } from "@/lib/api/catalog"
import { settings } from "@/lib/api/settings"
import { useAppDispatch } from "@/lib/redux/hooks"
import { useSession } from "@/lib/redux/session-provider"
import { showToast } from "@/lib/toast"
import { Building2, MapPin, Globe } from "lucide-react"
import { useTranslation } from "@/lib/contexts/TranslationContext"

type SiteHeaderProps = {
  companyLogo?: string | null
  companyName?: string | null
  companyCode?: string | null
  branchName?: string | null
  branchCode?: string | null
  branchId?: number | null
  branchList?: {
    id: number
    name: string
    code?: string
    city?: string
    phone?: string
    is_head_office?: boolean
  }[]
  userName?: string | null
  userContact?: string | null
  userImage?: string | null
  onLogout?: () => void
}

const initialBranchValues = {
  name: "",
  code: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
}

const onlyDigits = (value: any, maxLength: number) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, maxLength)

const formatIndianMobile = (value: any) => {
  const digits = onlyDigits(value, 10)
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}

const validateIndianMobile = (value: any) => {
  if (!value) return ""
  const digits = onlyDigits(value, 10)
  if (digits.length !== 10) return "Phone number must be 10 digits"
  if (!/^[6-9]/.test(digits)) return "Phone number must start with 6, 7, 8, or 9"
  return ""
}

function BranchQuickForm({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <CatalogMasterForm
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      entityName="Branch"
      fields={[
        {
          name: "name",
          label: "Branch Name",
          placeholder: "Enter branch name",
          type: "text",
          required: true,
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "98765 43210",
          type: "text",
          prefix: "+91",
          inputMode: "numeric",
          maxLength: 11,
          sanitize: formatIndianMobile,
          validate: validateIndianMobile,
        },
        { name: "address", label: "Address", placeholder: "Enter address", type: "textarea", rows: 3 },
        { name: "city", label: "City", placeholder: "Enter city", type: "text" },
        { name: "state", label: "State", placeholder: "Enter state", type: "text" },
        {
          name: "postal_code",
          label: "Postal Code",
          placeholder: "6 digit postal code",
          type: "text",
          inputMode: "numeric",
          maxLength: 6,
          sanitize: (value: any) => onlyDigits(value, 6),
          validate: (value: any) =>
            value && String(value).length !== 6 ? "Postal code must be 6 digits" : "",
        },
      ]}
      initialValues={initialBranchValues}
      createHook={(settings as any).useCreateBranchMutation}
      editHook={(settings as any).useEditBranchMutation}
      getByIdHook={(settings as any).useGetBranchByIdMutation}
      buildPayload={(values) => ({
        ...values,
        phone: values.phone ? onlyDigits(values.phone, 10) : "",
      })}
    />
  )
}

export function SiteHeader({
  companyLogo,
  companyName,
  companyCode,
  branchName,
  branchCode,
  branchId,
  branchList = [],
  userName,
  userContact,
  userImage,
  onLogout,
}: SiteHeaderProps) {
  const { refreshSession } = useSession()
  const { language, changeLanguage } = useTranslation()
  const languagesList = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية" },
  ]
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isBranchFormOpen, setIsBranchFormOpen] = useState(false)
  const [switchBranch, switchState] = auth.useSwitchBranchMutation()

  const handleSwitchBranch = async (nextBranchId: number) => {
    if (nextBranchId === branchId || switchState.isLoading) return
    const response = await switchBranch({ branch_id: nextBranchId }).unwrap()
    if (response?.data?.token) {
      Cookies.set("token", response.data.token, { expires: 1, path: "/" })
    }
    dispatch(catalog.util.resetApiState())
    dispatch(settings.util.resetApiState())
    await refreshSession()
    router.push("/dashboard")
    showToast.success(response?.message || "Branch switched successfully.")
  }

  const handleBranchCreated = async () => {
    setIsBranchFormOpen(false)
    await refreshSession()
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex w-full items-center border-b bg-white">
        <div className="flex h-(--header-height) w-full items-center justify-between gap-3 px-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/next.svg"
              alt="Next.js"
              width={100}
              height={100}
              loading="eager"
              className="w-24"
            />

            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            <button
              type="button"
              className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-slate-50"
            >
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName || "Company"}
                  className="h-8 w-8 shrink-0 rounded-full border object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Building2 className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {companyName || "Enter your company name"}
                </p>
                <p className="truncate text-[10px] font-medium text-slate-500">
                  {companyCode ? `Company · ${companyCode}` : "Company"}
                </p>
              </div>
            </button>

            <div className="hidden h-7 w-px bg-slate-200 md:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-slate-50 md:flex"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {branchName || "Main Branch"}
                    </p>
                    <p className="truncate text-[10px] font-medium text-slate-500">
                      {branchCode ? `Current Branch · ${branchCode}` : "Current Branch"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={10} className="w-72">
                {/* <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
                <DropdownMenuSeparator /> */}
                {branchList.length ? (
                  branchList.map((branch) => (
                    <DropdownMenuItem
                      key={branch.id}
                      disabled={switchState.isLoading}
                      onClick={() => handleSwitchBranch(branch.id)}
                      className="flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{branch.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[branch.code, branch.city].filter(Boolean).join(" · ") || "Branch"}
                        </div>
                      </div>
                      {branch.id === branchId ? (
                        <span className="text-xs font-semibold text-emerald-600">Active</span>
                      ) : null}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No branches found</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsBranchFormOpen(true)}
                >
                  Add Branch
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <SearchForm className="w-full max-w-xs sm:w-auto" />
            <HeaderNotifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languagesList.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden sm:block">
              <NavUser
                user={{
                  name: userName || "Super Admin",
                  email: userContact || "Workspace owner",
                  avatar: userImage || "",
                }}
                onLogout={onLogout}
                dropdownSide="bottom"
                dropdownAlign="end"
                iconOnly
              />
            </div>
          </div>
        </div>
      </header>
      <BranchQuickForm
        isOpen={isBranchFormOpen}
        onClose={() => setIsBranchFormOpen(false)}
        onSuccess={handleBranchCreated}
      />
    </>
  )
}
