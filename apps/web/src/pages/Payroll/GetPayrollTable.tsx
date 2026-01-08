import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import DataTable from "../../components/tables/BasicTables/DataTable";

import { getEmployees, getPayrolls } from "../../api/get";
import { IconPlus } from "@tabler/icons-react";

export type Payroll = {
  id: string;
  employeeName: string;
  month: string;
  year: number;
  totalDeductions: number;
  netSalary: number;
};

export default function GetPayrollTable() {
  const navigate = useNavigate();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const employeeMap = new Map(
    employees.map((e: any) => [e.id, `${e.firstName} ${e.lastName}`])
  );

  const {
    data: rawData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payrolls"],
    queryFn: getPayrolls,
  });

  const data: Payroll[] = rawData.map((p: any) => ({
    id: p.id,
    employeeName: employeeMap.get(p.employeeId) || p.employeeId,
    month: p.month,
    year: p.year,
    totalDeductions: Number(p.totalDeductions),
    netSalary: Number(p.netSalary),
  }));

  const columns = [
    {
      header: "Employee",
      cell: (row: Payroll) => (
        <span className="font-medium">{row.employeeName}</span>
      ),
    },
    {
      header: "Month",
      cell: (row: Payroll) => row.month,
    },
    {
      header: "Year",
      cell: (row: Payroll) => row.year,
    },
    {
      header: "Deductions",
      cell: (row: Payroll) => (
        <span className="font-medium text-red-600 dark:text-red-400">
          ₹ {row.totalDeductions.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Net Salary",
      cell: (row: Payroll) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          ₹ {row.netSalary.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
        <button
          onClick={() => navigate("/payrolls/new")}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          <IconPlus size={18} />
          Add Salary Structure
        </button>
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
