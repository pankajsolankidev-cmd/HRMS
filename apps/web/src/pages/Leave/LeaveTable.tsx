import { deleteLeave, deleteManualLeave } from "@/api/delete";
import { getEmployees, getLeaves } from "@/api/get";
import { approveLeave, rejectLeave } from "@/api/patch";
import type { PaginatedResponse } from "@/api/types";
import Can from "@/components/common/Can";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";
import DeleteConfirm from "@/components/common/DeleteConfirmModal";
import FilterCard from "@/components/common/FilterCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import DataTable, {
  type Column,
} from "@/components/tables/BasicTables/DataTable";
import { useTableSort } from "@/components/tables/useTableSort";
import Button from "@/components/ui/button/Button";
import type { RootState } from "@/context";
import {
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

export const LEAVE_TYPES = [
  { label: "Sick", value: "sick" },
  { label: "Casual", value: "casual" },
  { label: "Marriage", value: "marriage" },
  { label: "WFH", value: "wfh" },
];
export const LEAVE_STATUS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];
const LEAVE_SOURCE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Self Leave", value: "self" },
  { label: "Manual Leave", value: "manual" },
];
export type LeaveType = "sick" | "casual" | "marriage" | "wfh";

export type LeaveDayType =
  | "full_day"
  | "first_half"
  | "second_half"
  | "multiple_days";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  userId?: string;
};

export type LeaveApiResponse = {
  id: string;
  fromDate: string;
  toDate: string;
  type: LeaveType;
  dayType: LeaveDayType;
  status: LeaveStatus;
  reason: string;
  totalDays: string;
  rejectionReason?: string | null;
  file?: string;

  employee: User;
  createdByEmployee?: User;
  approvedByUser?: User | null;
  rejectedByUser?: User | null;
};

export type LeaveApiRaw = {
  leave: {
    id: string;
    fromDate: string;
    toDate: string;
    type: LeaveType;
    dayType: LeaveDayType;
    status: LeaveStatus;
    reason: string;
    totalDays: string;
    rejectionReason?: string | null;
    file?: string;
  };
  employee: User;
  createdByEmployee?: User;
  approvedByUser?: User | null;
  rejectedByUser?: User | null;
};
export default function LeaveTable() {
  const navigate = useNavigate();
  const { id, roles } = useSelector((state: RootState) => state.auth);

  const [search, setSearch] = useState<string | undefined>();
  const [rawSearch, setRawSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { sortBy, sortOrder, handleSort } = useTableSort<LeaveApiResponse>();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [viewLeave, setViewLeave] = useState<LeaveApiResponse | null>(null);

  const [type, setType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();
  const [createdByType, setCreatedByType] = useState<string | undefined>();
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim() || undefined);
      setPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder]);
  const filters = {
    ...(type && { type }),
    ...(status && { status }),
    ...(employeeId && { employeeId }),
    ...(fromDate && toDate && { fromDate, toDate }),
    ...(createdByType && { createdByType }),
  };
  const { data, isLoading, isError, refetch } = useQuery<
    PaginatedResponse<LeaveApiRaw>
  >({
    queryKey: [
      "leaves",
      page,
      limit,
      sortBy,
      sortOrder,
      search ?? "all",
      type ?? "all",
      status ?? "all",
      employeeId ?? "all",
      createdByType ?? "all",
      fromDate ?? "none",
      toDate ?? "none",
    ],
    queryFn: () =>
      getLeaves({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
        search,
        ...filters,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeLeave, isPending: isDeletePending } = useMutation({
    mutationFn: deleteLeave,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave deleted successfully");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });
  const { mutate: removeManualLeave } = useMutation({
    mutationFn: deleteManualLeave,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave deleted successfully");
      refetch();
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
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => getEmployees(),
  });

  const employeeOptions =
    employeesData?.data?.map((emp: any) => ({
      label: `${emp.firstName} ${emp.lastName}`,
      value: emp.id,
    })) ?? [];

  const { mutate: reject } = useMutation({
    mutationFn: rejectLeave,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave rejected");
      setRejectId(null);
      setRejectionReason("");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const leaves: LeaveApiResponse[] = (data?.data ?? []).map((item) => ({
    ...item.leave,
    employee: item.employee,
    createdByEmployee: item.createdByEmployee,
    approvedByUser: item.approvedByUser ?? null,
    rejectedByUser: item.rejectedByUser ?? null,
  }));

  const total = data?.meta?.total ?? 0;
  const isEmployee = roles.includes("EMPLOYEE");

  const formatDayType = (value: string) =>
    value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const columns: Column<LeaveApiResponse>[] = [
    ...(!isEmployee
      ? [
          {
            header: "Employee",
            cell: (row: LeaveApiResponse) => (
              <span className="font-medium text-gray-800 dark:text-white/90">
                {row.employee
                  ? `${row.employee.firstName} ${row.employee.lastName}`
                  : "—"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Type",
      accessor: "type",
      cell: (row) => <span className="capitalize">{row.type}</span>,
    },
    {
      header: "Leave Period",
      accessor: "fromDate",
      sortable: true,
      cell: (row) => (
        <span className="font-medium">
          {row.fromDate} → {row.toDate}
        </span>
      ),
    },
    {
      header: "Day Type",
      accessor: "dayType",
      cell: (row) => (
        <span className="capitalize">{formatDayType(row.dayType)}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => {
        const statusStyles =
          row.status === "pending"
            ? "bg-yellow-100 text-yellow-800"
            : row.status === "approved"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800";

        return (
          <Chip label={row.status.toUpperCase()} className={statusStyles} />
        );
      },
    },
    {
      header: "Total Days",
      cell: (row) => <span>{row.totalDays}</span>,
    },
    {
      header: "Action By",
      cell: (row: LeaveApiResponse) => {
        const user = row.approvedByUser ?? row.rejectedByUser;

        if (!user) {
          return <span className="text-gray-400">—</span>;
        }

        return (
          <span className="text-sm font-medium">
            {user.firstName} {user.lastName}
          </span>
        );
      },
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => {
        const isSelfLeave = row.employee?.userId === id;
        const isCreatedByMe = row.createdByEmployee?.userId === id;
        const isManualLeave = !isSelfLeave && isCreatedByMe;
        const isHr = !isEmployee;
        const isPending = row.status === "pending";
        const canApprove = isHr && !isSelfLeave && !isManualLeave && isPending;
        const canHrManage = isHr && (isSelfLeave || isManualLeave);
        const canEmployeeManage = isEmployee && isSelfLeave && isPending;

        return (
          <div
            className="relative flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === row.id ? null : row.id)
              }
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <IconDotsVertical size={20} className="text-gray-500" />
            </button>

            {activeDropdown === row.id && (
              <div className="absolute right-0 top-8 z-[100] w-44 rounded-lg border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => setViewLeave(row)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900/60"
                >
                  <IconEye size={16} /> View Details
                </button>

                {canApprove && (
                  <Can permissions={["leave.approve"]}>
                    <button
                      onClick={() => approve(row.id)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                    >
                      <IconCheck size={16} /> Approve
                    </button>

                    <button
                      onClick={() => setRejectId(row.id)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                    >
                      <IconX size={16} /> Reject
                    </button>
                  </Can>
                )}

                {canHrManage && (
                  <>
                    <button
                      onClick={() =>
                        isSelfLeave
                          ? navigate(`/leave-requests/${row.id}`)
                          : navigate(`/leave-requests/manual/${row.id}`)
                      }
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                    >
                      <IconEdit size={16} /> Edit
                    </button>

                    <DeleteConfirm<string>
                      title="Delete Leave Request"
                      description="Are you sure you want to delete this leave request?"
                      loading={isDeletePending}
                      onConfirm={() =>
                        isSelfLeave
                          ? removeLeave(row.id)
                          : removeManualLeave(row.id)
                      }
                    >
                      {(onDelete) => (
                        <button
                          onClick={() => onDelete(row.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                        >
                          <IconTrash size={16} /> Delete
                        </button>
                      )}
                    </DeleteConfirm>
                  </>
                )}

                {canEmployeeManage && (
                  <>
                    <button
                      onClick={() => navigate(`/leave-requests/${row.id}`)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                    >
                      <IconEdit size={16} /> Edit
                    </button>

                    <DeleteConfirm<string>
                      title="Delete Leave Request"
                      description="Are you sure you want to delete this leave request?"
                      loading={isDeletePending}
                      onConfirm={() => removeLeave(row.id)}
                    >
                      {(onDelete) => (
                        <button
                          onClick={() => onDelete(row.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                        >
                          <IconTrash size={16} /> Delete
                        </button>
                      )}
                    </DeleteConfirm>
                  </>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageMeta title="Leaves" description="Manage leave requests" />
      <PageBreadcrumb pageTitle="Leaves" />
      <FilterCard className="mb-5">
        <div className="grid grid-cols-6 gap-4 w-full">
          <div className="col-span-6 md:col-span-2">
            <Select
              options={LEAVE_TYPES}
              placeholder="Select type"
              value={type ?? ""}
              onChange={(val) => {
                setType(val || undefined);
                setPage(1);
              }}
            />
          </div>

          <div className="col-span-6 md:col-span-2">
            <Select
              options={LEAVE_STATUS}
              placeholder="Select status"
              value={status ?? ""}
              onChange={(val) => {
                setStatus(val || undefined);
                setPage(1);
              }}
            />
          </div>

          {!isEmployee && (
            <>
              <div className="col-span-6 md:col-span-2">
                <Select
                  options={employeeOptions}
                  placeholder="Select employee"
                  value={employeeId ?? ""}
                  onChange={(val) => {
                    setEmployeeId(val || undefined);
                    setPage(1);
                  }}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <Select
                  options={LEAVE_SOURCE_OPTIONS}
                  placeholder="Leave source"
                  value={createdByType ?? ""}
                  onChange={(val) => {
                    setCreatedByType(val || undefined);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}

          <div className="col-span-6 md:col-span-2">
            <DatePicker
              id="dateRange"
              mode="range"
              placeholder="Select date range"
              value={
                fromDate && toDate
                  ? [new Date(fromDate), new Date(toDate)]
                  : undefined
              }
              onChange={(dates) => {
                if (dates?.length === 2) {
                  setFromDate(dates[0].toLocaleDateString("en-CA"));
                  setToDate(dates[1].toLocaleDateString("en-CA"));
                  setPage(1);
                } else {
                  setFromDate(undefined);
                  setToDate(undefined);
                }
              }}
            />
          </div>

          <div className="col-span-6 md:col-span-1 flex items-end">
            <Button
              variant="outline"
              className=""
              onClick={() => {
                setType(undefined);
                setStatus(undefined);
                setEmployeeId(undefined);
                setCreatedByType(undefined);
                setFromDate(undefined);
                setToDate(undefined);
                setSearch(undefined);
                setRawSearch("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </FilterCard>

      <Card
        action={
          <div className="flex items-center justify-between gap-3">
            {!isEmployee && (
              <div className="relative w-full max-w-xs">
                <div className="absolute left-3 top-3 text-gray-400">
                  <IconSearch size={18} stroke={2} />
                </div>

                <Input
                  placeholder="Search by name"
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  className="pl-10 pr-10 h-[42px] focus-visible:ring-0"
                />

                {rawSearch && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setRawSearch("");
                      setSearch(undefined);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                  >
                    <IconX size={16} />
                  </Button>
                )}
              </div>
            )}

            <Button onClick={() => navigate("/leave-requests/new")} size="md">
              Add Leave
            </Button>
            {!isEmployee && (
              <>
                <Button
                  onClick={() => navigate("/leave-requests/manual/new")}
                  size="md"
                >
                  Add Employee Leave
                </Button>
              </>
            )}
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={leaves}
          isLoading={isLoading}
          isError={isError}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </Card>

      {viewLeave && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800 border dark:border-gray-700">
            <div className="mb-6 flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Leave Details
              </h3>
              <button
                onClick={() => setViewLeave(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <IconX size={25} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Employee
                </span>
                <span className="mt-1 font-medium text-gray-900 dark:text-gray-100 truncate">
                  {viewLeave.employee?.firstName} {viewLeave.employee?.lastName}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Leave Type
                </span>
                <span className="mt-1 font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {viewLeave.type}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Duration
                </span>
                <span className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {viewLeave.fromDate}{" "}
                  <span className="mx-1 text-gray-400">→</span>{" "}
                  {viewLeave.toDate}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Day Type
                </span>
                <span className="mt-1 font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {viewLeave.dayType.replace("_", " ")}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total Days
                </span>
                <span className="mt-1 font-bold text-red-600">
                  {viewLeave.totalDays}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Reason
                </span>
                <span className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {viewLeave.reason}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  CreatedBy
                </span>
                <span className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {viewLeave.createdByEmployee
                    ? `${viewLeave.createdByEmployee.firstName} ${viewLeave.createdByEmployee.lastName}`
                    : "—"}
                </span>
              </div>
              {viewLeave.rejectionReason && (
                <div className="flex flex-col col-span-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <span className="text-red-500 uppercase text-xs font-semibold">
                    Rejection Reason
                  </span>
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    {viewLeave.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-2">Reject Leave Request</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for rejection.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full rounded-md border p-2 text-sm dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-red-500"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  reject({
                    id: rejectId,
                    rejectionReason: rejectionReason.trim(),
                  })
                }
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={!rejectionReason.trim()}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
