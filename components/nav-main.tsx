"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {
  const { state, isMobile } = useSidebar()
  const activeMenuTitle = useMemo(
    () => items.find((item) => item.isActive)?.title,
    [items],
  )
  const [openMenuTitle, setOpenMenuTitle] = useState<string | undefined>(
    activeMenuTitle,
  )
  const [activeFloatingTitle, setActiveFloatingTitle] = useState<
    string | undefined
  >()

  useEffect(() => {
    if (activeMenuTitle) {
      setOpenMenuTitle(activeMenuTitle)
    }
  }, [activeMenuTitle])

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubmenu = Boolean(item.items?.length)
          const isOpen = hasSubmenu && openMenuTitle === item.title
          const isCollapsedDesktop = state === "collapsed" && !isMobile
          const showSubmenuFlyout =
            hasSubmenu && isCollapsedDesktop
          const showSingleTooltip = !hasSubmenu && isCollapsedDesktop
          const menuButton = showSubmenuFlyout ? (
            <SidebarMenuButton
              tooltip={undefined}
              isActive={item.isActive}
              className="data-[active=true]:bg-gray-200/60 hover:bg-gray-200/60"
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              asChild
              tooltip={undefined}
              isActive={item.isActive}
              className="data-[active=true]:bg-gray-200/60 hover:bg-gray-200/60"
            >
              <Link
                href={item.items?.[0]?.url || item.url}
                onClick={() =>
                  setOpenMenuTitle(hasSubmenu ? item.title : undefined)
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          )

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) =>
                setOpenMenuTitle(open ? item.title : undefined)
              }
            >
              <SidebarMenuItem>
                {showSubmenuFlyout ? (
                  <HoverCard
                    open={activeFloatingTitle === item.title}
                    openDelay={0}
                    closeDelay={220}
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveFloatingTitle(item.title)
                        return
                      }

                      setActiveFloatingTitle((currentTitle) =>
                        currentTitle === item.title ? undefined : currentTitle,
                      )
                    }}
                  >
                    <HoverCardTrigger asChild>
                      {menuButton}
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={6}
                      className="relative w-44 overflow-visible rounded-lg border-sidebar-border bg-white p-1.5 text-sidebar-foreground shadow-lg before:absolute before:top-0 before:right-full before:h-full before:w-3 before:content-['']"
                    >
                      <div className="px-2 py-1 text-xs font-extrabold text-sidebar-foreground/70">
                        {item.title}
                      </div>
                      <div className="-mx-1 my-1 h-px bg-border" />
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.title}
                          className={[
                            "flex h-8 items-center rounded-sm px-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-gray-200/60",
                            subItem.isActive
                              ? "font-black text-sidebar-foreground"
                              : "font-semibold text-sidebar-foreground/75",
                          ].join(" ")}
                          href={subItem.url}
                          onClick={() => setOpenMenuTitle(item.title)}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </HoverCardContent>
                  </HoverCard>
                ) : showSingleTooltip ? (
                  <HoverCard
                    open={activeFloatingTitle === item.title}
                    openDelay={80}
                    closeDelay={120}
                    onOpenChange={(open) => {
                      if (open) {
                        setActiveFloatingTitle(item.title)
                        return
                      }

                      setActiveFloatingTitle((currentTitle) =>
                        currentTitle === item.title ? undefined : currentTitle,
                      )
                    }}
                  >
                    <HoverCardTrigger asChild>
                      {menuButton}
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="center"
                      sideOffset={10}
                      className="relative w-auto rounded-md border-0 bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-md before:absolute before:left-0 before:top-1/2 before:size-2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:rounded-[1px] before:bg-foreground before:content-['']"
                    >
                      {item.title}
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  menuButton
                )}
                {hasSubmenu ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="transition-transform duration-200 ease-out data-[state=open]:rotate-90">
                        <ChevronRightIcon />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="sidebar-submenu-collapsible">
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.isActive}
                            >
                              <Link
                                href={subItem.url}
                                onClick={() => setOpenMenuTitle(item.title)}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
