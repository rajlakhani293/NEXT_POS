"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ArrowLeftIcon,
  BoxesIcon,
  FileBarChart2Icon,
  LayoutGridIcon,
  ReceiptTextIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"
import { MdOutlineArrowCircleLeft, MdOutlineArrowCircleRight } from "react-icons/md"

type DashboardNavSection = {
  title: string
  url: string
  icon: React.ReactNode
  items?: {
    title: string
    url: string
  }[]
}

const mainNavSections: DashboardNavSection[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutGridIcon />,
  },
  {
    title: "Sales",
    url: "/sales",
    icon: <ReceiptTextIcon />,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: <BoxesIcon />,
    items: [
      {
        title: "Products",
        url: "/inventory/products",
      },
      {
        title: "Categories",
        url: "/inventory/categories",
      },
      {
        title: "Brands",
        url: "/inventory/brands",
      },
      {
        title: "Unit Groups",
        url: "/inventory/unit-groups",
      },
      {
        title: "Units",
        url: "/inventory/units",
      },
    ],
  },
  {
    title: "Customers",
    url: "/customers",
    icon: <UsersIcon />,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: <FileBarChart2Icon />,
  },
  {
    title: "Settings",
    url: "/settings/tax-groups",
    icon: <Settings2Icon />,
  },
]

const settingsNavSections: DashboardNavSection[] = [
  {
    title: "Tax Groups",
    url: "/settings/tax-groups",
    icon: <Settings2Icon />,
  },
  {
    title: "Taxes",
    url: "/settings/taxes",
    icon: <ReceiptTextIcon />,
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

function SidebarCollapseButton() {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="flex h-8 w-full items-center gap-2 rounded-sm border border-sidebar-border bg-white px-2 text-sm font-semibold text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-3"
      title="Toggle Sidebar"
    >
      {isCollapsed ? (
        <MdOutlineArrowCircleRight className="size-4 shrink-0" />
      ) : (
        <MdOutlineArrowCircleLeft className="size-4 shrink-0" />
      )}
      <span className="truncate group-data-[collapsible=icon]:hidden">
        Collapse
      </span>
    </button>
  )
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const isSettingsMode = pathname.startsWith("/settings")

  const buildNavItems = (sections: DashboardNavSection[]) => sections.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
    items: item.items?.map((subItem) => ({
      ...subItem,
      isActive: pathname === subItem.url || pathname.startsWith(`${subItem.url}/`),
    })),
  }))
  const mainNavItems = buildNavItems(mainNavSections)
  const settingsNavItems = buildNavItems(settingsNavSections)

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! border-r-0"
      {...props}
    >
      {isSettingsMode ? (
        <SidebarHeader className="gap-2 px-2 py-2">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <ArrowLeftIcon className="size-4 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">
                Back to Home
              </span>
            </Link>
          </div>
        </SidebarHeader>
      ) : null}
      <SidebarContent className="overflow-hidden">
        <div className="relative min-h-full overflow-hidden">
          <div
            aria-hidden={isSettingsMode}
            className={[
              "absolute inset-x-0 top-0 transition-all duration-300 ease-out",
              isSettingsMode
                ? "pointer-events-none -translate-x-full opacity-0"
                : "translate-x-0 opacity-100",
            ].join(" ")}
          >
            <NavMain items={mainNavItems} />
          </div>
          <div
            aria-hidden={!isSettingsMode}
            className={[
              "absolute inset-x-0 top-0 transition-all duration-300 ease-out",
              isSettingsMode
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-full opacity-0",
            ].join(" ")}
          >
            <NavMain items={settingsNavItems} />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="px-2 py-2">
        <SidebarCollapseButton />
      </SidebarFooter>
    </Sidebar>
  )
}
