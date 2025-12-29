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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <Table>
        {/* ---------- HEADER ---------- */}
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow className="bg-gray-50 dark:bg-white/[0.02]">
            <TableCell
              isHeader
              className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Name
            </TableCell>
            <TableCell
              isHeader
              className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Email
            </TableCell>
            <TableCell
              isHeader
              className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Position
            </TableCell>
            <TableCell
              isHeader
              className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Joining Date
            </TableCell>
            <TableCell
              isHeader
              className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Onboarding Buddy
            </TableCell>
            <TableCell
              isHeader
              className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Action
            </TableCell>
          </TableRow>
        </TableHeader>

        {/* ---------- BODY ---------- */}
        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              className="hover:bg-gray-50 transition-colors dark:hover:bg-white/[0.04]"
            >
              {/* Name */}
              <TableCell className="px-6 py-5">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emp.firstName} {emp.lastName}
                </span>
              </TableCell>

              {/* Email */}
              <TableCell className="px-6 py-5">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {emp.email}
                </span>
              </TableCell>

              {/* Position */}
              <TableCell className="px-6 py-5">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  {emp.position}
                </span>
              </TableCell>

              {/* Joining Date */}
              <TableCell className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                {emp.joiningDate}
              </TableCell>

              {/* Onboarding Buddy */}
              <TableCell className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                {emp.onboardingBuddy}
              </TableCell>

              {/* Action */}
              <TableCell className="px-6 py-5">
                <div className="flex justify-end gap-3">
                  <button
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit"
                  >
                    <IconEdit size={18} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
