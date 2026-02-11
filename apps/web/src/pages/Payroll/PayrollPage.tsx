import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import { deletePayroll } from "../../api/delete";
import { getEmployees, getPayrolls } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import Card from "../../components/common/ComponentCard";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import Select from "../../components/form/Select";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { useTableSort } from "../../components/tables/useTableSort";
import Button from "../../components/ui/button/Button";

export type Payroll = {
  id: number;
  employeeName: string;
  month: string;
  year: number;
  totalDeductions: number;
  netSalary: number;
  baseSalary?: number;
};

export const MONTHS = [
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

export default function PayrollPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [month, setMonth] = useState<string | undefined>();
  const [year, setYear] = useState<number | undefined>();

  const { sortBy, sortOrder, handleSort } = useTableSort<Payroll>();
  const START_YEAR = 2020;
  const CURRENT_YEAR = new Date().getFullYear();

  const YEAR_OPTIONS = Array.from(
    { length: CURRENT_YEAR - START_YEAR + 1 },
    (_, i) => {
      const year = CURRENT_YEAR - i;
      return {
        label: year.toString(),
        value: year.toString(),
      };
    },
  );

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => getEmployees({ page: 1, limit: 100 }),
  });

  const employeeMap = useMemo(
    () =>
      new Map(
        employeesData?.data?.map((emp: any) => [
          emp.id,
          `${emp.firstName} ${emp.lastName}`,
        ]),
      ),
    [employeesData],
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
        sortBy: sortBy as string,
        sortOrder,
        month,
        year,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removePayroll, isPending } = useMutation({
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

  const payrolls: Payroll[] = (data?.data ?? []).map((p: any) => ({
    id: p.id,
    employeeName: employeeMap.get(p.employeeId) || p.employeeId,
    month: p.month,
    year: p.year,
    totalDeductions: Number(p.totalDeductions),
    netSalary: Number(p.netSalary),
    baseSalary: Number(p.baseSalary ?? 0),
  }));

  const total = data?.meta?.total ?? 0;

  const columns: Column<Payroll>[] = [
    {
      header: "Employee",
      accessor: "employeeName",
      cell: (row) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.employeeName}
        </span>
      ),
    },
    {
      header: "Month",
      accessor: "month",
      cell: (row) => <span className="capitalize">{row.month}</span>,
    },
    {
      header: "Year",
      accessor: "year",
      cell: (row) => <span className="capitalize">{row.year}</span>,
      sortable: true,
    },
    {
      header: "Deductions",
      cell: (row) => (
        <span className="text-red-600 dark:text-red-400 font-medium">
          ₹ {row.totalDeductions.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Net Salary",
      accessor: "netSalary",
      sortable: true,
      cell: (row) => (
        <span className="text-green-600 dark:text-green-400 font-medium">
          ₹ {row.netSalary.toLocaleString("en-IN")}
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
            onClick={() => navigate(`/payrolls/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />

          <DeleteConfirm<number>
            title="Delete Employee"
            description={`Are you sure you want to delete ${row.employeeName} Salary? This action cannot be undone.`}
            loading={isPending}
            onConfirm={(id) => removePayroll(id)}
          >
            {(askDelete) => (
              <IconTrash
                size={18}
                onClick={() => askDelete(row.id)}
                className="cursor-pointer text-red-600 dark:text-red-400"
              />
            )}
          </DeleteConfirm>
        </div>
      ),
    },
  ];

  return (
    <Card
      action={
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select
              options={MONTHS}
              value={month ?? ""}
              onChange={(v) => {
                setMonth(v || undefined);
                setPage(1);
              }}
              placeholder="Select Month"
            />
          </div>
          <div className="w-32">
            <Select
              options={YEAR_OPTIONS}
              value={year?.toString() ?? ""}
              onChange={(v) => {
                setYear(v ? Number(v) : undefined);
                setPage(1);
              }}
              placeholder="Select Year"
            />
          </div>
          <Button
            onClick={() => navigate("/payrolls/new")}
            size="md"
            className="h-[42px] bg-black dark:bg-blue-500 whitespace-nowrap"
          >
            Add Payroll
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={payrolls}
        isLoading={isLoading}
        isError={isError}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </Card>
  );
}
