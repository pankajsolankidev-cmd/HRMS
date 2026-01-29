import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";

import { deleteLeave } from "../../api/delete";
import { getLeaves } from "../../api/get";
import { approveLeave, rejectLeave } from "../../api/patch";
import type { PaginatedResponse } from "../../api/types";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import type {
  Employee,
  LeaveApiResponse,
  LeaveDayType,
  LeaveList,
  LeaveStatus,
  LeaveType,
} from "./leaveType";

export type LeaveRow = {
  id: string;
  employee: Employee;
  fromDate: string;
  toDate: string;
  type: LeaveType;
  dayType: LeaveDayType;
  status: LeaveStatus;
  reason: string;
  totalDays: string;
  rejectionReason?: string | null;
  file?: string;

  approvedByUser?: {
    firstName: string;
    lastName: string;
  } | null;

  rejectedByUser?: {
    firstName: string;
    lastName: string;
  } | null;
};

type Props = {
  search?: string;
};

export default function GetLeaveTable({ search }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof LeaveRow | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    undefined,
  );
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSort = (field: keyof LeaveRow) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
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

  const { data, isLoading, isError } = useQuery<
    PaginatedResponse<LeaveApiResponse<LeaveList>>
  >({
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

  const apiLeaves = data?.data ?? [];

  const leaves: LeaveRow[] = apiLeaves.map((item) => ({
    id: item.leave.id,
    employee: item.employee,
    fromDate: item.leave.fromDate,
    toDate: item.leave.toDate,
    type: item.leave.type,
    dayType: item.leave.dayType,
    status: item.leave.status,
    reason: item.leave.reason,
    totalDays: item.leave.totalDays,
    rejectionReason: item.leave.rejectionReason ?? null,
    file: item.leave.file,

    approvedByUser: item.approvedByUser
      ? {
          firstName: item.approvedByUser.firstName,
          lastName: item.approvedByUser.lastName,
        }
      : null,

    rejectedByUser: item.rejectedByUser
      ? {
          firstName: item.rejectedByUser.firstName,
          lastName: item.rejectedByUser.lastName,
        }
      : null,
  }));

  const total = data?.meta?.total ?? 0;

  const { mutate: removeLeave } = useMutation({
    mutationFn: deleteLeave,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });
  const { mutate: approve } = useMutation({
    mutationFn: approveLeave,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave Approved");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const { mutate: reject } = useMutation({
    mutationFn: rejectLeave,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave rejected");
      setRejectId(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const columns: Column<LeaveRow>[] = [
    {
      header: "Employee",
      cell: (row) => (
        <span className="">
          {row.employee
            ? `${row.employee.firstName} ${row.employee.lastName}`
            : "—"}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      cell: (row) => (
        <span className="capitalize  text-gray-800 dark:text-white/90">
          {row.type}
        </span>
      ),
    },
    {
      header: "From Date",
      accessor: "fromDate",
      sortable: true,
      cell: (row) => (
        <span className="text-gray-700 font-medium dark:text-gray-300">
          {row.fromDate}
        </span>
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
      header: "Total Days",
      accessor: "totalDays",
      cell: (row) => (
        <span className="text-red-700 dark:text-gray-300">{row.totalDays}</span>
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
      header: "Reason",
      cell: (row) => (
        <span className="text-red-700 dark:text-gray-300">
          {row.rejectionReason}
        </span>
      ),
    },
    {
      header: "User Reason",
      cell: (row) => (
        <span className="text-red-700 dark:text-gray-300">{row.reason}</span>
      ),
    },
    {
      header: "Action By",
      cell: (row) => {
        if (row.status === "approved" && row.approvedByUser) {
          return (
            <span className="text-green-700 font-medium">
              {row.approvedByUser.firstName} {row.approvedByUser.lastName}
            </span>
          );
        }

        if (row.status === "rejected" && row.rejectedByUser) {
          return (
            <span className="text-red-700 font-medium">
              {row.rejectedByUser.firstName} {row.rejectedByUser.lastName}
            </span>
          );
        }

        return <span className="text-gray-400">—</span>;
      },
    },

    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          {row.status === "pending" ? (
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

              <IconEdit
                size={18}
                onClick={() => navigate(`/leave-requests/${row.id}`)}
                className="cursor-pointer text-blue-600 hover:text-blue-700"
                title="Edit"
              />

              <IconTrash
                size={18}
                onClick={() => confirm("Delete Leave?") && removeLeave(row.id)}
                className="cursor-pointer text-red-600 hover:text-red-700"
                title="Delete"
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
      {rejectId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Reject Leave</h3>
            <p className="text-sm text-gray-500 mb-4">
              You may optionally provide a rejection reason.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (optional)"
              className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
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
                    rejectionReason: rejectionReason.trim() || undefined,
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
