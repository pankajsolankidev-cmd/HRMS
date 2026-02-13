import { IconEdit } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { processBulkPayroll } from "../../api/post";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Button from "../../components/ui/button/Button";

type Props = {
  employees: any[];
  onUpdate: (data: any[]) => void;
  month: string;
  year: number;
};

export default function BulkPayrollSelected({
  employees,
  onUpdate,
  month,
  year,
}: Props) {
  const navigate = useNavigate();
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    bonus: "",
    bonusDescription: "",
    deduction: "",
    deductionReason: "",
  });
  const { mutate: submitBulk, isPending } = useMutation({
    mutationFn: processBulkPayroll,
    onSuccess: (res) => {
      toast.success(res.message ?? " successfully");
      navigate("/payrolls");
    },
    onError: (
      error: AxiosError<{ message?: string; employees?: string[] }>,
    ) => {
      const message = error?.response?.data?.message;
      const employees = error?.response?.data?.employees;

      if (employees && employees.length > 0) {
        toast.error(`${message}\n Name: ${employees.join(", ")}`);
      } else {
        toast.error(message ?? "An unexpected error occurred");
      }
    },
  });

  const handleSave = () => {
    if (!editingEmployee) return;

    const updated = employees.map((emp) =>
      emp.employeeId === editingEmployee.employeeId
        ? {
            ...emp,
            bonus: Number(formData.bonus),
            bonusDescription: formData.bonusDescription,
            deductions: Number(formData.deduction),
            deductionReason: formData.deductionReason,
            netSalary:
              Number(emp.baseSalary ?? emp.salaryNet ?? 0) +
              Number(formData.bonus) -
              Number(formData.deduction),
          }
        : emp,
    );

    onUpdate(updated);
    setEditingEmployee(null);
  };

  const columns: Column<any>[] = [
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
      header: "Base Salary",
      accessor: "baseSalary",
      cell: (row) => (
        <span>
          ₹{" "}
          {Number(row.baseSalary ?? row.salaryNet ?? 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Bonus",
      accessor: "bonus",
      cell: (row) => (
        <span>₹ {Number(row.bonus ?? 0).toLocaleString("en-IN")}</span>
      ),
    },
    {
      header: "Deductions",
      accessor: "deductions",
      cell: (row) => (
        <span className="text-red-600">
          ₹ {Number(row.deductions ?? 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Net Salary",
      accessor: "netSalary",
      cell: (row) => (
        <span className="text-green-600 font-semibold">
          ₹{" "}
          {Number(row.netSalary ?? row.salaryNet ?? 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex justify-center">
          <IconEdit
            size={18}
            className="cursor-pointer text-blue-600 hover:scale-110 transition"
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
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
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
          <div className="w-[400px] bg-white dark:bg-gray-900 h-full shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              Edit {editingEmployee.firstName}
            </h2>

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

            <div className="flex justify-end gap-3 pt-4">
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

      <div className="flex justify-end gap-3">
        <Button className="bg-gray-500" onClick={() => navigate("/payrolls")}>
          Cancel
        </Button>

        <Button
          className="bg-green-600"
          disabled={isPending}
          onClick={() => {
            const adjustments = employees.map((emp) => ({
              employeeId:
                emp.employeeId || emp.payrolls?.employeeId || emp.employees?.id,

              bonus: Number(emp.bonus ?? 0),
              bonusDescription: emp.bonusDescription ?? "",
              deductions: Number(emp.deductions ?? 0),
              deductionReason: emp.deductionReason ?? "",
            }));

            const payload = {
              month,
              year,
              adjustments,
            };

            submitBulk(payload);
          }}
        >
          {isPending ? "Processing..." : "Confirm & Process"}
        </Button>
      </div>
    </div>
  );
}
