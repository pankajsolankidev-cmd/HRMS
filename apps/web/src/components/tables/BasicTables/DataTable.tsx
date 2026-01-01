import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";


type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading data...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400">
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
              {columns.map((col, index) => (
                <TableCell
                  key={index}
                  isHeader
                  className=" px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                {columns.map((col, colIndex) => (
                  <TableCell key={colIndex} className=" px-6 py-5">
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
