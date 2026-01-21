import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

import type { AxiosError } from "axios";
import { deletePayroll } from "../../api/delete";
import { getEmployees, getPayrolls } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";

export type Payroll = {
  id: string;
  employeeName: string;
  month: string;
  year: number;
  totalDeductions: number;
  netSalary: number;
};

const MONTHS = [
  { label: "January", value: "JANUARY" },
  { label: "February", value: "FEBRUARY" },
  { label: "March", value: "MARCH" },
  { label: "April", value: "APRIL" },
  { label: "May", value: "MAY" },
  { label: "June", value: "JUNE" },
  { label: "July", value: "JULY" },
  { label: "August", value: "AUGUST" },
  { label: "September", value: "SEPTEMBER" },
  { label: "October", value: "OCTOBER" },
  { label: "November", value: "NOVEMBER" },
  { label: "December", value: "DECEMBER" },
];

export default function GetPayrollTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof Payroll | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Payroll) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const [tempMonth, setTempMonth] = useState<string | undefined>();
  const [tempYear, setTempYear] = useState<number | undefined>();
  const [month, setMonth] = useState<string | undefined>();
  const [year, setYear] = useState<number | undefined>();

  const isFilterApplied = Boolean(month && year);

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () =>
      getEmployees({
        page: 1,
        limit: 100,
      }),
  });

  const employeeList = employeesData?.data ?? [];

  const employeeMap = useMemo(
    () =>
      new Map(
        employeeList.map((emp: any) => [
          emp.id,
          `${emp.firstName} ${emp.lastName}`,
        ]),
      ),
    [employeeList],
  );

  const { data, isLoading, isError } = useQuery<PaginatedResponse<any>>({
    queryKey: [
      "payrolls",
      page,
      limit,
      sortBy,
      sortOrder,
      month ?? "all",
      year ?? "all",
    ],
    queryFn: () =>
      getPayrolls({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
        month,
        year,
      }),
    placeholderData: (prev) => prev,
  });

  const total = data?.meta?.total ?? 0;

  const payrollList: Payroll[] =
    data?.data?.map((p: any) => ({
      id: p.id,
      employeeName: employeeMap.get(p.employeeId) || p.employeeId,
      month: p.month,
      year: p.year,
      totalDeductions: Number(p.totalDeductions),
      netSalary: Number(p.netSalary),
    })) ?? [];

  const { mutate: remove } = useMutation({
    mutationFn: deletePayroll,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Payroll deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const columns: Column<Payroll>[] = [
    {
      header: "Employee",
      accessor: "employeeName",
      sortable: true,
      cell: (r) => r.employeeName,
    },
    {
      header: "Month",
      accessor: "month",
      cell: (r) => r.month,
    },
    {
      header: "Year",
      accessor: "year",
      cell: (r) => r.year,
    },
    {
      header: "Deductions",
      accessor: "totalDeductions",
      cell: (row) => (
        <span className="font-medium text-red-600 dark:text-red-400">
          ₹ {row.totalDeductions.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Net Salary",
      accessor: "netSalary",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          ₹ {row.netSalary.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/payrolls/${row.id}`)}
            className="cursor-pointer text-blue-600"
          />
          <IconTrash
            size={18}
            onClick={() => confirm("Delete this payroll?") && remove(row.id)}
            className="cursor-pointer text-red-600"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 grid grid-cols-1 items-end gap-4 md:grid-cols-4">
        <Select
          label="Month"
          options={MONTHS}
          value={tempMonth ?? ""}
          onChange={(v) => setTempMonth(v || undefined)}
        />

        <Input
          label="Year"
          type="number"
          value={tempYear ?? ""}
          onChange={(e) =>
            setTempYear(e.target.value ? Number(e.target.value) : undefined)
          }
        />

        <div className="flex gap-2">
          <button
            disabled={!tempMonth || !tempYear}
            onClick={() => {
              setMonth(tempMonth);
              setYear(tempYear);
              setPage(1);
            }}
            className="rounded-lg bg-black px-6 py-2 text-sm text-white
                       disabled:opacity-50 dark:bg-white dark:text-black"
          >
            Apply
          </button>

          {isFilterApplied && (
            <button
              onClick={() => {
                setTempMonth(undefined);
                setTempYear(undefined);
                setMonth(undefined);
                setYear(undefined);
                setPage(1);
              }}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payrollList}
        isLoading={isLoading}
        isError={isError}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

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
