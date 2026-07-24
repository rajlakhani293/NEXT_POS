"use client"

import { UniFieldInput } from "@/components/ui/unifield-input"
import { SearchIcon } from "lucide-react"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form {...props}>
      <UniFieldInput
        id="search"
        aria-label="Search"
        placeholder="Type to search..."
        className="h-8 w-full bg-background shadow-none"
        prefix={<SearchIcon className="size-4 opacity-50" />}
        prefixClassName="pointer-events-none left-2 text-muted-foreground"
        prefixPadding="pl-7"
        data-slot="sidebar-input"
        data-sidebar="input"
      />
    </form>
  )
}

