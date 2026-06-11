"use client"

import { useState, useEffect, useRef } from "react"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/toast"
import TableFooter from "./TableFooter"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { UniFieldInput } from "./ui/unifield-input"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { DateRangePicker } from "./date-picker"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Edit,
  Plus,
  Search,
} from "lucide-react"
import { IoIosCloseCircleOutline } from "react-icons/io"
import { LuArrowUpDown } from "react-icons/lu"
import { FiMoreVertical } from "react-icons/fi"
import { HiOutlineCalendar } from "react-icons/hi"
import { MdDelete } from "react-icons/md"

const MAX_ICONS_TO_SHOW = 3
const MAX_CHARS_PER_LINE = 35

// Generate dynamic financial years
const generateFinancialYears = (count = 5) => {
  const currentYear = new Date().getFullYear()
  const currentFY = currentYear % 100 // Get last 2 digits
  const years = []

  for (let i = 0; i < count; i++) {
    const fyStart = (currentFY - i) % 100
    const fyEnd = (fyStart + 1) % 100
    years.push(`FY ${fyStart}-${fyEnd.toString().padStart(2, "0")}`)
  }

  return years
}

const dateRanges = [
  "Today",
  "Yesterday",
  "This Week",
  "Last Week",
  "This Month",
  "Last Month",
  "This Year",
  "Last Year",
  "Last 30 Days",
  "Last Quarter",
  ...generateFinancialYears(5), // Generate last 5 financial years
]

const TableCellContent = ({ value }: { value: any }) => {
  let text: string | null = null

  if (typeof value === "string") {
    text = value
  } else if (typeof value === "number" || typeof value === "boolean") {
    text = String(value)
  }

  if (text === null) {
    return <>{value}</>
  }

  const trimmed = text.trim()

  if (trimmed.length <= MAX_CHARS_PER_LINE) {
    return (
      <span className="block max-w-[35ch] wrap-break-word whitespace-normal">
        {trimmed}
      </span>
    )
  }

  const hasSpace = /\s/.test(trimmed)

  if (hasSpace) {
    return (
      <span className="block max-w-[35ch] wrap-break-word whitespace-normal">
        {trimmed}
      </span>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block max-w-[35ch] cursor-default truncate whitespace-nowrap">
            {trimmed}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{trimmed}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface Column {
  key: string
  title: React.ReactNode
  subtitle?: string
  render?: (value: any, record: any, index: number) => React.ReactNode
}

interface Action {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  labelText?: string
  priority?: number
  render?: (value: any, record: any, index: number) => React.ReactNode
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
}

export interface FooterSummaryItem {
  label: string
  value: string | number
  prefix?: string
  className?: string
  tooltip?: React.ReactNode
}

interface DynamicTableProps {
  data: any[]
  columns: Column[]
  selectedRows?: string[]
  onRowSelect?: (id: string | number) => void
  sortConfig?: { key: string; direction: string }
  onSort?: (key: string) => void
  rowActions?: (id: string, record: any) => Action[]
  isRowDisabled?: (row: any) => boolean
  onFilterChange?: (action: string, payload?: any) => void
  currentPage?: number
  itemsPerPage?: number
  totalItems?: number
  onPageChange?: (page: number, pageSize?: number) => void
  showStatus?: boolean
  statusChangeMutation?: (args: {
    ids: (string | number)[]
    status: number
    module_id?: string
    entity_id?: string
  }) => Promise<any>
  showDelete?: boolean
  canDeleteRow?: (row: any) => boolean
  showEdit?: boolean
  deleteMutation?: (args: {
    ids: (string | number)[]
    module_id?: string
    entity_id?: string
  }) => Promise<any>
  onEdit?: (record: any) => void
  triggerRefresh?: () => void
  sortableFields?: string[]
  deleteModalTitle?: string
  deleteModalDescription?: string
  onRowClick?: (row: any) => void
  footerSummary?: FooterSummaryItem[]
  hideActions?: boolean
  isLoading?: boolean

  tableTitle?: string
  title?: string
  searchTerm?: string
  showSearch?: boolean
  showDateRange?: boolean
  selectedDateRange?: string | null | any
  dateFilters?: { startDate: Date | null; endDate: Date | null }
  setAddEntityOpen?: (open: boolean) => void
  secondaryActionButton?: React.ReactNode
}

const DynamicTable = ({
  data,
  columns,
  selectedRows = [],
  onRowSelect = () => { },
  sortConfig = { key: "", direction: "ascending" },
  onSort = () => { },
  rowActions,
  isRowDisabled,
  currentPage = 1,
  itemsPerPage = 10,
  totalItems = 0,
  onFilterChange = () => { },
  onPageChange = () => { },
  showStatus = false,
  statusChangeMutation,
  showDelete = false,
  canDeleteRow,
  showEdit = true,
  deleteMutation,
  onEdit,
  triggerRefresh,
  sortableFields = [],
  deleteModalTitle,
  deleteModalDescription,
  onRowClick,
  footerSummary,
  hideActions = false,
  isLoading = false,

  // Integrated props
  tableTitle,
  title,
  searchTerm,
  showSearch = false,
  showDateRange = false,
  selectedDateRange,
  dateFilters,
  setAddEntityOpen,
  secondaryActionButton,
}: DynamicTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null)
  const paginationSentinelRef = useRef<HTMLDivElement | null>(null)
  const [isFooterStuck, setIsFooterStuck] = useState(false)
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] =
    useState<boolean>(false)
  const hasRowActions =
    !hideActions && (showEdit || showDelete || Boolean(rowActions))

  // Handle single item deletion
  const handleDeleteConfirm = async () => {
    if (itemToDelete && showDelete && deleteMutation) {
      try {
        const result = await deleteMutation({
          ids: [itemToDelete],
        })

        if ("data" in result && result.data.success === true) {
          showToast.success(result?.message || "Deleted Successfully")
          triggerRefresh?.()
        } else if ("error" in result) {
          const error = result.error as any
          showToast.error(
            `Delete Failed: ${error.data?.message || error.message}`
          )
        }
      } catch (error) {
        const err = error as any
        showToast.error(
          `Delete Failed: ${err.data?.message || "Network Error"}`
        )
      } finally {
        setDeleteModalOpen(false)
        setItemToDelete(null)
      }
    }
  }

  useEffect(() => {
    const sentinel = paginationSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterStuck(!entry.isIntersecting),
      {
        threshold: 0.01,
        // rootMargin: "0px 0px -85 0px"
      }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const onChange = async (action: string, payload?: any): Promise<boolean> => {
    switch (action) {
      case "selectRow":
        if (payload) {
          onRowSelect(payload)
        }
        return false
      case "sort":
        if (payload && typeof payload === "string") {
          onSort(payload)
        }
        return false
      case "statusChange":
        if (
          showStatus &&
          statusChangeMutation &&
          payload?.id !== undefined &&
          typeof payload.status === "number"
        ) {
          try {
            const newStatus = payload.status === 0 ? 1 : 0
            const result = await statusChangeMutation({
              ids: [payload.id],
              status: newStatus,
            })

            if ("data" in result && result.data.success === true) {
              showToast.success(result?.message || "Status Updated")
              triggerRefresh?.()
              return true
            }
          } catch (error) {
            const err = error as any
            showToast.error(
              `Status Update Failed: ${err.status} - ${err.data?.message || err.message
              }`
            )
          }
        }
        return false
      case "delete":
        if (showDelete && payload) {
          setItemToDelete(payload)
          setDeleteModalOpen(true)
        }
        return false
      case "search":
      case "dateRange":
      case "customDate":
      case "toggleAdvancedFilter":
      case "itemsPerPage":
        onFilterChange(action, payload)
        return false
      default:
        return false
    }
  }

  const getRowActions = (id: string): Action[] => {
    const defaultActions: Action[] = []
    const currentItem = data?.find((item) => String(item.id) === String(id))

    // Add Edit action if showEdit is true
    if (showEdit) {
      defaultActions.push({
        key: "edit",
        label: "Edit",
        labelText: "Edit",
        icon: <Edit className="size-4" />,
        onClick: (e) => {
          e?.stopPropagation()
          if (onEdit) {
            onEdit(currentItem)
          }
        },
        priority: 1,
      })
    }

    if (showDelete && (!canDeleteRow || canDeleteRow(currentItem))) {
      defaultActions.push({
        key: "delete",
        label: "Delete",
        labelText: "Delete",
        icon: <MdDelete className="size-5 text-red-500" />,
        onClick: (e) => {
          e?.stopPropagation()
          setItemToDelete(id)
          setDeleteModalOpen(true)
        },
        priority: 2,
      })
    }

    const customActions = rowActions ? rowActions(id, currentItem) : []
    const allActions = [...defaultActions]

    customActions.forEach((customAction) => {
      if (!allActions.some((action) => action.key === customAction.key)) {
        allActions.push(customAction)
      }
    })

    return allActions.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  const translateSelectedDateRange = (range: string | null): string => {
    if (!range) {
      // Return current financial year as default
      const currentYear = new Date().getFullYear()
      const currentFY = currentYear % 100
      const nextFY = (currentFY + 1) % 100
      return `FY ${currentFY}-${nextFY.toString().padStart(2, "0")}`
    }
    return range
  }

  return (
    <>
      <div className="w-full space-y-4">
        <div className="mb-4 w-full space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {tableTitle && (
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {tableTitle}
                </h2>
              )}

              {totalItems > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {totalItems}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {showSearch && (
                <div className="relative w-full sm:max-w-xs">
                  <UniFieldInput
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => onChange("search", e.target.value)}
                    className="h-9 w-full pr-9 pl-9"
                    prefix={<Search className="h-4 w-4" />}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => onChange("search", "")}
                      className="absolute top-2.5 right-2.5 h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <IoIosCloseCircleOutline className="size-4 cursor-pointer" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {showDateRange && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDateRangeModalOpen(true)}
                      className="h-9 w-full justify-between gap-2 sm:w-auto"
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {translateSelectedDateRange(selectedDateRange)}
                        </span>
                      </div>
                      {selectedDateRange !==
                        translateSelectedDateRange(null) ? (
                        <div
                          className="flex h-4 w-4 cursor-pointer items-center justify-center bg-white text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onChange(
                              "dateRange",
                              translateSelectedDateRange(null)
                            )
                          }}
                        >
                          <IoIosCloseCircleOutline className="size-5 cursor-pointer hover:text-red-500" />
                        </div>
                      ) : (
                        <ChevronDownIcon className="size-5 cursor-pointer" />
                      )}
                    </Button>

                    <Dialog
                      open={isDateRangeModalOpen}
                      onOpenChange={setIsDateRangeModalOpen}
                    >
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Select Date Range</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                          <div className="space-y-2">
                            <h4 className="text-sm leading-none font-medium">
                              Quick Select
                            </h4>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {dateRanges.slice(0, 8).map((range) => (
                                <Button
                                  key={range}
                                  variant={
                                    selectedDateRange === range
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    onChange("dateRange", range)
                                    setIsDateRangeModalOpen(false)
                                  }}
                                  className="w-full text-xs"
                                >
                                  {range}
                                </Button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {dateRanges.slice(8, 10).map((range) => (
                                <Button
                                  key={range}
                                  variant={
                                    selectedDateRange === range
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    onChange("dateRange", range)
                                    setIsDateRangeModalOpen(false)
                                  }}
                                  className="w-full text-xs"
                                >
                                  {range}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm leading-none font-medium">
                              Financial Year
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {dateRanges.slice(10).map((range) => (
                                <Button
                                  key={range}
                                  variant={
                                    selectedDateRange === range
                                      ? "secondary"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    onChange("dateRange", range)
                                    setIsDateRangeModalOpen(false)
                                  }}
                                  className={cn(
                                    "text-xs",
                                    selectedDateRange === range &&
                                    "bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                                  )}
                                >
                                  {range}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4 border-t pt-4">
                            <Button
                              variant={
                                selectedDateRange === "Custom"
                                  ? "default"
                                  : "ghost"
                              }
                              className="dashed w-full justify-start border border-dashed"
                              onClick={() => onChange("dateRange", "Custom")}
                            >
                              {selectedDateRange === "Custom" ? "✓ " : "+ "}{" "}
                              Custom Range
                            </Button>

                            {selectedDateRange === "Custom" && (
                              <div className="rounded-lg bg-muted/50 p-4">
                                <DateRangePicker
                                  value={{
                                    from: dateFilters?.startDate
                                      ? new Date(dateFilters.startDate)
                                      : undefined,
                                    to: dateFilters?.endDate
                                      ? new Date(dateFilters.endDate)
                                      : undefined,
                                  }}
                                  onChange={(range) => {
                                    const start = range?.from
                                      ? dayjs(range.from)
                                        .startOf("day")
                                        .toDate()
                                      : null
                                    const end = range?.to
                                      ? dayjs(range.to).endOf("day").toDate()
                                      : null
                                    onChange("customDate", [start, end])
                                  }}
                                  placeholder="Select date range"
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                <div className="flex items-center gap-2">
                  {title && setAddEntityOpen && (
                    <Button
                      size="sm"
                      onClick={() => setAddEntityOpen?.(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {title}
                    </Button>
                  )}
                  {secondaryActionButton}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-gray-200">
          <div
            className={`${data?.length > 0 ? "no-scrollbar max-h-[calc(100vh-300px)] overflow-y-auto" : "no-scrollbar h-[calc(100vh-300px)]"}`}
          >
            <table
              className={cn(
                "w-full caption-bottom text-sm",
                data?.length === 0 && "h-full"
              )}
            >
              <thead className="sticky top-0 z-10 rounded-t-3xl bg-muted/90 font-semibold text-gray-700 backdrop-blur-sm">
                <tr className="border-b hover:bg-muted/90">
                  <th className="h-10 w-16 px-2 text-center align-middle whitespace-nowrap">
                    <div className="flex flex-col py-2">
                      <span className="font-semibold">Sr No</span>
                    </div>
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={
                        sortableFields.includes(col.key)
                          ? () => onChange("sort", col.key)
                          : undefined
                      }
                      className={cn(
                        "h-10 px-2 text-left align-middle whitespace-nowrap transition-colors",
                        sortableFields.includes(col.key)
                          ? "cursor-pointer text-foreground hover:bg-muted/50"
                          : "cursor-default"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          col.key === "sr_no" && "justify-center"
                        )}
                      >
                        <div className="flex flex-col py-2">
                          <span
                            className={cn(
                              "font-semibold text-gray-700",
                              sortConfig.key === col.key && "text-primary"
                            )}
                          >
                            {col.title}
                          </span>
                          {col.subtitle && (
                            <span className="text-[10px] leading-3 normal-case">
                              {col.subtitle}
                            </span>
                          )}
                        </div>
                        {sortableFields.includes(col.key) &&
                          (sortConfig.key === col.key ? (
                            sortConfig.direction === "ascending" ? (
                              <ChevronUpIcon className="size-3" />
                            ) : (
                              <ChevronDownIcon className="size-3" />
                            )
                          ) : (
                            <LuArrowUpDown className="size-3" />
                          ))}
                      </div>
                    </th>
                  ))}
                  {hasRowActions && (
                    <th className="h-10 px-4 text-right align-middle whitespace-nowrap">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody
                className={cn(
                  "bg-white font-semibold text-gray-900 [&_tr:last-child]:border-0",
                  data?.length === 0 && "h-full"
                )}
              >
                {isLoading ? (
                  <tr key="loading">
                    <td
                      colSpan={columns.length + (hasRowActions ? 1 : 0) + 1}
                      className="h-24 p-2 text-center align-middle"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                        <span className="text-muted-foreground">
                          Loading...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : data?.length > 0 ? (
                  data.map((row, index) => {
                    const isDisabledRow = isRowDisabled
                      ? isRowDisabled(row)
                      : false
                    const allActions = getRowActions(row.id)
                    const visibleActions = allActions.slice(
                      0,
                      MAX_ICONS_TO_SHOW
                    )
                    const dropdownActions = allActions.slice(MAX_ICONS_TO_SHOW)

                    return (
                      <tr
                        key={row.id || `row-${index}`}
                        onClick={() => onRowClick?.(row)}
                        data-state={
                          selectedRows.includes(String(row.id))
                            ? "selected"
                            : undefined
                        }
                        className={cn(
                          "group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                          isDisabledRow && "cursor-not-allowed opacity-60",
                          onRowClick && "cursor-pointer"
                        )}
                      >
                        <td
                          className={`p-2 py-3 text-center align-middle whitespace-nowrap`}
                        >
                          <TableCellContent
                            value={(currentPage - 1) * itemsPerPage + index + 1}
                          />
                        </td>
                        {columns.map((col) => {
                          const rawValue = col.render
                            ? col.render(
                              row[col.key],
                              {
                                row,
                                onChange: (action: string, payload?: any) =>
                                  onChange(action, {
                                    ...payload,
                                    id: row.id,
                                  }),
                              },
                              index
                            )
                            : (row[col.key] ?? (
                              <span className="text-muted-foreground">-</span>
                            ))

                          return (
                            <td
                              key={`${col.key}-${row.id || index}`}
                              className={cn(
                                "p-2 py-3 align-middle whitespace-nowrap",
                                isDisabledRow && "text-muted-foreground"
                              )}
                            >
                              <TableCellContent value={rawValue} />
                            </td>
                          )
                        })}
                        {hasRowActions && (
                          <td className="p-2 px-4 py-3 align-middle whitespace-nowrap">
                            <div className="relative flex items-center justify-end gap-2">
                              {visibleActions.map(
                                ({ key, icon, labelText, onClick, render }) =>
                                  render ? (
                                    <div key={key}>
                                      {render(
                                        labelText,
                                        { row, onChange, onClick },
                                        index
                                      )}
                                    </div>
                                  ) : (
                                    <TooltipProvider key={key}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 border cursor-pointer"
                                            disabled={isDisabledRow}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              onClick?.()
                                            }}
                                          >
                                            {icon}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {labelText}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )
                              )}

                              {dropdownActions.length > 0 && !isDisabledRow && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 border"
                                    >
                                      <FiMoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {dropdownActions.map(
                                      ({ key, label, icon, onClick }) => (
                                        <DropdownMenuItem
                                          key={key}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onClick?.()
                                          }}
                                        >
                                          <div className="flex items-center gap-2 cursor-pointer">
                                            {icon}
                                            <span className="text-sm font-medium">{label}</span>
                                          </div>
                                        </DropdownMenuItem>
                                      )
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                ) : (
                  <tr key="no-data" className="h-full">
                    <td
                      colSpan={columns.length + (hasRowActions ? 1 : 0) + 1}
                      className="h-full p-2 text-center align-middle"
                    >
                      No Data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div ref={paginationSentinelRef} className="h-px w-full" aria-hidden />

        <TableFooter
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onChange={onChange}
          footerSummary={footerSummary}
          isFooterStuck={isFooterStuck}
          totalPages={totalPages}
          getPageNumbers={getPageNumbers}
        />
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteModalTitle || "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {deleteModalDescription ||
                "Are you sure you want to delete this item? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DynamicTable
