import { useState } from "react";

interface SortConfig {
  key: string;
  direction: "ascending" | "descending";
}

export const useTableSorting = (defaultKey: string = "", defaultDirection: "ascending" | "descending" = "ascending") => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: defaultKey,
    direction: defaultDirection,
  });

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return { sortConfig, handleSort };
};
