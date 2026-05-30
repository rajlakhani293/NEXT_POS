"use client";

import { cn } from "@/lib/utils";
import { FooterSummaryItem } from "./DynamicTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { UniFieldSelect } from "./ui/unifield-select";
import { SelectItem } from "./ui/select";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

interface TableFooterProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number, pageSize?: number) => void;
  onChange: (action: string, payload?: any) => void;
  footerSummary?: FooterSummaryItem[];
  isFooterStuck: boolean;
  totalPages: number;
  getPageNumbers: () => (number | string)[];
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
  return (
    <>
      {/* Footer / Pagination */}
      {totalItems > 10 && (
        <div
          className={cn("sticky z-50 transition-all duration-300 ease-in-out rounded-xl", isFooterStuck ? "mx-6 bottom-5" : "mx-0 bottom-0")}
        >
          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-lg bg-white border",
            isFooterStuck && "border-primary/20"
          )}>

            <div className="flex flex-wrap items-center gap-3">
              {footerSummary?.map((item, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50 text-sm font-medium",
                        item.className
                      )}>
                        <span className="text-muted-foreground text-xs">{item.label}</span>
                        <span className="flex items-center gap-1">
                          {item.prefix} {item.value}
                          {item.tooltip && <Info className="h-3.5 w-3.5 text-muted-foreground" />}
                        </span>
                      </div>
                    </TooltipTrigger>
                    {item.tooltip && <TooltipContent>{item.tooltip}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <UniFieldSelect
                value={String(itemsPerPage)}
                onValueChange={(val) => onChange("itemsPerPage", Number(val))}
                placeholder="Rows per page"
                containerClassName="w-[130px]"
                size="sm"
              >
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </UniFieldSelect>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((page, i) => (
                  page === '...' ? (
                    <span key={i} className="px-2 text-muted-foreground">...</span>
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
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableFooter;
