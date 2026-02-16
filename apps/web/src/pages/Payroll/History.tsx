import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getEmployeePayrollHistory } from "../../api/get";
import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

export default function History() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employee-payroll-history"],
    queryFn: () => getEmployeePayrollHistory(),
  });

  const historyData = useMemo(() => {
    return (
      data?.data?.map((item: any) => {
        const payroll = item.payroll;

        return {
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

  const columns: Column<any>[] = [
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
      header: "Deduction Reason",
      cell: (row) => row.deductionReason || "—",
    },
    {
      header: "Bonus Description",
      cell: (row) => row.bonusDescription || "—",
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
          page={1}
          limit={historyData.length}
          total={data?.meta?.total ?? 0}
          onPageChange={() => {}}
          onLimitChange={() => {}}
        />
      </Card>
    </>
  );
}
