import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";

import {
  getEmployees,
  getPayrolls,
  getPayrollsByMonthYear,
} from "../../api/get";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { deletePayroll } from "../../api/delete";

export type Payroll = {
  id: string;
  employeeName: string;
  month: string;
  year: number;
  totalDeductions: number;
  netSalary: number;
};

const MONTHS = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];
const MONTH_MAP = new Map(
  MONTHS.map((m) => [m.value, m.label])
);

export default function GetPayrollTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tempMonth, setTempMonth] = useState<number | undefined>();
  const [tempYear, setTempYear] = useState<number | undefined>();

  const [month, setMonth] = useState<number | undefined>();
  const [year, setYear] = useState<number | undefined>();

  const isFilterApplied = Boolean(month && year);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const employeeMap = useMemo(
    () =>
      new Map(
        employees.map((e: any) => [
          e.id,
          `${e.firstName} ${e.lastName}`,
        ])
      ),
    [employees]
  );

  const {
    data: rawData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payrolls", month ?? "all", year ?? "all"],
    queryFn: () => {
      if (month !== undefined && year !== undefined) {
        return getPayrollsByMonthYear(month, year);
      }
      return getPayrolls();
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: deletePayroll,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["payrolls"] }),
  });

  const data: Payroll[] = rawData.map((p: any) => ({
    id: p.id,
    employeeName: employeeMap.get(p.employeeId) || p.employeeId,
    month: p.month,
    year: p.year,
    totalDeductions: Number(p.totalDeductions),
    netSalary: Number(p.netSalary),
  }));

  const columns: Column<Payroll>[] = [
    {
      header: "Employee",
      cell: (row) => (
        <span className="font-medium">{row.employeeName}</span>
      ),
    },
    {
      header: "Month",
      cell: (row) => (
        <span className="font-medium">
          {MONTH_MAP.get(String(row.month)) ?? row.month}
        </span>
      ),
    },
    {
      header: "Year",
      cell: (row) => row.year,
    },
    {
      header: "Deductions",
      cell: (row) => (
        <span className="font-medium text-red-600 dark:text-red-400">
          ₹ {row.totalDeductions.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Net Salary",
      cell: (row) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
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
            className="cursor-pointer text-blue-600"
          />
          <IconTrash
            size={18}
            onClick={() => {
              if (confirm("Delete payroll?")) {
                remove(row.id);
              }
            }}
            className="cursor-pointer text-red-600"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
        <Select
          label="Month"
          options={MONTHS}
          value={tempMonth ? String(tempMonth) : ""}
          onChange={(v) =>
            setTempMonth(v ? Number(v) : undefined)
          }
        />

        <Input
          label="Year"
          type="number"
          placeholder="2026"
          value={tempYear ?? ""}
          onChange={(e) =>
            setTempYear(
              e.target.value ? Number(e.target.value) : undefined
            )
          }
        />

        <button
          type="button"
          disabled={!tempMonth || !tempYear}
          onClick={() => {
            setMonth(tempMonth);
            setYear(tempYear);
          }}
          className="rounded-lg bg-black px-4 py-2 text-white
                     disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Apply
        </button>

        {isFilterApplied && (
          <button
            type="button"
            onClick={() => {
              setTempMonth(undefined);
              setTempYear(undefined);
              setMonth(undefined);
              setYear(undefined);
            }}
            className="rounded-lg border px-4 py-2 text-sm
                       text-gray-700 hover:bg-gray-100
                       dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
