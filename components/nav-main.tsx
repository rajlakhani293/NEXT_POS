"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  const activeMenuTitle = useMemo(
    () => items.find((item) => item.isActive)?.title,
    [items],
  )
  const [openMenuTitle, setOpenMenuTitle] = useState<string | undefined>(
    activeMenuTitle,
  )

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
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={item.isActive}
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
