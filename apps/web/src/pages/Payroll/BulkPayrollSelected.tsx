import { IconEdit } from "@tabler/icons-react";
import { useState } from "react";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Button from "../../components/ui/button/Button";

type Props = {
  employees: any[];
  onClear: () => void;

  onUpdate: (data: any[]) => void;
};

export default function BulkPayrollSelected({
  employees,
  onClear,
  onUpdate,
}: Props) {
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    bonus: "",
    bonusDescription: "",
    deduction: "",
    deductionReason: "",
  });
  const handleSave = () => {
    if (!editingEmployee) return;

    const updated = employees.map((emp) =>
      emp.id === editingEmployee.id
        ? {
            ...emp,
            bonus: Number(formData.bonus),
            bonusDescription: formData.bonusDescription,
            deductions: Number(formData.deduction),
            deductionReason: formData.deductionReason,
            netSalary:
              Number(emp.baseSalary ?? 0) +
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
        <span>₹ {Number(row.baseSalary ?? 0).toLocaleString("en-IN")}</span>
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
          ₹ {Number(row.netSalary ?? 0).toLocaleString("en-IN")}
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
        <Button className="bg-gray-500" onClick={onClear}>
          Cancel
        </Button>

        <Button
          className="bg-green-600"
          disabled={employees.some(
            (emp) => emp.bonus === undefined || emp.deductions === undefined,
          )}
          onClick={() => {
            console.log("Final API Payload", employees);
          }}
        >
          Confirm & Process
        </Button>
      </div>
    </div>
  );
}
