import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";

import DataTable from "../../components/tables/BasicTables/DataTable";
import { getLeaves } from "../../api/get";
import { deleteLeave } from "../../api/delete";

export type LeaveType = "SICK" | "CASUAL" | "MARRIAGE" | "WFH";

export type LeaveDayType = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Leave = {
  id: number;
  employeeId: string;
  employeeName?: string;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });

  const columns = [
    {
      header: "Type",
      cell: (row: Leave) => (
        <div className="font-medium text-center">{row.type}</div>
      ),
    },
    {
      header: "Dates",
      cell: (row: Leave) => (
        <div className="font-medium text-center">
          {row.fromDate} → {row.toDate}
        </div>
      ),
    },
    {
      header: "Day Type",
      cell: (row: Leave) => (
        <div className="font-medium text-center">
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
              row.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : row.status === "APPROVED"
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
        <div className="flex items-center gap-3 justify-center">
          {row.status === "PENDING" && (
            <>
              <IconEdit
                size={18}
                onClick={() => navigate(`/leaves/${row.id}`)}
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
          )}

          {row.status !== "PENDING" && (
            <span className="text-xs text-gray-400">Locked</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/leaves/new")}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white
                     dark:bg-white dark:text-black"
        >
          <IconPlus size={18} />
          Apply Leave
        </button>
      </div>

      <DataTable
        columns={columns}
        data={leaves}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
