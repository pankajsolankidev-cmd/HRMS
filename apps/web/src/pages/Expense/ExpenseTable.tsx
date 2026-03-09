import {
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";

import Can from "../../components/common/Can";
import Card from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { useTableSort } from "../../components/tables/useTableSort";
import Button from "../../components/ui/button/Button";

import type { AxiosError } from "axios";
import { deleteExpense } from "../../api/delete";
import { getExpenses, getExpenseSummary } from "../../api/get";
import { approveExpense, createExpense, rejectExpense } from "../../api/patch";
import type { PaginatedResponse } from "../../api/types";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DatePicker from "../../components/form/date-picker";

type Expense = {
  id: number;
  expenseType: string;
  amount: number | string;
  expenseDate: string;
  rejectionReason?: string;
  status: "DRAFT" | "CREATED" | "APPROVED" | "REJECTED";
  description?: string;
  employeeName: string;
};

export default function ExpenseTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { sortBy, sortOrder, handleSort } = useTableSort<Expense>();

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
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [run, setRun] = useState(false);

  const {
    data: summaryData,
    isFetching: isSummaryFetching,
    error,
  } = useQuery({
    queryKey: ["expense-summary", fromDate, toDate],
    queryFn: () => getExpenseSummary(fromDate, toDate),
    enabled: run,
  });

  useEffect(() => {
    if (summaryData) toast.success("Expense summary loaded!");
  }, [summaryData]);

  useEffect(() => {
    if (error) toast.error(`Failed to fetch: ${error.message}`);
  }, [error]);
  const handleClear = () => {
    setFromDate(today);
    setToDate(today);
    setRun(false);
    queryClient.removeQueries({ queryKey: ["expense-summary"] });
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Expense>>({
    queryKey: ["expenses", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getExpenses({
        page,
        limit,
        sortBy: sortBy as string,
        sortOrder,
        search,
      }),
    placeholderData: (prev) => prev,
  });
  const tableData =
    data?.data.map(({ expenses, employees }: any) => ({
      ...expenses,
      employeeName: `${employees.firstName} ${employees.lastName}`,
    })) ?? [];

  const { mutate: remove, isPending } = useMutation({
    mutationFn: deleteExpense,
    onSuccess: (res) => {
      toast.success(res.message ?? "Expense deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const { mutate: approve } = useMutation({
    mutationFn: approveExpense,
    onSuccess: (res) => {
      toast.success(res.message ?? "Expense Approved");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const { mutate: reject } = useMutation({
    mutationFn: rejectExpense,
    onSuccess: (res) => {
      toast.success(res.message ?? "Expense Rejected");
      setRejectId(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const { mutate: submitForApproval } = useMutation({
    mutationFn: createExpense,
    onSuccess: (res) => {
      toast.success(res.message ?? "Expense submitted for approval");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong");
    },
  });

  const columns: Column<Expense>[] = [
    {
      header: "Type",
      accessor: "expenseType",
      cell: (row) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.expenseType}
        </span>
      ),
    },
    {
      header: "Submitted By",
      cell: (row) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.employeeName}
        </span>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-green-600">
          ₹{Number(row.amount).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "expenseDate",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.expenseDate}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            row.status === "APPROVED"
              ? "bg-green-100 text-green-800"
              : row.status === "REJECTED"
                ? "bg-red-100 text-red-800"
                : row.status === "CREATED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
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
            <div className="absolute right-0 top-8 z-[100] w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setViewExpense(row)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900/60"
              >
                <IconEye size={16} /> View Details
              </button>

              {row.status === "DRAFT" && (
                <>
                  <button
                    onClick={() => submitForApproval(row.id)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm"
                  >
                    <IconCheck size={16} /> Submit
                  </button>
                  <button
                    onClick={() => navigate(`/expenses/${row.id}`)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm"
                  >
                    <IconEdit size={16} /> Edit
                  </button>
                  <DeleteConfirm<Number>
                    title="Delete Expense"
                    description="Are you sure you want to delete this expense?"
                    loading={isPending}
                    onConfirm={() => remove(row.id)}
                  >
                    {(askDelete) => (
                      <button
                        onClick={() => askDelete(row.id)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                      >
                        <IconTrash size={16} /> Delete
                      </button>
                    )}
                  </DeleteConfirm>
                </>
              )}

              {row.status === "CREATED" && (
                <Can permissions={["expense.approve", "expense.reject"]}>
                  <button
                    onClick={() => approve(row.id)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm"
                  >
                    <IconCheck size={16} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectId(row.id)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm"
                  >
                    <IconX size={16} /> Reject
                  </button>
                </Can>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Expenses" description="Manage your expenses" />
      <PageBreadcrumb pageTitle="Expenses" />

      <div className="space-y-6">
        <Can permission="expense.view_summary">
          <Card>
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-end gap-3">
                <DatePicker
                  id="dateRange"
                  label="Select Date Range"
                  mode="range"
                  value={
                    fromDate && toDate
                      ? [new Date(fromDate), new Date(toDate)]
                      : undefined
                  }
                  onChange={(dates) => {
                    if (dates.length === 2) {
                      setFromDate(dates[0].toLocaleDateString("en-CA"));
                      setToDate(dates[1].toLocaleDateString("en-CA"));
                      setRun(false);
                    }
                  }}
                />
                <button
                  onClick={() => setRun(true)}
                  disabled={isSummaryFetching || !fromDate || !toDate}
                  className="h-[45px] rounded-lg bg-black px-6 text-sm text-white
                     disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {isSummaryFetching ? "Fetching..." : "View Summary"}
                </button>
                <button
                  onClick={handleClear}
                  className="h-[45px] rounded-lg border px-6 text-sm
               hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-gray-50 p-4 dark:bg-gray-900 dark:border-gray-800">
                  <p className="text-sm text-gray-500">Total Count</p>
                  <p className="text-2xl font-bold">
                    {summaryData?.totalExpenses ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border bg-gray-50 p-4 dark:bg-gray-900 dark:border-gray-800">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold ">
                    ₹{" "}
                    {Number(summaryData?.totalAmount ?? 0).toLocaleString(
                      "en-IN",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Can>
        <Card
          action={
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full max-w-xs">
                <div className="absolute left-3 top-3 text-gray-400">
                  <IconSearch size={18} stroke={2} />
                </div>
                <Input
                  placeholder="Search by type"
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  className="pl-10 pr-10 h-[42px] focus-visible:ring-0"
                />
                {rawSearch && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRawSearch("");
                      setSearch(undefined);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full"
                  >
                    ✕
                  </Button>
                )}
              </div>

              <Button
                onClick={() => navigate("/expenses/new")}
                size="md"
                className="h-[42px] bg-black dark:bg-blue-500 whitespace-nowrap"
              >
                Add Expense
              </Button>
            </div>
          }
        >
          <DataTable
            columns={columns}
            data={tableData}
            isLoading={isLoading}
            isError={isError}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            page={page}
            limit={limit}
            total={data?.meta?.total ?? 0}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </Card>
      </div>

      {viewExpense && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800 border dark:border-gray-700">
            <div className="mb-6 flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold">Expense Details</h3>
              <button
                onClick={() => setViewExpense(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX size={25} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-6 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase text-xs font-semibold">
                  Type
                </span>
                <span className="font-medium mt-1">
                  {viewExpense.expenseType}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase text-xs font-semibold">
                  Amount
                </span>
                <span className="text-xl font-bold text-green-600 mt-1">
                  ₹{Number(viewExpense.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase text-xs font-semibold">
                  Date
                </span>
                <span className="font-medium mt-1">
                  {viewExpense.expenseDate}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase text-xs font-semibold">
                  Status
                </span>
                <span className="mt-1 font-bold">{viewExpense.status}</span>
              </div>

              {viewExpense.rejectionReason && (
                <div className="flex flex-col col-span-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <span className="text-red-500 uppercase text-xs font-semibold">
                    Rejection Reason
                  </span>
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    {viewExpense.rejectionReason}
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
            <h3 className="text-lg font-semibold mb-2">Reject Expense</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason..."
              className="w-full rounded-md border p-2 text-sm dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-red-500"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  reject({ id: rejectId, reason: rejectionReason })
                }
                className="bg-red-600 text-white"
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
