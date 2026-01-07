import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "../../components/tables/BasicTables/DataTable";

import { getEmployees, getSalaryStructures } from "../../api/get";
import { deleteSalaryStructure } from "../../api/delete";

export type SalaryStructure = {
  id: string;
  employeeName: string;
  basicSalary: number;
  description?: string;
  appraisalDate?: string;
};

export default function GetSalaryTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    queryKey: ["salary-structures"],
    queryFn: getSalaryStructures,
  });

  const data: SalaryStructure[] = rawData.map((s: any) => ({
    id: s.id,
    employeeName: employeeMap.get(s.employeeId) || s.employeeId,
    basicSalary: Number(s.basicSalary),
    description: s.description,
    appraisalDate: s.appraisalDate ? s.appraisalDate.split("T")[0] : undefined,
  }));

  const { mutate: remove } = useMutation({
    mutationFn: deleteSalaryStructure,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] }),
  });

  const columns = [
    {
      header: "Employee",
      cell: (row: SalaryStructure) => (
        <span className="font-medium">{row.employeeName}</span>
      ),
    },
    {
      header: "Basic Salary",
      cell: (row: SalaryStructure) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          ₹ {row.basicSalary.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Description",
      cell: (row: SalaryStructure) => row.description || "-",
    },
    {
      header: "Appraisal Date",
      cell: (row: SalaryStructure) => row.appraisalDate || "-",
    },
    {
      header: "Action",
      cell: (row: SalaryStructure) => (
        <div className="flex justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/salary-structures/${row.id}`)}
            className="cursor-pointer text-blue-600"
          />
          <IconTrash
            size={18}
            onClick={() => {
              if (confirm("Delete salary structure?")) {
                remove(row.id);
              }
            }}
            className="cursor-pointer text-red-600"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/salary-structures/new")}
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
