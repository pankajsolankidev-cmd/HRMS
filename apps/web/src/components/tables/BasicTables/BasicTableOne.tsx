import { useEffect, useState } from "react";
import axios from "axios";
import { IconEdit, IconTrash } from "@tabler/icons-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  joiningDate: string;
  onboardingBuddy: string;
};

export default function BasicTableOne() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    axios
      .get("https://dummyjson.com/users?limit=10")
      .then((res) => {
        const users = res.data.users;

        const data = users.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          position: u.company?.title,
          joiningDate: "2024-01-15",
          onboardingBuddy: "HR Team",
        }));

        setEmployees(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <Table>
        {/* ---------- HEADER ---------- */}
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableCell className="px-6 py-4 text-sm font-semibold text-gray-700">
              Name
            </TableCell>
            <TableCell className="px-6 py-4 text-sm font-semibold text-gray-700">
              Email
            </TableCell>
            <TableCell className="px-6 py-4 text-sm font-semibold text-gray-700">
              Position
            </TableCell>
            <TableCell className="px-6 py-4 text-sm font-semibold text-gray-700">
              Joining Date
            </TableCell>
            <TableCell className="px-6 py-4 text-sm font-semibold text-gray-700">
              Onboarding Buddy
            </TableCell>
            <TableCell className="px-6 py-4 text-sm font-semibold text-gray-700">
              Action
            </TableCell>
          </TableRow>
        </TableHeader>

        {/* ---------- BODY ---------- */}
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              className="hover:bg-gray-50 transition-colors"
            >
              {/* Name */}
              <TableCell className="px-6 py-5">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {emp.firstName} {emp.lastName}
                  </span>
                </div>
              </TableCell>

              {/* Email */}
              <TableCell className="px-6 py-5">
                <span className="text-sm text-gray-700">{emp.email}</span>
              </TableCell>

              {/* Position */}
              <TableCell className="px-6 py-5">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {emp.position}
                </span>
              </TableCell>

              {/* Joining Date */}
              <TableCell className="px-6 py-5 text-sm text-gray-600">
                {emp.joiningDate}
              </TableCell>

              {/* Onboarding Buddy */}
              <TableCell className="px-6 py-5 text-sm text-gray-600">
                {emp.onboardingBuddy}
              </TableCell>

              {/* Action */}
              <TableCell className="px-6 py-5">
                <div className="flex justify-end gap-3">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <IconEdit size={18} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
