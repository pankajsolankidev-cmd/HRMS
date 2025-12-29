import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "../../components/ui/table";
import { getEmployees } from "../../api/get";
import { deleteEmployee } from "../../api/delete";
import { useNavigate } from "react-router";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  joiningDate: string;
  onboardingBuddy: string;
};

export default function GetEmpDetail() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: removeEmployee } = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: () => {
      alert("Failed to delete employee");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      removeEmployee(id);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/employees/${id}`);
  };

  const employees: Employee[] =
    data?.map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      position: u.company?.title || "Employee",
      joiningDate: "2024-01-15",
      onboardingBuddy: "HR Team",
    })) ?? [];

  /* ---------- STATES ---------- */
  if (isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading employees...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400">
        Failed to fetch employee data
      </div>
    );
  }

  /* ---------- TABLE ---------- */
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* TABLE HEADER */}
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              {[
                "Name",
                "Email",
                "Position",
                "Joining Date",
                "Onboarding Buddy",
                "Action",
              ].map((head) => (
                <TableCell
                  key={head}
                  isHeader
                  className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* TABLE BODY */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {employees.map((emp) => (
              <TableRow
                key={emp.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <TableCell className="px-6 py-5 font-medium text-gray-800 dark:text-white/90">
                  {emp.firstName} {emp.lastName}
                </TableCell>

                <TableCell className="px-6 py-5 text-gray-500 dark:text-gray-400">
                  {emp.email}
                </TableCell>

                <TableCell className="px-6 py-5">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {emp.position}
                  </span>
                </TableCell>

                <TableCell className="px-6 py-5 text-gray-500 dark:text-gray-400">
                  {emp.joiningDate}
                </TableCell>

                <TableCell className="px-6 py-5 text-gray-500 dark:text-gray-400">
                  {emp.onboardingBuddy}
                </TableCell>

                <TableCell className="px-6 py-5">
                  <div className="flex items-center justify-start gap-3">
                    <IconEdit
                      size={20}
                      onClick={() => handleEdit(emp.id)}
                      className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    />
                    <IconTrash
                      size={20}
                      onClick={() => handleDelete(emp.id)}
                      className="cursor-pointer text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
