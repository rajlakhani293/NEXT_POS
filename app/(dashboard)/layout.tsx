"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useSession } from "@/lib/redux/session-provider"
import { useAppSelector } from "@/lib/redux/hooks"

export const iframeHeight = "800px"

export const description = "A sidebar with a header and a search form."

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { clearSession } = useSession()
  const user = useAppSelector((state) => state.session.user)
  const branch = useAppSelector((state) => state.session.branch)
  const company = useAppSelector((state) => state.session.company)

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader
          companyName={company?.name}
          branchName={branch?.name}
          userName={user?.full_name}
          userContact={user?.phone || user?.email}
          userImage={user?.profile_image}
          onLogout={clearSession}
        />
        <div className="flex flex-1 bg-[#F9F9F9]">
          <AppSidebar />
          <SidebarInset className="bg-[#F9F9F9]">
            <div className="flex min-h-0 flex-1 flex-col px-4 py-5 md:px-6 md:py-6 bg-white border border-gray-100 m-2 rounded-lg">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
