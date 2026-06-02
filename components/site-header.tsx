"use client"

import Image from "next/image"

import { NavUser } from "@/components/nav-user"
import { SearchForm } from "@/components/search-form"
import { Building2, MapPin } from "lucide-react"

type SiteHeaderProps = {
  companyName?: string | null
  branchName?: string | null
  userName?: string | null
  userContact?: string | null
  userImage?: string | null
  onLogout?: () => void
}

export function SiteHeader({
  companyName,
  branchName,
  userName,
  userContact,
  userImage,
  onLogout,
}: SiteHeaderProps) {
  return (
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

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {companyName || "Enter your company name"}
              </p>
              <p className="text-[10px] font-medium text-slate-500">Company</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-200 md:block" />

          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {branchName || "Main Branch"}
              </p>
              <p className="text-[10px] font-medium text-slate-500">
                Current Branch
              </p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <SearchForm className="w-full max-w-xs sm:w-auto" />
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
  )
}
