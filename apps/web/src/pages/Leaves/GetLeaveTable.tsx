import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { deleteLeave } from "../../api/delete";
import { getLeaves } from "../../api/get";
import DataTable from "../../components/tables/BasicTables/DataTable";

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

export default function GetLeaveTable() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: leaves = [],
    isLoading,
    isError,
  } = useQuery<Leave[]>({
    queryKey: ["leaves"],
    queryFn: getLeaves,
  });

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

  const columns = [
    {
      header: "Type",
      cell: (row: Leave) => (
        <div className="text-center capitalize font-medium">{row.type}</div>
      ),
    },
    {
      header: "Dates",
      cell: (row: Leave) => (
        <div className="text-center font-medium">
          {row.fromDate} → {row.toDate}
        </div>
      ),
    },
    {
      header: "Day Type",
      cell: (row: Leave) => (
        <div className="text-center capitalize font-medium">
          {row.dayType.replace("_", " ")}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row: Leave) => (
        <div
          className={`rounded-full px-2 py-1 text-xs font-semibold text-center
            ${
              row.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : row.status === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
        >
          {row.status}
        </div>
      ),
    },
    {
      header: "Action",
      cell: (row: Leave) => (
        <div className="flex justify-center gap-3">
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

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading your leaves…</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-600">Failed to load leaves.</div>;
  }

  return <DataTable columns={columns} data={leaves} />;
}
