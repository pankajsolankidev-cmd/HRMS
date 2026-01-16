import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";

import { deleteLeave } from "../../api/delete";
import { getLeaves } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

/* ---------------- Types ---------------- */

export type LeaveType = "sick" | "casual" | "marriage" | "wfh";
export type LeaveDayType = "full_day" | "first_half" | "second_half";
export type LeaveStatus = "pending" | "approved" | "rejected";

export type Leave = {
  id: number;
  employeeId: string;
  fromDate: string;
  toDate: string;
  type: LeaveType;
  dayType: LeaveDayType;
  status: LeaveStatus;
  reason: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  file?: string | null;
};

/* ---------------- Component ---------------- */

export default function GetLeaveTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* -------- Pagination & Sorting -------- */

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof Leave | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Leave) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  /* -------- Fetch Leaves -------- */

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Leave>>({
    queryKey: ["leaves", page, limit, sortBy, sortOrder],
    queryFn: () =>
      getLeaves({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
      }),
    placeholderData: (prev) => prev,
  });

  const leaves: Leave[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  /* -------- Delete Mutation -------- */

  const { mutate: removeLeave } = useMutation({
    mutationFn: deleteLeave,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred"
      );
    },
  });

  /* -------- Columns -------- */

  const columns: Column<Leave>[] = [
    {
      header: "Type",
      accessor: "type",
      sortable: true,
      cell: (row) => (
        <span className="capitalize font-medium text-gray-800 dark:text-white/90">
          {row.type}
        </span>
      ),
    },
    {
      header: "From Date",
      accessor: "fromDate",
      sortable: true,
      cell: (row) => (
        <span className="text-gray-700 dark:text-gray-300">{row.fromDate}</span>
      ),
    },
    {
      header: "To Date",
      accessor: "toDate",
      sortable: true,
      cell: (row) => (
        <span className="text-gray-700 dark:text-gray-300">{row.toDate}</span>
      ),
    },
    {
      header: "Day Type",
      accessor: "dayType",
      sortable: true,
      cell: (row) => (
        <span className="capitalize text-gray-700 dark:text-gray-300">
          {row.dayType.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
            ${
              row.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : row.status === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
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
          {row.status === "pending" ? (
            <>
              <IconEdit
                size={18}
                onClick={() => navigate(`/leave-requests/${row.id}`)}
                className="cursor-pointer text-blue-600 dark:text-blue-400"
              />
              <IconTrash
                size={18}
                onClick={() => {
                  if (confirm("Delete Leave?")) {
                    removeLeave(row.id);
                  }
                }}
                className="cursor-pointer text-red-600 dark:text-red-400"
              />
            </>
          ) : (
            <span className="text-xs text-gray-400">Locked</span>
          )}
        </div>
      ),
    },
  ];

  /* -------- States -------- */

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading leaves…</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-600">Failed to load leaves.</div>;
  }

  /* -------- Render -------- */

  return (
    <>
      <DataTable
        columns={columns}
        data={leaves}
        isLoading={isLoading}
        isError={isError}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of{" "}
          {total}
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
    </>
  );
}
