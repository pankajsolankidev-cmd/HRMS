import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable, { type Column } from "../../components/tables/BasicTables/DataTable";

import { getEmployees, getSalaryStructures } from "../../api/get";
import { deleteSalaryStructure } from "../../api/delete";
import toast from "react-hot-toast";

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
    onSuccess: () => {
      toast.success(
        "Salary Deleted Successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
    },
    onError:(error : any)=>{
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred"
      );
    },
  });

const columns: Column<SalaryStructure>[] = [
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
      align:"center",
      cell: (row: SalaryStructure) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/salary/${row.id}`)}
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
      

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
