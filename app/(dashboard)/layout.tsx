"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import {
  DashboardLayoutProvider,
  useDashboardPadding,
} from "@/components/dashboard/dashboard-page"
import { RoutePermissionGuard } from "@/components/route-permission-guard"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { useSession } from "@/lib/redux/session-provider"
import { useAppSelector } from "@/lib/redux/hooks"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutProvider>
      <DashboardLayoutFrame>{children}</DashboardLayoutFrame>
    </DashboardLayoutProvider>
  )
}

function DashboardLayoutFrame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const padding = useDashboardPadding()
  const pathname = usePathname()
  const { logout } = useSession()
  const user = useAppSelector((state) => state.session.user)
  const branch = useAppSelector((state) => state.session.branch)
  const branchList = useAppSelector((state) => state.session.branchList)
  const company = useAppSelector((state) => state.session.company)
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  )
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const isFullScreenPos = pathname === "/sales/create"

  const pageContent = isFullScreenPos ? (
    <div className="h-svh overflow-hidden bg-white">
      <RoutePermissionGuard>{children}</RoutePermissionGuard>
    </div>
  ) : (
    <div className="h-svh overflow-hidden [--header-height:calc(--spacing(12))]">
      <SidebarProvider
        defaultOpen={false}
        className="flex h-full min-h-0 flex-col"
      >
        <SiteHeader
          company={company}
          branch={branch}
          branchList={branchList}
          user={user}
          onLogout={logout}
        />
        <div className="flex min-h-0 flex-1 bg-[#F9F9F9]">
          <AppSidebar />
          <SidebarInset className="min-h-0 overflow-hidden bg-[#F9F9F9]">
            <div
              className={[
                "thin-scrollbar m-2 flex min-h-0 flex-1 flex-col rounded-lg border border-gray-100 bg-white",
                padding === "none" ? "overflow-hidden p-0" : "overflow-y-auto p-6",
              ].join(" ")}
            >
              <RoutePermissionGuard>{children}</RoutePermissionGuard>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )

  return (
    <>
      {pageContent}

      <Dialog open={isOffline}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden border-none p-0 shadow-2xl"
        >
          <div className="bg-white p-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div>
                <DialogTitle className="text-xl font-medium tracking-tight text-slate-900">
                  {t("Connection Lost")}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-slate-500">
                  {t("We're having trouble reaching the server. Please check your internet connection and try again.")}
                </DialogDescription>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <Spinner className="size-12 text-slate-800" />
              </div>
            </div>
          </div>

          <div className="flex justify-center border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                {t("Attempting to reconnect")}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
