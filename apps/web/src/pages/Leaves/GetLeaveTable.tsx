import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";

import { deleteLeave } from "../../api/delete";
import { getLeaves } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

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

type Props = {
  search?: string;
};

export default function GetLeaveTable({ search }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof Leave | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSort = (field: keyof Leave) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Leave>>({
    queryKey: ["leaves", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getLeaves({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const leaves: Leave[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

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

  const columns: Column<Leave>[] = [
    {
      header: "Type",
      accessor: "type",
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
      cell: (row) => (
        <span className="text-gray-700 dark:text-gray-300">{row.toDate}</span>
      ),
    },
    {
      header: "Day Type",
      accessor: "dayType",
      cell: (row) => (
        <span className="capitalize text-gray-700 dark:text-gray-300">
          {row.dayType.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
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
                onClick={() => confirm("Delete Leave?") && removeLeave(row.id)}
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

  return (
    <>
      {!isLoading && leaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            No matching leave records found
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
          data={leaves}
          isLoading={isLoading}
          isError={isError}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {leaves.length > 0 && (
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
