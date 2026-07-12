"use client"

import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  BadgeCheckIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
} from "lucide-react"
import { useTranslation } from "@/lib/contexts/TranslationContext"

function getInitials(name?: string) {
  if (!name) return "SA"

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export function NavUser({
  user,
  onLogout,
  dropdownSide,
  dropdownAlign,
  iconOnly = false,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  onLogout?: () => void
  dropdownSide?: "top" | "right" | "bottom" | "left"
  dropdownAlign?: "start" | "center" | "end"
  iconOnly?: boolean
}) {
  const { isMobile } = useSidebar()
  const { t } = useTranslation()

  const resolvedSide = dropdownSide ?? (isMobile ? "bottom" : "right")
  const resolvedAlign = dropdownAlign ?? "end"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={
                iconOnly
                  ? "h-9 w-9 justify-center rounded-md p-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  : "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              }
            >
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback
                  className={iconOnly ? "rounded-md" : "rounded-md"}
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {!iconOnly ? (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </>
              ) : null}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={resolvedSide}
            align={resolvedAlign}
            sideOffset={14}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings/users/profile">
                  <BadgeCheckIcon />
                  {t("My Profile")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOutIcon />
              {t("Logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
