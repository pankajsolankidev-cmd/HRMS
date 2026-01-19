import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import { deleteExpense } from "../../api/delete";
import { getExpenses } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

/* ✅ Backend-aligned type (camelCase) */
type Expense = {
  id: number;
  expenseType: string;
  amount: number | string;
  expenseDate: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
};

type Props = {
  search?: string;
};

export default function GetExpenseTable({ search }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof Expense | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSort = (field: keyof Expense) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Expense>>({
    queryKey: ["expenses", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getExpenses({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeExpense } = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    },
  });

  const expenses: Expense[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Expense>[] = [
    {
      header: "Type",
      accessor: "expenseType",
      cell: (row) => (
        <span className=" text-gray-800 dark:text-white">
          {row.expenseType}
        </span>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          ₹{" "}
          {Number(row.amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "expenseDate",
      sortable: true,
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {new Date(row.expenseDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium
            ${
              row.status === "Approved"
                ? "bg-green-100 text-green-700"
                : row.status === "Rejected"
                  ? "bg-red-100 text-red-700"
                  : row.status === "Submitted"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
            }
          `}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/expenses/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />
          <IconTrash
            size={18}
            onClick={() => confirm("Delete expense?") && removeExpense(row.id)}
            className="cursor-pointer text-red-600 dark:text-red-400"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {!isLoading && expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            No data found
          </p>

          {search && (
            <p className="mt-1 text-sm text-gray-500">
              No results matching{" "}
              <span className="font-medium">"{search}"</span>
            </p>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
          isLoading={isLoading}
          isError={isError}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {expenses.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)}{" "}
            of {total}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
