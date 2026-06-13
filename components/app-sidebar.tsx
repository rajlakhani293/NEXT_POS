"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS, type PermissionRequirement } from "@/lib/permissions"
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
  LandmarkIcon,
  ImageIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TicketPercentIcon,
  StoreIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react"
import {
  MdOutlineArrowCircleLeft,
  MdOutlineArrowCircleRight,
} from "react-icons/md"
import { IoSettingsOutline } from "react-icons/io5"
import { HiReceiptTax } from "react-icons/hi"

type DashboardNavSection = {
  title: string
  url: string
  icon: React.ReactNode
  permission?: PermissionRequirement
  permissionMatch?: "all" | "any"
  items?: {
    title: string
    url: string
    permission?: PermissionRequirement
    permissionMatch?: "all" | "any"
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
    permission: PERMISSIONS.sales.view,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: <BoxesIcon />,
    permission: PERMISSIONS.products.view,
    items: [
      {
        title: "Products",
        url: "/inventory/products",
        permission: PERMISSIONS.products.view,
      },
      {
        title: "Categories",
        url: "/inventory/categories",
        permission: PERMISSIONS.products.view,
      },
      {
        title: "Brands",
        url: "/inventory/brands",
        permission: PERMISSIONS.products.view,
      },
      {
        title: "Unit Groups",
        url: "/inventory/unit-groups",
        permission: PERMISSIONS.products.view,
      },
      {
        title: "Units",
        url: "/inventory/units",
        permission: PERMISSIONS.products.view,
      },
    ],
  },
  {
    title: "Customers",
    url: "/customers",
    icon: <UsersIcon />,
    permission: PERMISSIONS.customers.view,
    items: [
      {
        title: "Customers",
        url: "/customers",
        permission: PERMISSIONS.customers.view,
      },
      {
        title: "Customer Groups",
        url: "/customers/groups",
        permission: PERMISSIONS.customers.view,
      },
    ],
  },
  {
    title: "Purchases",
    url: "/purchases",
    icon: <ShoppingCartIcon />,
    permission: PERMISSIONS.purchases.view,
    items: [
      {
        title: "Purchase Orders",
        url: "/purchases",
        permission: PERMISSIONS.purchases.view,
      },
      {
        title: "Suppliers",
        url: "/purchases/suppliers",
        permission: PERMISSIONS.purchases.view,
      },
    ],
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: <WalletCardsIcon />,
    permission: PERMISSIONS.settings.view,
    items: [
      {
        title: "Expenses",
        url: "/expenses",
        permission: PERMISSIONS.settings.view,
      },
      {
        title: "Categories",
        url: "/expenses/categories",
        permission: PERMISSIONS.settings.view,
      },
    ],
  },
  {
    title: "Registers",
    url: "/registers",
    icon: <StoreIcon />,
    permission: PERMISSIONS.cashRegister.view,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: <FileBarChart2Icon />,
    permission: PERMISSIONS.reports.view,
  },
  {
    title: "Settings",
    url: "/settings/company",
    icon: <IoSettingsOutline />,
    permission: [
      PERMISSIONS.settings.view,
      PERMISSIONS.branches.view,
      PERMISSIONS.payments.view,
      PERMISSIONS.promotions.view,
      PERMISSIONS.rewards.view,
    ],
    permissionMatch: "any",
  },
]

const settingsNavSections: DashboardNavSection[] = [
  {
    title: "Company",
    url: "/settings/company",
    icon: <LandmarkIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Branches",
    url: "/settings/branches",
    icon: <StoreIcon />,
    permission: PERMISSIONS.branches.view,
  },
  {
    title: "Business Settings",
    url: "/settings/business",
    icon: <SlidersHorizontalIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Payment Types",
    url: "/settings/payment-types",
    icon: <WalletCardsIcon />,
    permission: PERMISSIONS.payments.view,
  },
  {
    title: "Accounting",
    url: "/settings/accounting/accounts",
    icon: <WalletCardsIcon />,
    permission: PERMISSIONS.reports.view,
    items: [
      {
        title: "Accounts",
        url: "/settings/accounting/accounts",
        permission: PERMISSIONS.reports.view,
      },
      {
        title: "Rules",
        url: "/settings/accounting/rules",
        permission: PERMISSIONS.reports.view,
      },
      {
        title: "Transactions",
        url: "/settings/accounting/transactions",
        permission: PERMISSIONS.reports.view,
      },
      {
        title: "History",
        url: "/settings/accounting/history",
        permission: PERMISSIONS.reports.view,
      },
      {
        title: "Configuration",
        url: "/settings/accounting/configuration",
        permission: PERMISSIONS.reports.view,
      },
    ],
  },
  {
    title: "Media",
    url: "/settings/media",
    icon: <ImageIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Users",
    url: "/settings/users",
    icon: <UsersIcon />,
    permission: PERMISSIONS.users.view,
  },
  {
    title: "Roles",
    url: "/settings/roles",
    icon: <ShieldCheckIcon />,
    permission: PERMISSIONS.roles.view,
  },
  {
    title: "Tax Groups",
    url: "/settings/tax-groups",
    icon: <HiReceiptTax />,
    permission: PERMISSIONS.products.view,
  },
  {
    title: "Taxes",
    url: "/settings/taxes",
    icon: <ReceiptTextIcon />,
    permission: PERMISSIONS.products.view,
  },
  {
    title: "Coupons",
    url: "/settings/coupons",
    icon: <TicketPercentIcon />,
    permission: PERMISSIONS.promotions.view,
  },
  {
    title: "Rewards",
    url: "/settings/rewards",
    icon: <SparklesIcon />,
    permission: PERMISSIONS.rewards.view,
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
      className="flex h-8 w-full items-center gap-2 rounded-sm border border-sidebar-border bg-white px-2 text-sm font-semibold text-sidebar-foreground transition-colors group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-3 hover:text-sidebar-accent-foreground"
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
  const { hasPermission } = usePermissions()

  const filterNavItems = (sections: DashboardNavSection[]) =>
    sections.reduce<DashboardNavSection[]>((visibleItems, item) => {
      const visibleSubItems = item.items?.filter((subItem) =>
        hasPermission(subItem.permission, subItem.permissionMatch)
      )

      const canViewItem = hasPermission(item.permission, item.permissionMatch)
      if (!canViewItem && !visibleSubItems?.length) return visibleItems

      visibleItems.push({
        ...item,
        items: visibleSubItems,
      })

      return visibleItems
    }, [])

  const matchesUrl = (url: string) => {
    if (url === "/sales") {
      return pathname === "/sales" || pathname.startsWith("/sales/")
    }

    return pathname === url || pathname.startsWith(`${url}/`)
  }

  const buildNavItems = (sections: DashboardNavSection[]) =>
    sections.map((item) => {
      const activeSubItem = item.items
        ?.filter((subItem) => matchesUrl(subItem.url))
        .sort((first, second) => second.url.length - first.url.length)[0]

      return {
        ...item,
        isActive: Boolean(activeSubItem) || matchesUrl(item.url),
        items: item.items?.map((subItem) => ({
          ...subItem,
          isActive: activeSubItem?.url === subItem.url,
        })),
      }
    })
  const mainNavItems = buildNavItems(filterNavItems(mainNavSections))
  const settingsNavItems = buildNavItems(filterNavItems(settingsNavSections))

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! border-r-0"
      {...props}
    >
      {isSettingsMode ? (
        <SidebarHeader className="gap-2 px-2 pt-2 pb-0">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
