"use client"

import { useEffect, useState } from "react"
import { BellIcon, CheckCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { notifications } from "@/lib/api/notifications"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

export function HeaderNotifications() {
  const [items, setItems] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [getNotificationsData, notificationsState] = (
    notifications as any
  ).useGetNotificationsDataMutation()
  const [getUnreadCount] = (notifications as any).useGetUnreadCountMutation()
  const [markNotificationsRead, markState] = (
    notifications as any
  ).useMarkNotificationsReadMutation()

  const refresh = async () => {
    try {
      const [listResponse, countResponse] = await Promise.all([
        getNotificationsData({ page: 1, limit: 6 }).unwrap(),
        getUnreadCount().unwrap(),
      ])
      setItems(listResponse?.data?.items || [])
      setUnreadCount(countResponse?.data?.count || 0)
    } catch {
      setItems([])
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const markRead = async (ids: number[]) => {
    if (!ids.length) return
    try {
      const response = await markNotificationsRead({ payLoad: { ids } }).unwrap()
      showToast.success(response?.message || "Notification marked as read.")
      await refresh()
    } catch {
      showToast.error("Unable to update notifications.")
    }
  }

  const unreadIds = items
    .filter((item) => !item.is_read)
    .map((item) => Number(item.id))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-md"
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 ? (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-96 p-0">
        <PopoverHeader className="border-b p-3">
          <div className="flex items-center justify-between gap-3">
            <PopoverTitle>Notifications</PopoverTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!unreadIds.length || markState.isLoading}
              onClick={() => markRead(unreadIds)}
            >
              {markState.isLoading ? (
                <Spinner />
              ) : (
                <CheckCheckIcon className="size-4" />
              )}
              Mark all
            </Button>
          </div>
        </PopoverHeader>
        <div className="max-h-96 overflow-y-auto p-2">
          {notificationsState.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm font-medium text-muted-foreground">
              <Spinner />
              Loading notifications...
            </div>
          ) : items.length ? (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md p-3 text-left transition hover:bg-muted",
                    !item.is_read && "bg-blue-50"
                  )}
                  onClick={() => markRead([Number(item.id)])}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs font-medium text-muted-foreground">
                        {item.message || item.source_type}
                      </p>
                    </div>
                    {!item.is_read ? (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-600" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-medium text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
