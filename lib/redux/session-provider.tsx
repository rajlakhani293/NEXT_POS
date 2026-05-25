"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import Cookies from "js-cookie"
import { usePathname, useRouter } from "next/navigation"

import { useAppDispatch } from "@/lib/redux/hooks"
import { clearSessionData, setSessionData } from "@/lib/redux/sessionSlice"
import { auth } from "../api/auth"

interface SessionContextType {
  isLoading: boolean
  refreshSession: () => Promise<void>
  clearSession: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const publicRoutes = ["/login"]

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [getSessionData] = auth.useGetSessionDataMutation()

  const clearSession = () => {
    dispatch(clearSessionData())
    Cookies.remove("token", { path: "/" })

    if (!publicRoutes.some((route) => pathname.startsWith(route))) {
      router.replace("/login")
    }
  }

  const refreshSession = async () => {
    const token = Cookies.get("token")

    if (!token) {
      dispatch(clearSessionData())
      if (!publicRoutes.some((route) => pathname.startsWith(route))) {
        router.replace("/login")
      }
      return
    }

    setIsLoading(true)

    try {
      const response = await getSessionData().unwrap()
      dispatch(setSessionData({ user: response.data }))

      if (pathname === "/login") {
        router.replace("/dashboard")
      }
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshSession()
  }, [pathname])

  const value = useMemo(
    () => ({
      isLoading,
      refreshSession,
      clearSession,
    }),
    [isLoading],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
