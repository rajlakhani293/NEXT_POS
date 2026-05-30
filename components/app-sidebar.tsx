"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import {
  BoxesIcon,
  FileBarChart2Icon,
  LayoutGridIcon,
  ReceiptTextIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"

export const dashboardNavSections = [
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
    url: "/settings",
    icon: <Settings2Icon />,
    items: [
      {
        title: "Tax Groups",
        url: "/settings/tax-groups",
      },
      {
        title: "Taxes",
        url: "/settings/taxes",
      },
    ],
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const navMain = dashboardNavSections.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
    items: item.items?.map((subItem) => ({
      ...subItem,
      isActive: pathname === subItem.url || pathname.startsWith(`${subItem.url}/`),
    })),
  }))

  return (
    <Sidebar
      collapsible="offcanvas"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! border-r-0"
      {...props}
    >
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
