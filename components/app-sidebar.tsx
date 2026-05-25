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
  ShoppingBagIcon,
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
    title: "Products",
    url: "/products",
    icon: <ShoppingBagIcon />,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: <BoxesIcon />,
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
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const navMain = dashboardNavSections.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
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
