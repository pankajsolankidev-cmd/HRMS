import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useState } from "react";

import { getEmployees } from "../../api/get";
import { deleteEmployee } from "../../api/delete";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import type { PaginatedResponse } from "../../api/types";
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

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof Employee | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Employee) => {
    setSortBy(field);
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<any>>({
    queryKey: ["employees", page, limit, sortBy, sortOrder],
    queryFn: () =>
      getEmployees({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeEmployee } = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const employees: Employee[] =
    data?.data?.map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      position: u.position || "Employee",
      joiningDate: u.joiningDate,
      onboardingBuddy: u.onboardingBuddy ?? "HR Team",
    })) ?? [];

  const total = data?.meta?.total ?? 0;

  const columns: Column<Employee>[] = [
    {
      header: "Name",
      accessor: "firstName",
      sortable: true,
      cell: (emp) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {emp.firstName} {emp.lastName}
        </span>
      ),
    },
    {
      header: "Email",
      accessor: "email",
      cell: (emp) => (
        <span className="text-gray-500 dark:text-gray-400">{emp.email}</span>
      ),
    },
    {
      header: "Position",
      cell: (emp) => (
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          {emp.position}
        </span>
      ),
    },
    {
      header: "Joining Date",
      accessor: "joiningDate",
      cell: (emp) => emp.joiningDate,
    },
    {
      header: "Onboarding Buddy",
      cell: (emp) => emp.onboardingBuddy,
    },
    {
      header: "Action",
      align: "center",
      cell: (emp) => (
        <div className="flex justify-center gap-3">
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
          Add Employee
        </button>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        isError={isError}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <div className="flex items-center justify-between pt-4">
        <span className="text-sm text-gray-500">
          Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of{" "}
          {total}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
