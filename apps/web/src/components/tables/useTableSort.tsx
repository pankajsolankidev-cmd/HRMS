import { useState } from "react";

export type SortOrder = "asc" | "desc";

export function useTableSort<T>() {
  const [sortBy, setSortBy] = useState<keyof T | undefined>();
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>();

  const handleSort = (field: keyof T) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("asc");
      return;
    }

    if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortBy(undefined);
      setSortOrder(undefined);
    } else {
      setSortOrder("asc");
    }
  };

  return {
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    handleSort,
  };
}
