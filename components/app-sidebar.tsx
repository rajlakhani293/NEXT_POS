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
  StoreIcon,
  UsersIcon,
  WalletCardsIcon,
  AlertTriangle,
  PlugIcon,
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
    permission: PERMISSIONS.dashboard.view,
  },
  {
    title: "Sales",
    url: "/sales",
    icon: <ReceiptTextIcon />,
    permission: PERMISSIONS.sales.view,
    items: [
      {
        title: "Orders List",
        url: "/sales",
        permission: PERMISSIONS.sales.view,
      },
      {
        title: "Payment Types",
        url: "/sales/payment-types",
        permission: PERMISSIONS.payments.view,
      },
      {
        title: "Assigned Orders",
        url: "/sales/assigned",
        permission: PERMISSIONS.sales.deliver,
      },
    ],
  },
  {
    title: "Inventory",
    url: "/inventory/products",
    icon: <BoxesIcon />,
    permission: PERMISSIONS.products.view,
    items: [
      {
        title: "Products",
        url: "/inventory/products",
        permission: PERMISSIONS.products.view,
      },
      {
        title: "Print Labels",
        url: "/inventory/labels",
        permission: PERMISSIONS.products.labels,
      },
      {
        title: "Categories",
        url: "/inventory/categories",
        permission: PERMISSIONS.categories.view,
      },
      {
        title: "Units",
        url: "/inventory/units",
        permission: PERMISSIONS.productUnits.view,
      },
      {
        title: "Unit Groups",
        url: "/inventory/unit-groups",
        permission: PERMISSIONS.productUnits.view,
      },
      {
        title: "Stock Adjustment",
        url: "/inventory/adjustments",
        permission: PERMISSIONS.inventory.adjust,
      },
      {
        title: "Scale Range",
        url: "/inventory/scale-range",
        permission: PERMISSIONS.inventory.adjust,
      },
      {
        title: "Stock Flow Records",
        url: "/inventory/ledger",
        permission: PERMISSIONS.products.view,
      },
    ],
  },
  {
    title: "Modules",
    url: "/modules",
    icon: <PlugIcon />,
    permission: PERMISSIONS.special.manageModules,
  },
  {
    title: "Medias",
    url: "/medias",
    icon: <ImageIcon />,
    permission: PERMISSIONS.media.view,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: <UsersIcon />,
    permission: PERMISSIONS.customers.view,
    items: [
      {
        title: "List",
        url: "/customers",
        permission: PERMISSIONS.customers.view,
      },
      {
        title: "Customers Groups",
        url: "/customers/groups",
        permission: PERMISSIONS.customers.view,
      },
      {
        title: "Reward Systems",
        url: "/customers/rewards-system",
        permission: PERMISSIONS.rewards.view,
      },
      {
        title: "List Coupons",
        url: "/customers/coupons",
        permission: PERMISSIONS.promotions.view,
      },
    ],
  },
  {
    title: "Providers",
    url: "/providers",
    icon: <UsersIcon />,
    permission: PERMISSIONS.providers.view,
  },
  {
    title: "Procurements",
    url: "/purchases",
    icon: <ShoppingCartIcon />,
    permission: PERMISSIONS.purchases.view,
  },
  {
    title: "Accounting",
    url: "/accounting/transactions",
    icon: <WalletCardsIcon />,
    permission: PERMISSIONS.expenses.view,
    items: [
      {
        title: "Expenses",
        url: "/accounting/transactions",
        permission: PERMISSIONS.expenses.view,
      },
      {
        title: "Transaction History",
        url: "/accounting/transactions/history",
        permission: PERMISSIONS.transactionHistory.view,
      },
      {
        title: "Rules",
        url: "/accounting/rules",
        permission: PERMISSIONS.expenses.update,
      },
      {
        title: "Accounts",
        url: "/accounting/accounts",
        permission: PERMISSIONS.transactionAccounts.view,
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
    permission: [
      PERMISSIONS.reports.sales,
      PERMISSIONS.reports.products,
      PERMISSIONS.reports.customersStatement,
      PERMISSIONS.reports.lowStock,
      PERMISSIONS.reports.inventory,
      PERMISSIONS.reports.stockHistory,
      PERMISSIONS.reports.transactions,
      PERMISSIONS.reports.yearly,
      PERMISSIONS.reports.paymentTypes,
    ],
    permissionMatch: "any",
  },
  {
    title: "Settings",
    url: "/settings/general",
    icon: <IoSettingsOutline />,
    permission: [
      PERMISSIONS.settings.view,
      PERMISSIONS.branches.view,
      PERMISSIONS.products.view,
      PERMISSIONS.special.manageProfile,
      PERMISSIONS.users.view,
      PERMISSIONS.roles.view,
    ],
    permissionMatch: "any",
  },
]

const settingsNavSections: DashboardNavSection[] = [
  {
    title: "General",
    url: "/settings/general",
    icon: <LandmarkIcon />,
    permission: PERMISSIONS.settings.view,
  },
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
    title: "POS",
    url: "/settings/pos",
    icon: <SlidersHorizontalIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Customers",
    url: "/settings/customers",
    icon: <UsersIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Orders",
    url: "/settings/orders",
    icon: <ReceiptTextIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Accounting",
    url: "/settings/accounting",
    icon: <WalletCardsIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Taxes",
    url: "/settings/tax-groups",
    icon: <HiReceiptTax />,
    permission: [
      PERMISSIONS.taxes.view,
      PERMISSIONS.taxes.create,
    ],
    permissionMatch: "any",
    items: [
      {
        title: "Taxes Groups",
        url: "/settings/tax-groups",
        permission: PERMISSIONS.taxes.view,
      },
      {
        title: "Taxes",
        url: "/settings/taxes",
        permission: PERMISSIONS.taxes.view,
      },
    ],
  },
  {
    title: "Users",
    url: "/settings/users",
    icon: <UsersIcon />,
    permission: [
      PERMISSIONS.special.manageProfile,
      PERMISSIONS.users.view,
      PERMISSIONS.users.create,
    ],
    permissionMatch: "any",
    items: [
      {
        title: "My Profile",
        url: "/settings/users/profile",
        permission: PERMISSIONS.special.manageProfile,
      },
      {
        title: "Users List",
        url: "/settings/users",
        permission: PERMISSIONS.users.view,
      },
    ],
  },
  {
    title: "Roles",
    url: "/settings/roles",
    icon: <ShieldCheckIcon />,
    permission: [
      PERMISSIONS.roles.view,
      PERMISSIONS.roles.create,
      PERMISSIONS.roles.update,
    ],
    permissionMatch: "any",
    items: [
      {
        title: "Roles",
        url: "/settings/roles",
        permission: PERMISSIONS.roles.view,
      },
      {
        title: "Permissions Manager",
        url: "/settings/roles/permissions-manager",
        permission: PERMISSIONS.roles.update,
      },
    ],
  },
  {
    title: "Reports",
    url: "/settings/reports",
    icon: <FileBarChart2Icon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Invoices",
    url: "/settings/invoices",
    icon: <ImageIcon />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Workers",
    url: "/settings/workers",
    icon: <Server />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "Reset",
    url: "/settings/reset",
    icon: <AlertTriangle />,
    permission: PERMISSIONS.settings.view,
  },
  {
    title: "About",
    url: "/settings/about",
    icon: <Server />,
    permission: PERMISSIONS.settings.view,
  },
]
type AppSidebarProps = React.ComponentProps<typeof Sidebar>

function SidebarCollapseButton() {
  const { toggleSidebar, state } = useSidebar()
  const { t } = useTranslation()
  const isCollapsed = state === "collapsed"

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="flex h-8 w-full items-center gap-2 rounded-sm border border-sidebar-border bg-white px-2 text-sm font-semibold text-sidebar-foreground transition-colors group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-3 hover:text-sidebar-accent-foreground"
      title={t("Toggle Sidebar")}
    >
      {isCollapsed ? (
        <MdOutlineArrowCircleRight className="size-4 shrink-0" />
      ) : (
        <MdOutlineArrowCircleLeft className="size-4 shrink-0" />
      )}
      <span className="truncate group-data-[collapsible=icon]:hidden">
        {t("Collapse")}
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

    if (itemPath === "/sales") {
      return (
        pathname === "/sales" ||
        (pathname.startsWith("/sales/") &&
          pathname !== "/sales/create" &&
          !pathname.startsWith("/sales/payment-types"))
      )
    }

    if (itemPath === "/settings/users") {
      return pathname === "/settings/users"
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
                {t("Back to Home")}
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
