import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getEmployeePayrollHistory } from "../../api/get";
import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { useTableSort } from "../../components/tables/useTableSort";
import type { RootState } from "../../context";

type PayrollHistoryRow = {
  month: string;
  year: number;
  leaveDeduction: number;
  bonus: number;
  deductions: number;
  deductionReason?: string;
  bonusDescription?: string;
  netSalary: number;
};

export default function PayrollHistory() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { sortBy, sortOrder, handleSort } = useTableSort<PayrollHistoryRow>();

  const roles = useSelector((state: RootState) => state.auth.roles);
  const isEmployee = roles.includes("EMPLOYEE");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employee-payroll-history"],
    queryFn: () => getEmployeePayrollHistory(),
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
          deductionReason: payroll.deductionReason,
          bonusDescription: payroll.bonusDescription,
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
      accessor: "leaveDeduction",
      cell: (row) => (
        <span className="text-red-600">
          ₹ {row.leaveDeduction.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Bonus",
      accessor: "bonus",
      cell: (row) => (
        <span className="text-green-600">
          ₹ {row.bonus.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Deduction",
      accessor: "deductions",
      cell: (row) => (
        <span className="text-red-600">
          ₹ {row.deductions.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Net Salary",
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
      <PageMeta title="My Payroll History" description="Your salary records" />
      <PageBreadcrumb pageTitle="Payroll History" />

      <Card>
        <DataTable
          columns={columns}
          data={historyData}
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
    </>
  );
}
