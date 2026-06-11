"use client"

import React, {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
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
  const pathnameRef = useRef(pathname)
  const bootstrapStartedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const clearSession = useCallback(() => {
    dispatch(clearSessionData())
    dispatch(auth.util.resetApiState())
    Cookies.remove("token", { path: "/" })

    if (
      !publicRoutes.some((route) => pathnameRef.current.startsWith(route))
    ) {
      router.replace("/login")
    }
  }, [dispatch, router])

  const refreshSession = useCallback(async () => {
    const token = Cookies.get("token")

    if (!token) {
      dispatch(clearSessionData())
      if (
        !publicRoutes.some((route) => pathnameRef.current.startsWith(route))
      ) {
        router.replace("/login")
      }
      return
    }

    setIsLoading(true)

    try {
      const request = dispatch(
        auth.endpoints.getSessionData.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        })
      )
      const response = await request.unwrap()
      dispatch(setSessionData(response.data))

      if (pathnameRef.current === "/login") {
        router.replace("/dashboard")
      }
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }, [clearSession, dispatch, router])

  useEffect(() => {
    if (bootstrapStartedRef.current) return
    bootstrapStartedRef.current = true
    void refreshSession()
  }, [refreshSession])

  const value = useMemo(
    () => ({
      isLoading,
      refreshSession,
      clearSession,
    }),
    [clearSession, isLoading, refreshSession]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
