import { IconEdit } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router";

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
  const location = useLocation();
  const navigate = useNavigate();

  const {
    employees: initialEmployees = [],
    month: initialMonth,
    year: initialYear,
  } = location.state || {};

  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    bonus: "",
    bonusDescription: "",
    deduction: "",
    deductionReason: "",
  });

  const START_YEAR = 2020;
  const CURRENT_YEAR = new Date().getFullYear();

  const YEAR_OPTIONS = Array.from(
    { length: CURRENT_YEAR - START_YEAR + 1 },
    (_, i) => {
      const year = CURRENT_YEAR - i;
      return { label: year.toString(), value: year.toString() };
    },
  );

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
        const id =
          row.employeeId || row.payrolls?.employeeId || row.employees?.id;

        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(id)}
            onChange={() => {
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
        <span className="font-medium">
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
      cell: (row) => <span className="font-medium">{row.deduction}</span>,
    },
    {
      header: "Action",
      cell: (row) => (
        <IconEdit
          size={18}
          className="cursor-pointer text-blue-600"
          onClick={() => {
            setEditingEmployee(row);
            setFormData({
              bonus: row.bonus ?? "",
              bonusDescription: row.bonusDescription ?? "",
              deduction: row.deductions ?? "",
              deductionReason: row.deductionReason ?? "",
            });
          }}
        />
      ),
    },
  ];

  return (
    <Card
      title="Bulk Payroll Process"
      action={
        <div className="flex gap-3">
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

      {editingEmployee && (
        <div className="fixed inset-0 bg-black/30 flex justify-end z-50">
          <div className="w-[400px] bg-white h-full p-6 space-y-4">
            <h2>Edit {editingEmployee.firstName}</h2>

            <input
              type="number"
              placeholder="Bonus"
              value={formData.bonus}
              onChange={(e) =>
                setFormData({ ...formData, bonus: e.target.value })
              }
              className="w-full border p-2"
            />

            <input
              type="number"
              placeholder="Deduction"
              value={formData.deduction}
              onChange={(e) =>
                setFormData({ ...formData, deduction: e.target.value })
              }
              className="w-full border p-2"
            />

            <div className="flex justify-end gap-3">
              <Button onClick={() => setEditingEmployee(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button onClick={() => navigate("/payrolls")}>Cancel</Button>

        <Button
          disabled={isPending || selectedIds.length === 0}
          onClick={() => {
            const adjustments = employees
              .filter((emp: any) => {
                const id =
                  emp.employeeId ||
                  emp.payrolls?.employeeId ||
                  emp.employees?.id;

                return selectedIds.includes(id);
              })
              .map((emp: any) => ({
                employeeId:
                  emp.employeeId ||
                  emp.payrolls?.employeeId ||
                  emp.employees?.id,
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
    </Card>
  );
}
