import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DataTable, { type Column } from "../../components/tables/BasicTables/DataTable";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";

import {
  getEmployees,
  getPayrolls,
  getPayrollsByMonthYear,
} from "../../api/get";

import { deletePayroll } from "../../api/delete";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import toast from "react-hot-toast";

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

  const [tempMonth, setTempMonth] = useState<string | undefined>();
  const [tempYear, setTempYear] = useState<number | undefined>();
  const [month, setMonth] = useState<string | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const isFilterApplied = Boolean(month && year);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const employeeMap = useMemo(
    () =>
      new Map(
        employees.map((e: any) => [e.id, `${e.firstName} ${e.lastName}`])
      ),
    [employees]
  );

  const {
    data: rawData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payrolls", month ?? "all", year ?? "all"],
    queryFn: () =>
      month && year ? getPayrollsByMonthYear(month, year) : getPayrolls(),
  });

  const data: Payroll[] = rawData.map((p: any) => ({
    id: p.id,
    employeeName: employeeMap.get(p.employeeId) || p.employeeId,
    month: p.month,
    year: p.year,
    totalDeductions: Number(p.totalDeductions),
    netSalary: Number(p.netSalary),
  }));

  const { mutate: remove } = useMutation({
    mutationFn: deletePayroll,
    onSuccess: () => {
      toast.success("Payroll deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
    onError: () => toast.error("Failed to delete payroll"),
  });

  const columns: Column<Payroll>[] = [
    { header: "Employee", cell: (r) => r.employeeName },
    { header: "Month", cell: (r) => r.month },
    { header: "Year", cell: (r) => r.year },
    {
      header: "Deductions",
      cell: (r) => `₹ ${r.totalDeductions.toLocaleString("en-IN")}`,
    },
    {
      header: "Net Salary",
      cell: (r) => `₹ ${r.netSalary.toLocaleString("en-IN")}`,
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
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
        data={data}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
