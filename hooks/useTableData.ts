import { useState, useEffect, useRef, useMemo } from "react"
import { useTableSorting } from "./useTableSorting"
import { getDateRange } from "@/lib/utils"
import { useDebounce } from "./useDebounce"

// Generate current financial year
const getCurrentFinancialYear = () => {
  const currentYear = new Date().getFullYear()
  const currentFY = currentYear % 100
  const nextFY = (currentFY + 1) % 100
  return `FY ${currentFY}-${nextFY.toString().padStart(2, "0")}`
}

interface UseTableDataProps {
  getMaster: any
  enabled?: boolean
  itemsPerPage?: number
  searchTerm?: string
  advancedFilters?: { status: string | number }
  dateFilters?: { startDate: any; endDate: any }
  selectedFilters?: Record<string, any>
  moduleId?: string | number
  entityId?: string | number
  tabList?: string[]
  extraOptions?: any
  statusMap?: Record<string, number> // Custom mapping from tab name to status value
  disableDateFilter?: boolean // Flag to disable date filtering
}

export const useTableData = ({
  getMaster,
  enabled = true,
  itemsPerPage: initialItemsPerPage = 10,
  searchTerm: initialSearchTerm,
  selectedFilters = {},
  advancedFilters: initialAdvancedFilters,
  dateFilters: initialDateFilters,
  tabList,
  statusMap,
  extraOptions,
  disableDateFilter = false,
}: UseTableDataProps) => {
  const defaultTab = useMemo(() => ["All", "Active", "Deactive"], [])

  const currentTabList = tabList && tabList.length > 0 ? tabList : defaultTab
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || "")
  const allLabel = "All"

  const [advancedFilters, setAdvancedFilters] = useState(
    initialAdvancedFilters || { status: allLabel }
  )
  const [dateFilters, setDateFilters] = useState(
    disableDateFilter
      ? { startDate: undefined, endDate: undefined }
      : initialDateFilters ||
          (() => {
            const currentFY = getCurrentFinancialYear()
            return getDateRange(currentFY)
          })()
  )
  const [activeTab, setActiveTab] = useState<string>(allLabel)
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(
    getCurrentFinancialYear()
  )
  const [periodType, setPeriodType] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [trigger, { data, isLoading, isFetching }] = getMaster()

  // Use the sorting hook internally
  const { sortConfig, handleSort } = useTableSorting("createdAt")

  const prevQueryRef = useRef<any>(null)
  const prevRefreshVersionRef = useRef(refreshVersion)

  // Debounce the search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  const selectedFiltersKey = useMemo(
    () => JSON.stringify(selectedFilters || {}),
    [selectedFilters]
  )
  const extraOptionsKey = useMemo(
    () => JSON.stringify(extraOptions || {}),
    [extraOptions]
  )

  const queryBody = useMemo(() => {
    const parsedSelectedFilters = JSON.parse(selectedFiltersKey || "{}")
    const parsedExtraOptions = JSON.parse(extraOptionsKey || "{}")

    return {
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm || undefined,
      status:
        advancedFilters?.status !== "All" && advancedFilters?.status !== allLabel
          ? advancedFilters?.status
          : undefined,
      ...(disableDateFilter
        ? {}
        : {
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
          }),
      sortBy: sortConfig?.key || undefined,
      sortDirection: sortConfig?.direction || undefined,
      filter: Object.keys(parsedSelectedFilters).length
        ? parsedSelectedFilters
        : undefined,
      ...(periodType === "CUSTOM" ? { periodType: "CUSTOM" } : {}),
      ...parsedExtraOptions,
    }
  }, [
    advancedFilters?.status,
    allLabel,
    currentPage,
    dateFilters.endDate,
    dateFilters.startDate,
    debouncedSearchTerm,
    disableDateFilter,
    extraOptionsKey,
    itemsPerPage,
    periodType,
    selectedFiltersKey,
    sortConfig?.direction,
    sortConfig?.key,
  ])

  const isQueryChanged = (prev: any, next: any): boolean =>
    JSON.stringify(prev) !== JSON.stringify(next)

  useEffect(() => {
    if (!enabled) return

    const isManualRefresh = prevRefreshVersionRef.current !== refreshVersion

    if (isManualRefresh || isQueryChanged(prevQueryRef.current, queryBody)) {
      prevQueryRef.current = queryBody
      prevRefreshVersionRef.current = refreshVersion
      trigger(queryBody)
    }
  }, [enabled, queryBody, trigger, refreshVersion])

  // Watch for changes to update Active Tab label visually
  useEffect(() => {
    if (
      advancedFilters.status === allLabel ||
      advancedFilters.status === "All"
    ) {
      setActiveTab(currentTabList[0])
    }
  }, [allLabel, currentTabList, advancedFilters.status])

  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm)
      setCurrentPage(1) // Reset to page 1 when search changes
    }
  }, [initialSearchTerm])

  const handleFilterChange = (action: string, payload?: any) => {
    switch (action) {
      case "statusFilter":
        if (typeof payload === "string") {
          setActiveTab(payload)
          let statusValue: string | number = allLabel

          if (payload !== allLabel) {
            // If statusMap is provided, use it for custom mapping
            if (statusMap && statusMap[payload] !== undefined) {
              statusValue = statusMap[payload]
            } else {
              // Otherwise, use default index-based calculation
              const index = currentTabList.indexOf(payload)
              if (index > 0) {
                statusValue = index - 1
              }
            }
          }
          setAdvancedFilters({
            status: statusValue, // Use the calculated statusValue
          })
          setCurrentPage(1)
        }
        break
      case "search":
        if (typeof payload === "string") {
          setSearchTerm(payload)
          setCurrentPage(1)
        }
        break
      case "dateRange":
        if (typeof payload === "string") {
          setSelectedDateRange(payload)
          const { startDate, endDate } = getDateRange(payload)
          setDateFilters({ startDate, endDate })
          setCurrentPage(1)
        }
        break
      case "customDate":
        let start = null
        let end = null
        if (payload) [start, end] = payload
        setDateFilters({ startDate: start, endDate: end })
        setCurrentPage(1)
        setPeriodType("CUSTOM")
        break
      case "itemsPerPage":
        if (typeof payload === "number") {
          setItemsPerPage(payload)
          setCurrentPage(1)
        }
        break
      default:
        break
    }
  }

  const responseData = (data as any)?.data

  const isArrayResponse = Array.isArray(responseData)

  const serverItems = isArrayResponse ? responseData : responseData?.items
  const allOrders = Array.isArray(serverItems) ? serverItems : []

  const orders = isArrayResponse
    ? allOrders.slice(
        (currentPage - 1) * itemsPerPage,
        (currentPage - 1) * itemsPerPage + itemsPerPage
      )
    : allOrders

  const otherData = responseData || []
  const totalItems = isArrayResponse
    ? allOrders.length
    : responseData?.items?.count ||
      responseData?.total ||
      responseData?.count ||
      0
  const totalPages = isArrayResponse
    ? Math.ceil(allOrders.length / itemsPerPage)
    : responseData?.totalPages || 0
  const sortableFields = responseData?.appliedFilters?.sortableFields || []

  return {
    orders,
    otherData,
    totalItems,
    totalPages,
    isLoading: isLoading || isFetching,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    sortableFields,
    handleFilterChange,
    activeTab,
    searchTerm,
    selectedDateRange,
    dateFilters,
    itemsPerPage,
    triggerRefresh: () => setRefreshVersion((version) => version + 1),
  }
}
