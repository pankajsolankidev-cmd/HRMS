import { IconChevronDown } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

export type Column<T> = {
  header: string;
  accessor?: keyof T;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  cell: (row: T) => React.ReactNode;
};

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];

  isLoading?: boolean;
  isError?: boolean;

  sortBy?: keyof T;
  sortOrder?: "asc" | "desc";
  onSort?: (field: keyof T) => void;

  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  sortBy,
  sortOrder,
  onSort,
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  onLimitChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        Failed to load data
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {onLimitChange && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex items-center gap-3">
            <span className="text-lg  text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Show
            </span>

            <div className="relative">
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className={`
            appearance-none
            h-10 min-w-[70px] rounded-lg border border-gray-300 bg-white 
            px-4 pr-10 text-sm font-medium outline-none transition-all
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
            dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200
            cursor-pointer
          `}
              >
                {[5, 10, 50, 100].map((v) => (
                  <option key={v} value={v} className="dark:bg-gray-900">
                    {v}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <IconChevronDown
                  size={18}
                  className="pointer-events-none text-gray-400 dark:text-gray-500"
                />
              </div>
            </div>
            <span className="text-lg  text-gray-700 dark:text-gray-300 whitespace-nowrap">
              entries
            </span>
          </div>
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              {columns.map((col, index) => {
                const isSortable = col.sortable && col.accessor && onSort;
                const isActive =
                  sortBy !== undefined &&
                  sortOrder !== undefined &&
                  sortBy === col.accessor;

                return (
                  <TableCell
                    key={index}
                    isHeader
                    onClick={
                      isSortable
                        ? () => onSort(col.accessor as keyof T)
                        : undefined
                    }
                    className={`
                      px-6 py-4 text-${col.align ?? "left"}
                      text-sm font-semibold uppercase
                      ${
                        isSortable
                          ? "cursor-pointer select-none"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    `}
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        col.align === "center"
                          ? "justify-center"
                          : col.align === "right"
                            ? "justify-end"
                            : "justify-start"
                      }`}
                    >
                      <span>{col.header}</span>

                      {isSortable && (
                        <div className="flex flex-col leading-none">
                          <span
                            className={`text-[8px] ${
                              isActive && sortOrder === "asc"
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          >
                            ▲
                          </span>
                          <span
                            className={`text-[8px] ${
                              isActive && sortOrder === "desc"
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          >
                            ▼
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                {columns.map((col, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={`px-6 py-5 align-middle`}
                  >
                    <div
                      className={`flex w-full ${
                        col.align === "center"
                          ? "justify-center"
                          : col.align === "right"
                            ? "justify-end"
                            : "justify-start"
                      }`}
                    >
                      {col.cell(row)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {onPageChange && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)}{" "}
              of {total}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Prev
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => onPageChange(page + 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
