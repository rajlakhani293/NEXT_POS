"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { usePermissions } from "@/hooks/use-permissions"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { usePosOptions } from "@/lib/options"
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
  AlertTriangle,
  Server,
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
    items: [
      {
        title: "Open POS",
        url: "/pos",
        permission: PERMISSIONS.sales.create,
      },
      {
        title: "Orders List",
        url: "/sales",
        permission: PERMISSIONS.sales.view,
      },
    ],
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
        title: "Unit Groups",
        url: "/inventory/unit-groups",
        permission: PERMISSIONS.products.view,
      },
      {
        title: "Units",
        url: "/inventory/units",
        permission: PERMISSIONS.products.view,
      },
      {
        title: "Print Labels",
        url: "/inventory/labels",
        permission: PERMISSIONS.products.view,
      },
    ],
  },
  {
    title: "Customers",
    url: "/customers",
    icon: <UsersIcon />,
    permission: [
      PERMISSIONS.customers.view,
      PERMISSIONS.customers.create,
      PERMISSIONS.rewards.view,
      PERMISSIONS.rewards.create,
      PERMISSIONS.promotions.view,
      PERMISSIONS.promotions.create,
    ],
    permissionMatch: "any",
    items: [
      {
        title: "List",
        url: "/customers",
        permission: PERMISSIONS.customers.view,
      },
      {
        title: "Create Customer",
        url: "/customers?create=1",
        permission: PERMISSIONS.customers.create,
      },
      {
        title: "Customers Groups",
        url: "/customers/groups",
        permission: PERMISSIONS.customers.view,
      },
      {
        title: "Create Group",
        url: "/customers/groups?create=1",
        permission: PERMISSIONS.customers.create,
      },
      {
        title: "Reward Systems",
        url: "/customers/rewards-system",
        permission: PERMISSIONS.rewards.view,
      },
      {
        title: "Create Reward",
        url: "/customers/rewards-system?create=1",
        permission: PERMISSIONS.rewards.create,
      },
      {
        title: "List Coupons",
        url: "/customers/coupons",
        permission: PERMISSIONS.promotions.view,
      },
      {
        title: "Create Coupon",
        url: "/customers/coupons?create=1",
        permission: PERMISSIONS.promotions.create,
      },
    ],
  },
  {
    title: "Providers",
    url: "/providers",
    icon: <UsersIcon />,
    permission: [
      PERMISSIONS.purchases.view,
      PERMISSIONS.purchases.create,
    ],
    permissionMatch: "any",
    items: [
      {
        title: "List",
        url: "/providers",
        permission: PERMISSIONS.purchases.view,
      },
      {
        title: "Create A Provider",
        url: "/providers?create=1",
        permission: PERMISSIONS.purchases.create,
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
  {
    title: "Background Jobs",
    url: "/settings/workers",
    icon: <Server />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Reset Database",
    url: "/settings/reset",
    icon: <AlertTriangle />,
    permission: PERMISSIONS.settings.view,
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
  const { t } = useTranslation()
  const posOptions = usePosOptions()

  const filterNavItems = (sections: DashboardNavSection[]) =>
    sections.reduce<DashboardNavSection[]>((visibleItems, item) => {
      if (item.url === "/registers" && !posOptions.enable_cash_registers) {
        return visibleItems
      }

      const itemWithOptionChildren =
        item.url === "/sales" && posOptions.orders_allow_unpaid
          ? {
              ...item,
              items: [
                ...(item.items || []),
                {
                  title: "Instalments",
                  url: "/sales/instalments",
                  permission: PERMISSIONS.payments.collectDue,
                },
              ],
            }
          : item

      const visibleSubItems = itemWithOptionChildren.items?.filter((subItem) =>
        hasPermission(subItem.permission, subItem.permissionMatch)
      )

      const canViewItem = hasPermission(
        itemWithOptionChildren.permission,
        itemWithOptionChildren.permissionMatch
      )
      if (!canViewItem && !visibleSubItems?.length) return visibleItems

      visibleItems.push({
        ...itemWithOptionChildren,
        items: visibleSubItems,
      })

      return visibleItems
    }, [])

  const matchesUrl = (url: string) => {
    const itemPath = url.split("?")[0]

    if (itemPath === "/pos") {
      return pathname === "/pos" || pathname === "/sales/create"
    }

    if (itemPath === "/sales") {
      return pathname === "/sales" || (pathname.startsWith("/sales/") && pathname !== "/sales/create")
    }

    return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
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
  const translateNavItem = (item: any) => {
    const key = item.title.toLowerCase().replace(/\s+/g, "_")
    return {
      ...item,
      title: t(key),
      items: item.items?.map((subItem: any) => {
        const subKey = subItem.title.toLowerCase().replace(/\s+/g, "_")
        return {
          ...subItem,
          title: t(subKey),
        }
      }),
    }
  }
  const mainNavItems = buildNavItems(filterNavItems(mainNavSections)).map(translateNavItem)
  const settingsNavItems = buildNavItems(filterNavItems(settingsNavSections)).map(translateNavItem)

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
