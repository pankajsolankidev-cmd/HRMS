import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getEmployees } from "../../api/get";
import { deleteEmployee } from "../../api/delete";
import DataTable from "../../components/tables/BasicTables/DataTable";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  joiningDate: string;
  onboardingBuddy: string;
};

export default function GetEmpTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const { mutate: removeEmployee } = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const employees: Employee[] =
    data?.map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      position: u.position || "Employee",
      joiningDate: "2024-01-15",
      onboardingBuddy: "HR Team",
    })) ?? [];

  const columns = [
    {
      header: "Name",
      cell: (emp: Employee) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {emp.firstName} {emp.lastName}
        </span>
      ),
    },
    {
      header: "Email",
      cell: (emp: Employee) => (
        <span className="text-gray-500 dark:text-gray-400">{emp.email}</span>
      ),
    },
    {
      header: "Position",
      cell: (emp: Employee) => (
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          {emp.position}
        </span>
      ),
    },
    {
      header: "Joining Date",
      cell: (emp: Employee) => emp.joiningDate,
    },
    {
      header: "Onboarding Buddy",
      cell: (emp: Employee) => emp.onboardingBuddy,
    },
    {
      header: "Action",
      cell: (emp: Employee) => (
        <div className="flex gap-3 justify-center">
          <IconEdit
            size={20}
            onClick={() => navigate(`/employees/${emp.id}`)}
            className="cursor-pointer text-blue-600"
          />
          <IconTrash
            size={20}
            onClick={() => {
              if (confirm("Delete employee?")) {
                removeEmployee(emp.id);
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
          onClick={() => navigate("/employees/new")}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white
                     dark:bg-white dark:text-black"
        >
          <IconPlus size={18} />
          Add System
        </button>
      </div>
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
