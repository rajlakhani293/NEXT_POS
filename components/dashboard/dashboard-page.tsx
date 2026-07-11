"use client"

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type DashboardPagePadding = "default" | "none"

type DashboardLayoutContextValue = {
  padding: DashboardPagePadding
  setPadding: (padding: DashboardPagePadding) => void
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null)

export function DashboardLayoutProvider({ children }: { children: ReactNode }) {
  const [padding, setPadding] = useState<DashboardPagePadding>("default")
  const value = useMemo(() => ({ padding, setPadding }), [padding])

  return (
    <DashboardLayoutContext.Provider value={value}>
      {children}
    </DashboardLayoutContext.Provider>
  )
}

export function useDashboardPadding() {
  const context = useContext(DashboardLayoutContext)
  return context?.padding || "default"
}

export function DashboardPage({
  children,
  padding = "default",
}: {
  children: ReactNode
  padding?: DashboardPagePadding
}) {
  const context = useContext(DashboardLayoutContext)

  useLayoutEffect(() => {
    context?.setPadding(padding)
    return () => context?.setPadding("default")
  }, [context, padding])

  return <>{children}</>
}
