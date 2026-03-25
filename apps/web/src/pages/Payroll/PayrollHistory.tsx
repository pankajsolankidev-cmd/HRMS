import { getEmployeePayrollHistory, getEmployees } from "@/api/get";
import Card from "@/components/common/Card";
import FilterCard from "@/components/common/FilterCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Select from "@/components/form/Select";
import DataTable, {
  type Column,
} from "@/components/tables/BasicTables/DataTable";
import Button from "@/components/ui/button/Button";
import type { RootState } from "@/context";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { MONTHS } from "./PayrollTable";

type PayrollHistoryRow = {
  firstName: string;
  lastName: string;
  month: string;
  year: number;
  leaveDeduction: number;
  bonus: number;
  deductions: number;
  netSalary: number;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const year = CURRENT_YEAR - i;
  return { label: year.toString(), value: year.toString() };
});

export default function PayrollHistory() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [month, setMonth] = useState<string | undefined>();
  const [year, setYear] = useState<string | undefined>();

  const roles = useSelector((state: RootState) => state.auth.roles);
  const isEmployee = roles.includes("EMPLOYEE");

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees(),
  });

  const employeeOptions =
    employeesData?.data?.map((emp: any) => ({
      label: `${emp.firstName} ${emp.lastName}`,
      value: emp.id,
    })) ?? [];

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "employee-payroll-history",
      employeeId ?? "all",
      month ?? "all",
      year ?? "all",
    ],
    queryFn: () =>
      getEmployeePayrollHistory({
        ...(employeeId && { employeeId }),
        ...(month && { month }),
        ...(year && { year }),
      }),
  });

  const historyData = useMemo(() => {
    return (
      data?.data?.map((item: any) => {
        const payroll = item.payroll;
        const employee = item.employee;

        return {
          firstName: employee.firstName,
          lastName: employee.lastName,
          month: payroll.month,
          year: payroll.year,
          leaveDeduction: Number(payroll.leaveDeduction ?? 0),
          bonus: Number(payroll.bonus ?? 0),
          deductions: Number(payroll.deductions ?? 0),
          netSalary: Number(payroll.netSalary ?? 0),
        };
      }) ?? []
    );
  }, [data]);

  const total = data?.meta?.total ?? 0;

  const columns: Column<PayrollHistoryRow>[] = [
    ...(!isEmployee
      ? [
          {
            header: "Name",
            cell: (row: any) => `${row.firstName} ${row.lastName}`,
          },
        ]
      : []),
    {
      header: "Month",
      accessor: "month",
      cell: (row) => row.month || "—",
    },
    {
      header: "Year",
      accessor: "year",
      cell: (row) => row.year || "—",
    },
    {
      header: "Leave Deduction",
      align: "right",
      accessor: "leaveDeduction",
      cell: (row) => (
        <span className="text-red-600">
          ₹ {row.leaveDeduction.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Bonus",
      align: "right",
      accessor: "bonus",
      cell: (row) => (
        <span className="text-green-600">
          ₹ {row.bonus.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Deduction",
      align: "right",
      accessor: "deductions",
      cell: (row) => (
        <span className="text-red-600">
          ₹ {row.deductions.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Net Salary",
      align: "right",
      accessor: "netSalary",
      cell: (row) => (
        <span className="font-semibold text-green-600">
          ₹ {row.netSalary.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Payroll History" description="Salary records" />
      <PageBreadcrumb pageTitle="Payroll History" />

      <Card className="mb-4" title="Filter">
        <FilterCard>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {!isEmployee && (
              <Select
                options={employeeOptions}
                placeholder="Select Employee"
                value={employeeId ?? ""}
                onChange={(val) => {
                  setEmployeeId(val || undefined);
                  setPage(1);
                }}
              />
            )}

            <Select
              options={MONTHS}
              placeholder="Select Month"
              value={month ?? ""}
              onChange={(val) => {
                setMonth(val || undefined);
                setPage(1);
              }}
            />

            <Select
              options={YEAR_OPTIONS}
              placeholder="Select Year"
              value={year ?? ""}
              onChange={(val) => {
                setYear(val || undefined);
                setPage(1);
              }}
            />

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEmployeeId(undefined);
                  setMonth(undefined);
                  setYear(undefined);
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </FilterCard>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={historyData}
          isLoading={isLoading}
          isError={isError}
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
    </>
  );
}
