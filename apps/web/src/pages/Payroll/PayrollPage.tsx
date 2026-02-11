import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import { deletePayroll } from "../../api/delete";
import { getPayrollPreview, getPayrolls } from "../../api/get";
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
  bonus: number;
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
export default function PayrollPage({
  setBulkEmployees,
}: {
  setBulkEmployees: (data: any[]) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [month, setMonth] = useState<string | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
  const { data: salaryData, isLoading: salaryLoading } = useQuery({
    queryKey: ["payroll-preview", month ?? "all", year ?? "all"],
    queryFn: () =>
      getPayrollPreview({
        month,
        year,
      }),
    enabled: bulkOpen && !!month && !!year,
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

  const payrolls: Payroll[] = (data?.data ?? []).map((item: any) => ({
    id: item.payrolls.id,
    employeeName: `${item.employees.firstName} ${item.employees.lastName}`,
    month: item.payrolls.month,
    year: item.payrolls.year,
    bonus: item.payrolls.bonus,
    totalDeductions: Number(item.payrolls.deductions ?? 0),
    netSalary: Number(item.payrolls.netSalary ?? 0),
    baseSalary: Number(item.payrolls.baseSalary ?? 0),
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
          {"   "}
          {row.bonus}
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
          <Button
            onClick={() => setBulkOpen(true)}
            size="md"
            className="h-[42px] bg-black dark:bg-blue-500 whitespace-nowrap"
          >
            Bulk Payroll process
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
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[800px] max-h-[75vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl flex flex-col">
            <div className="px-5 py-3 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold">Bulk Payroll Process</h2>
              <button
                onClick={() => setBulkOpen(false)}
                className="text-gray-500 hover:text-red-500 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 border-b flex gap-3">
              <div className="w-40">
                <Select
                  options={MONTHS}
                  value={month ?? ""}
                  onChange={(v) => {
                    setMonth(v || undefined);
                    setSelectedIds([]);
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
                    setSelectedIds([]);
                  }}
                  placeholder="Select Year"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {!month || !year ? (
                <p className="text-sm text-gray-500 text-center">
                  Please select month and year to preview payroll
                </p>
              ) : salaryLoading ? (
                <p className="text-sm text-gray-500 text-center">Loading...</p>
              ) : salaryData?.data?.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                  No employees found
                </p>
              ) : (
                salaryData?.data?.map((emp: any) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selectedIds.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, emp.id]);
                          } else {
                            setSelectedIds((prev) =>
                              prev.filter((id) => id !== emp.id),
                            );
                          }
                        }}
                      />

                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-3">
              <Button
                onClick={() => setBulkOpen(false)}
                className="bg-gray-500"
              >
                Back
              </Button>

              <Button
                onClick={() => {
                  const selectedEmployeesData =
                    salaryData?.data?.filter((emp: any) =>
                      selectedIds.includes(emp.id),
                    ) ?? [];

                  setBulkEmployees(selectedEmployeesData);
                  setBulkOpen(false);
                  setSelectedIds([]);
                }}
                className="bg-green-600"
              >
                Process
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
