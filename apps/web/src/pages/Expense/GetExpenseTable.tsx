import { IconEdit, IconLock, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import type { AxiosError } from "axios";
import { useSelector } from "react-redux";
import { deleteExpense } from "../../api/delete";
import { getExpenses } from "../../api/get";
import { approveExpense, createExpense, rejectExpense } from "../../api/patch";
import type { PaginatedResponse } from "../../api/types";
import Can from "../../components/common/Can";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

type Expense = {
  id: number;
  expenseType: string;
  amount: number | string;
  expenseDate: string;
  rejectionReason?: string;
  status: "DRAFT" | "CREATED" | "APPROVED" | "REJECTED";
};

type Props = {
  search?: string;
};

export default function GetExpenseTable({ search }: Props) {
  const roles = useSelector((state: any) => state.auth.roles);

  const isEmployee = roles?.includes("EMPLOYEE");
  const isHr = roles?.includes("HR") || roles?.includes("ADMIN");

  const canCreateExpense = isEmployee || isHr;

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Expense | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    undefined,
  );
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSort = (field: keyof Expense) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("asc");
      setPage(1);
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
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    },
  });

  const { mutate: approve } = useMutation({
    mutationFn: approveExpense,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Expense Approved");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const { mutate: reject } = useMutation({
    mutationFn: rejectExpense,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Expense rejected");
      setRejectId(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const { mutate: create } = useMutation({
    mutationFn: createExpense,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Expense submitted for approval");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const expenses: Expense[] = data?.data ?? [];
  const total = data?.meta?.total ?? expenses.length;

  const columns: Column<Expense>[] = [
    {
      header: "Type",
      accessor: "expenseType",
      cell: (row) => (
        <span className="text-gray-800 dark:text-white">{row.expenseType}</span>
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
      cell: (row) => row.expenseDate,
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              row.status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : row.status === "REJECTED"
                  ? "bg-red-100 text-red-700"
                  : row.status === "CREATED"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.status}
          </span>

          {canCreateExpense && row.status === "DRAFT" && (
            <button
              onClick={() => create(row.id)}
              className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              Create
            </button>
          )}
        </div>
      ),
    },
    {
      header: "Reason",
      accessor: "rejectionReason",
      cell: (row) => (
        <span className="text-gray-800 dark:text-white">
          {row.rejectionReason || "-"}
        </span>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          <Can permissions={["expense.approve", "expense.reject"]}>
            {row.status === "CREATED" && (
              <>
                <button
                  onClick={() => approve(row.id)}
                  className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => setRejectId(row.id)}
                  className="rounded-md bg-red-800 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
                >
                  Reject
                </button>
              </>
            )}
          </Can>

          <Can
            permissions={["expense.update_own", "expense.delete_own"]}
            requireAll
          >
            {row.status === "DRAFT" && (
              <>
                <IconEdit
                  size={18}
                  onClick={() => navigate(`/expenses/${row.id}`)}
                  className="cursor-pointer text-blue-600 dark:text-blue-400"
                />
                <IconTrash
                  size={18}
                  onClick={() =>
                    confirm("Delete expense?") && removeExpense(row.id)
                  }
                  className="cursor-pointer text-red-600 dark:text-red-400"
                />
              </>
            )}
          </Can>

          {row.status === "CREATED" && (
            <IconLock size={18} className="text-gray-400 cursor-not-allowed" />
          )}
          {row.status === "APPROVED" ||
            (row.status === "REJECTED" && (
              <IconLock
                size={18}
                className="text-gray-400 cursor-not-allowed"
              />
            ))}
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

      {rejectId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Reject Expense</h3>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (optional)"
              className="w-full rounded-md border p-2 text-sm"
              rows={3}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectionReason("");
                }}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  reject({
                    id: rejectId,
                    reason: rejectionReason.trim() || undefined,
                  })
                }
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
