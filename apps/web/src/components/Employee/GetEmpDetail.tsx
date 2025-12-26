import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "../ui/table";
import { getEmployees } from "../../api/get";

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

  if (isLoading) {
    return <div className="p-6">Loading employees...</div>;
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600">
        Failed to fetch employee data
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableCell className="px-6 py-4 font-semibold">
              Name
            </TableCell>
            <TableCell className="px-6 py-4 font-semibold">
              Email
            </TableCell>
            <TableCell className="px-6 py-4 font-semibold">
              Position
            </TableCell>
            <TableCell className="px-6 py-4 font-semibold">
              Joining Date
            </TableCell>
            <TableCell className="px-6 py-4 font-semibold">
              Onboarding Buddy
            </TableCell>
            <TableCell className="px-6 py-4 font-semibold">
              Action
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {employees.map((emp) => (
            <TableRow key={emp.id} className="hover:bg-gray-50">
              <TableCell className="px-6 py-5 font-medium">
                {emp.firstName} {emp.lastName}
              </TableCell>

              <TableCell className="px-6 py-5">
                {emp.email}
              </TableCell>

              <TableCell className="px-6 py-5">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {emp.position}
                </span>
              </TableCell>

              <TableCell className="px-6 py-5">
                {emp.joiningDate}
              </TableCell>

              <TableCell className="px-6 py-5">
                {emp.onboardingBuddy}
              </TableCell>

              <TableCell className="px-6 py-5">
                <div className="flex justify-end gap-3">
                  <IconEdit
                    size={18}
                    className="cursor-pointer text-blue-600 hover:text-blue-800"
                  />
                  <IconTrash
                    size={18}
                    className="cursor-pointer text-red-600 hover:text-red-800"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
