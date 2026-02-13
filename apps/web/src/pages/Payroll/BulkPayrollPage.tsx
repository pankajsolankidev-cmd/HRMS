import { IconEdit } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import { getPayrollPreview, getPayrollSummary } from "../../api/get";
import { processBulkPayroll } from "../../api/post";

import Card from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Button from "../../components/ui/button/Button";

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

export default function BulkPayrollPage() {
  const navigate = useNavigate();

  const currentMonth = new Date()
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();

  const CURRENT_YEAR = new Date().getFullYear();
  const START_YEAR = 2020;

  const YEAR_OPTIONS = Array.from(
    { length: CURRENT_YEAR - START_YEAR + 1 },
    (_, i) => {
      const year = CURRENT_YEAR - i;
      return { label: year.toString(), value: year.toString() };
    },
  );

  const [summaryMonth, setSummaryMonth] = useState(currentMonth);
  const [summaryYear, setSummaryYear] = useState<number | null>(CURRENT_YEAR);

  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);
  const [appliedYear, setAppliedYear] = useState<number | null>(null);

  const { data: summaryData, isFetching } = useQuery({
    queryKey: ["payroll-summary", appliedMonth, appliedYear],
    queryFn: () => getPayrollSummary(appliedMonth!, appliedYear!),
    enabled: Boolean(appliedMonth && appliedYear),
  });
  const {
    data: bulkData,
    refetch: loadEmployees,
    isFetching: isLoadingEmployees,
  } = useQuery({
    queryKey: ["bulk-payroll"],
    queryFn: () => {
      if (!selectedMonth || !selectedYear) {
        throw new Error("Month and Year required");
      }

      return getPayrollPreview({
        month: selectedMonth,
        year: selectedYear,
      });
    },
    enabled: false,
  });
  useEffect(() => {
    if (bulkData?.data) {
      setEmployees(bulkData.data);
    }
  }, [bulkData]);

  const handleSummaryProcess = () => {
    if (!summaryMonth || !summaryYear) return;
    setAppliedMonth(summaryMonth);
    setAppliedYear(summaryYear);
  };

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const [selectedYear, setSelectedYear] = useState<number>();
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    bonus: "",
    bonusDescription: "",
    deduction: "",
    deductionReason: "",
  });

  const { mutate: submitBulk, isPending } = useMutation({
    mutationFn: processBulkPayroll,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Bulk processed successfully");
      navigate("/payrolls");
    },
    onError: (
      error: AxiosError<{ message?: string; employees?: string[] }>,
    ) => {
      const message = error?.response?.data?.message;
      const empNames = error?.response?.data?.employees;

      if (Array.isArray(empNames) && empNames.length > 0) {
        toast.error(`${message} - ${empNames.join(", ")}`);
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
          }
        : emp,
    );

    setEmployees(updated);
    setEditingEmployee(null);
  };

  const columns: Column<any>[] = [
    {
      header: "",
      cell: (row) => {
        const id = row.employeeId || row.payrolls?.employeeId || row.id;
        const disabled = row.isSalaryProcessed;

        return (
          <input
            type="checkbox"
            disabled={disabled}
            checked={selectedIds.includes(id)}
            onChange={() => {
              if (disabled) return;

              setSelectedIds((prev) =>
                prev.includes(id)
                  ? prev.filter((i) => i !== id)
                  : [...prev, id],
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
      header: "Bonus",
      accessor: "bonus",
      cell: (row) => <span className="font-medium">{row.bonus}</span>,
    },
    {
      header: "Deductions",
      accessor: "deductions",
      cell: (row) => <span className="font-medium">{row.deductions}</span>,
    },
    {
      header: "Action",
      cell: (row) => {
        const disabled = row.isSalaryProcessed;

        return (
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
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Payroll Summary">
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

            <Button
              size="md"
              variant="primary"
              className="bg-black dark:bg-blue-500"
              onClick={handleSummaryProcess}
            >
              {isFetching ? "Processing..." : "Process Payroll"}
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

      <Card
        title="Bulk Payroll Process"
        action={
          <div className="flex items-end gap-3">
            <div className="w-40">
              <Select
                options={MONTHS}
                value={selectedMonth ?? ""}
                onChange={(v) => setSelectedMonth(v || undefined)}
                placeholder="Month"
              />
            </div>

            <div className="w-32">
              <Select
                options={YEAR_OPTIONS}
                value={selectedYear?.toString() ?? ""}
                onChange={(v) => setSelectedYear(v ? Number(v) : undefined)}
                placeholder="Year"
              />
            </div>

            <Button
              className="bg-black"
              disabled={!selectedMonth || !selectedYear || isLoadingEmployees}
              onClick={() => loadEmployees()}
            >
              {isLoadingEmployees ? "Loading..." : "Load"}
            </Button>
          </div>
        }
      >
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
          <Button className="bg-gray-500" onClick={() => navigate("/payrolls")}>
            Cancel
          </Button>

          <Button
            className="bg-green-600"
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

              if (selectedMonth) payload.month = selectedMonth;
              if (selectedYear) payload.year = selectedYear;

              submitBulk(payload);
            }}
          >
            {isPending ? "Processing..." : "Confirm & Process"}
          </Button>
        </div>
        {editingEmployee && (
          <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
            <div className="w-[400px] bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  Edit {editingEmployee.firstName}
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
