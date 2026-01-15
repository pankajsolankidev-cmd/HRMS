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
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Loading data...
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
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              {columns.map((col, index) => {
                const isSortable = col.sortable && col.accessor && onSort;
                const isActive = sortBy === col.accessor;

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
                      text-xs font-semibold uppercase
                      ${
                        isSortable
                          ? "cursor-pointer select-none hover:text-black dark:hover:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    `}
                  >
                    <div className="inline-flex items-center gap-1">
                      {col.header}
                      {isActive && (
                        <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
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
                    className={`px-6 py-5 text-${
                      col.align ?? "left"
                    } align-middle`}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


