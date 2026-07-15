"use client"

import { cn } from "@/lib/utils"
import { FooterSummaryItem } from "./DynamicTable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { UniFieldSelect } from "./ui/unifield-select"
import { SelectItem } from "./ui/select"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"

import { useTranslation } from "@/lib/contexts/TranslationContext"

interface TableFooterProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number, pageSize?: number) => void
  onChange: (action: string, payload?: any) => void
  footerSummary?: FooterSummaryItem[]
  isFooterStuck: boolean
  totalPages: number
  getPageNumbers: () => (number | string)[]
}

const TableFooter = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onChange,
  footerSummary,
  isFooterStuck,
  totalPages,
  getPageNumbers,
}: TableFooterProps) => {
  const { t, language } = useTranslation()

  return (
    <>
      {/* Footer / Pagination */}
      {totalItems > 10 && (
        <div
          className={cn(
            "sticky z-50 rounded-xl transition-all duration-300 ease-in-out",
            isFooterStuck ? "bottom-5 mx-6" : "bottom-0 mx-0"
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center justify-between gap-4 rounded-lg border bg-white p-3 sm:flex-row",
              isFooterStuck && "border-primary/20"
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              {footerSummary?.map((item, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm font-medium",
                          item.className
                        )}
                      >
                        <span className="text-xs text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="flex items-center gap-1">
                          {item.prefix} {item.value}
                          {item.tooltip && (
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </span>
                      </div>
                    </TooltipTrigger>
                    {item.tooltip && (
                      <TooltipContent>{item.tooltip}</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-4">
              <UniFieldSelect
                key={language}
                value={String(itemsPerPage)}
                onValueChange={(val) => onChange("itemsPerPage", Number(val))}
                placeholder={t("Rows per page")}
                containerClassName="w-[135px]"
                size="sm"
              >
                <SelectItem value="20">{t("20 / page")}</SelectItem>
                <SelectItem value="50">{t("50 / page")}</SelectItem>
                <SelectItem value="100">{t("100 / page")}</SelectItem>
              </UniFieldSelect>

              <div className="flex items-center gap-1">
                <span className={cn(currentPage === 1 && "cursor-not-allowed")}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </span>

                {getPageNumbers().map((page, i) =>
                  page === "..." ? (
                    <span key={i} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={i}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className="h-9 w-9"
                      onClick={() => onPageChange(Number(page))}
                    >
                      {page}
                    </Button>
                  )
                )}

                <span className={cn(currentPage === totalPages && "cursor-not-allowed")}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TableFooter
