import {
  getEmployeePayrollHistory,
  getPayrollPreview,
  getPayrollSummary,
} from "@/api/get";
import { processBulkPayroll } from "@/api/post";
import Card from "@/components/common/Card";
import Checkbox from "@/components/form/input/Checkbox";
import Select from "@/components/form/Select";
import DataTable, {
  type Column,
} from "@/components/tables/BasicTables/DataTable";
import Button from "@/components/ui/button/Button";
import { IconEdit, IconHistory, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

export default function PayrollTable() {
  const queryClient = useQueryClient();
  const today = new Date();
  const previousDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonth = previousDate
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();

  const previousYear = previousDate.getFullYear();

  const CURRENT_YEAR = today.getFullYear();
  const START_YEAR = 2020;

  const YEAR_OPTIONS = Array.from(
    { length: CURRENT_YEAR - START_YEAR + 1 },
    (_, i) => {
      const year = CURRENT_YEAR - i;
      return { label: year.toString(), value: year.toString() };
    },
  );

  const [summaryMonth, setSummaryMonth] = useState(previousMonth);
  const [summaryYear, setSummaryYear] = useState<number | null>(previousYear);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);
  const [appliedYear, setAppliedYear] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [historyEmployee, setHistoryEmployee] = useState<any | null>(null);

  const { data: summaryData, isFetching } = useQuery({
    queryKey: ["payroll-summary", appliedMonth, appliedYear],
    queryFn: () => getPayrollSummary(appliedMonth!, appliedYear!),
    enabled: Boolean(appliedMonth && appliedYear),
  });
  const { data: bulkData } = useQuery({
    queryKey: ["bulk-payroll", previousMonth, previousYear],
    queryFn: () =>
      getPayrollPreview({
        month: previousMonth,
        year: previousYear,
      }),
    enabled: true,
  });
  useEffect(() => {
    if (bulkData?.data) {
      setEmployees(bulkData.data);
    }
  }, [bulkData]);
  useEffect(() => {
    if (editingEmployee) {
      setTimeout(() => setIsEditDrawerOpen(true), 10);
    } else {
      setIsEditDrawerOpen(false);
    }
  }, [editingEmployee]);

  const handleSummaryProcess = () => {
    if (!summaryMonth || !summaryYear) return;
    setAppliedMonth(summaryMonth);
    setAppliedYear(summaryYear);
  };

  const [formData, setFormData] = useState({
    bonus: "",
    bonusDescription: "",
    deduction: "",
    deductionReason: "",
  });
  const { data: historyData, isFetching: isHistoryLoading } = useQuery({
    queryKey: ["employee-payroll-history", historyEmployee?.employeeId],
    queryFn: () =>
      getEmployeePayrollHistory({ employeeId: historyEmployee?.employeeId }),
    enabled: !!historyEmployee,
  });

  const { mutate: submitBulk, isPending } = useMutation({
    mutationFn: processBulkPayroll,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Bulk processed successfully");
      queryClient.invalidateQueries({
        queryKey: ["bulk-payroll"],
      });
      setSelectedIds([]);
    },
    onError: (
      error: AxiosError<{ message?: string; employees?: string[] }>,
    ) => {
      const message = error?.response?.data?.message;
      const empNames = error?.response?.data?.employees;

      if (Array.isArray(empNames) && empNames.length > 0) {
        toast.error(`${message} [ ${empNames.join(", ")} ]`);
      } else {
        toast.error(message ?? "Something went wrong");
      }
    },
  });

  const handleSave = () => {
    if (!editingEmployee) return;

    const updated = employees.map((emp: any) =>
      emp.employeeId === editingEmployee.employeeId
        ? {
            ...emp,
            bonus: Number(formData.bonus),
            bonusDescription: formData.bonusDescription,
            deductions: Number(formData.deduction),
            deductionReason: formData.deductionReason,
            salaryNet:
              Number(emp.salaryNet || 0) -
              Number(emp.bonus || 0) +
              Number(formData.bonus || 0) +
              Number(emp.deductions || 0) -
              Number(formData.deduction || 0),
          }
        : emp,
    );

    setEmployees(updated);
    setEditingEmployee(null);
  };
  const selectableIds = employees
    .filter((emp) => !emp.isSalaryProcessed)
    .map((emp) => emp.employeeId);

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (historyEmployee) {
      setTimeout(() => setIsDrawerOpen(true), 10);
    } else {
      setIsDrawerOpen(false);
    }
  }, [historyEmployee]);

  const handleSummaryClear = () => {
    setSummaryMonth(previousMonth);
    setSummaryYear(previousYear);

    setAppliedMonth(null);
    setAppliedYear(null);
  };

  const columns: Column<any>[] = [
    {
      header: (
        <Checkbox
          checked={allSelected}
          onChange={(checked) => {
            if (checked) {
              setSelectedIds(selectableIds);
            } else {
              setSelectedIds([]);
            }
          }}
        />
      ),
      cell: (row) => {
        const id = row.employeeId;
        const disabled = row.isSalaryProcessed;

        return (
          <Checkbox
            checked={selectedIds.includes(id)}
            disabled={disabled}
            onChange={(checked) => {
              if (disabled) return;

              setSelectedIds((prev) =>
                checked ? [...prev, id] : prev.filter((i) => i !== id),
              );
            }}
          />
        );
      },
    },
    {
      header: "Employee",
      accessor: "firstName",
      cell: (row) => (
        <span
          className={`font-medium ${
            row.isSalaryProcessed ? "text-gray-400" : ""
          }`}
        >
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      header: "Tax",
      align: "right",
      accessor: "tax",
      cell: (row) => (
        <span className="font-medium  text-red-600 dark:text-red-400">
          {Number(row.tax)}
        </span>
      ),
    },
    {
      header: "Pf",
      align: "right",
      accessor: "pf",
      cell: (row) => (
        <span className="font-medium  text-red-600 dark:text-red-400">
          {Number(row.pf)}
        </span>
      ),
    },
    {
      header: "Bonus",
      align: "right",
      accessor: "bonus",
      cell: (row) => (
        <span className="font-medium  text-green-600 dark:text-green-400">
          {row.bonus ?? "-"}
        </span>
      ),
    },
    {
      header: "Deductions",
      align: "right",
      accessor: "deductions",
      cell: (row) => (
        <span className="font-medium  text-red-600 dark:text-red-400">
          {row.deductions ?? "-"}
        </span>
      ),
    },
    {
      header: "Net Salary",
      align: "right",
      accessor: "salaryNet",
      cell: (row) => (
        <span className="font-medium  text-green-600 dark:text-green-400">
          {row.salaryNet.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (row) => {
        const disabled = row.isSalaryProcessed;

        return (
          <div className="flex items-center gap-3">
            <IconEdit
              size={18}
              className={`${
                disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "cursor-pointer text-blue-600 hover:scale-110 transition"
              }`}
              onClick={() => {
                if (disabled) return;

                setEditingEmployee(row);
                setFormData({
                  bonus: row.bonus ?? "",
                  bonusDescription: row.bonusDescription ?? "",
                  deduction: row.deductions ?? "",
                  deductionReason: row.deductionReason ?? "",
                });
              }}
            />

            <IconHistory
              size={18}
              className="cursor-pointer text-purple-600 hover:scale-110 transition"
              onClick={() => setHistoryEmployee(row)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-end mb-6">
          <div className="flex items-end gap-3">
            <div className="w-40">
              <Select
                options={MONTHS}
                value={summaryMonth}
                onChange={setSummaryMonth}
              />
            </div>

            <div className="w-32">
              <Select
                options={YEAR_OPTIONS}
                value={summaryYear?.toString() ?? ""}
                onChange={(v) => setSummaryYear(v ? Number(v) : null)}
              />
            </div>

            <Button className="h-[44px]" onClick={handleSummaryProcess}>
              {isFetching ? "Processing..." : "Process Payroll"}
            </Button>
            <Button className="h-[44px]" onClick={handleSummaryClear}>
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            label="Employees"
            value={summaryData?.employeesProcessed ?? 0}
          />
          <SummaryCard
            label="Avg Salary"
            value={`₹ ${(summaryData?.avgSalary ?? 0).toLocaleString("en-IN")}`}
          />
          <SummaryCard
            label="Net Payroll"
            value={`₹ ${(summaryData?.netPayroll ?? 0).toLocaleString("en-IN")}`}
          />
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div />
          <p className="text-xl text-gray-500 font-medium">
            {previousMonth} - {previousYear}
          </p>
        </div>
        <DataTable
          columns={columns}
          data={employees}
          isLoading={false}
          isError={false}
          page={1}
          limit={employees.length}
          total={employees.length}
          onPageChange={() => {}}
          onLimitChange={() => {}}
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button className="bg-gray-500" onClick={() => setSelectedIds([])}>
            Cancel
          </Button>

          <Button
            className=" dark:bg-blue-500 bg-green-500"
            disabled={isPending || selectedIds.length === 0}
            onClick={() => {
              const adjustments = employees
                .filter((emp: any) => selectedIds.includes(emp.employeeId))
                .map((emp: any) => ({
                  employeeId: emp.employeeId,
                  bonus: Number(emp.bonus ?? 0),
                  bonusDescription: emp.bonusDescription ?? "",
                  deductions: Number(emp.deductions ?? 0),
                  deductionReason: emp.deductionReason ?? "",
                }));

              const payload: any = { adjustments };

              payload.month = previousMonth;
              payload.year = previousYear;

              submitBulk(payload);
            }}
          >
            {isPending ? "Processing..." : "Confirm & Process"}
          </Button>
        </div>
        {editingEmployee && (
          <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
            <div
              className={`w-[400px] bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isEditDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
            >
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  Edit {editingEmployee.firstName}'s payroll
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-sm">Bonus</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={formData.bonus}
                    onChange={(e) =>
                      setFormData({ ...formData, bonus: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Bonus Description</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={formData.bonusDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bonusDescription: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Deduction</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={formData.deduction}
                    onChange={(e) =>
                      setFormData({ ...formData, deduction: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Deduction Reason</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    value={formData.deductionReason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deductionReason: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="p-6 border-t flex justify-end gap-3">
                <Button
                  className="bg-gray-500"
                  onClick={() => setEditingEmployee(null)}
                >
                  Cancel
                </Button>

                <Button className="bg-green-600" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
        {historyEmployee && (
          <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
            <div
              className={`w-[900px] bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  Payroll History - {historyEmployee.firstName}{" "}
                  {historyEmployee.lastName}
                </h2>

                <Button size="icon" onClick={() => setHistoryEmployee(null)}>
                  <IconX />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isHistoryLoading ? (
                  <div className="text-center py-10 text-gray-500">
                    Loading payroll history...
                  </div>
                ) : (
                  <div className="border rounded-xl">
                    <table className="w-full text-sm table-fixed">
                      <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left">Month</th>
                          <th className="px-4 py-3 text-left">Year</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap w-[120px]">
                            Leave Deduction
                          </th>
                          <th className="px-4 py-3 text-left">Bonus</th>
                          <th className="px-4 py-3 text-left">Deduction</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap w-[130px]">
                            Deduction Reason
                          </th>
                          <th className="px-4 py-3 text-left whitespace-nowrap w-[130px]">
                            Bonus Description
                          </th>
                          <th className="px-4 py-3 text-left whitespace-nowrap w-[100px]">
                            Net Salary
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {historyData?.data?.length ? (
                          historyData.data.map((item: any, index: number) => {
                            const payroll = item.payroll;

                            return (
                              <tr
                                key={index}
                                className="border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                              >
                                <td className="px-4 py-3 font-medium">
                                  {payroll?.month ?? "-"}
                                </td>

                                <td className="px-4 py-3">
                                  {payroll?.year ?? "-"}
                                </td>

                                <td className="px-4 py-3  text-red-600 font-medium">
                                  ₹{" "}
                                  {Number(
                                    payroll?.leaveDeduction ?? 0,
                                  ).toLocaleString("en-IN")}
                                </td>

                                <td className="px-4 py-3  text-green-600 font-medium">
                                  ₹{" "}
                                  {Number(payroll?.bonus ?? 0).toLocaleString(
                                    "en-IN",
                                  )}
                                </td>

                                <td className="px-4 py-3  text-red-600 font-medium">
                                  ₹{" "}
                                  {Number(
                                    payroll?.deductions ?? 0,
                                  ).toLocaleString("en-IN")}
                                </td>

                                <td className="px-4 py-3 text-gray-600">
                                  {payroll?.deductionReason || "-"}
                                </td>

                                <td className="px-4 py-3 text-gray-600">
                                  {payroll?.bonusDescription || "-"}
                                </td>

                                <td className="px-4 py-3  font-semibold text-green-700">
                                  ₹{" "}
                                  {Number(
                                    payroll?.netSalary ?? 0,
                                  ).toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center py-8 text-gray-500"
                            >
                              No payroll history found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-6 border-t flex justify-end">
                <Button
                  className="bg-gray-500"
                  onClick={() => setHistoryEmployee(null)}
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border bg-gray-100 p-4 dark:bg-gray-900">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
