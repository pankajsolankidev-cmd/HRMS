import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { deleteEmployee } from "../../api/delete";
import { getEmployees, getPositions } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import type { Column } from "../../components/tables/BasicTables/DataTable";
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

type Props = {
  search?: string;
};

export default function GetEmpTable({ search }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof Employee | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    undefined,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () =>
      getPositions({
        page: 1,
        limit: 100,
      }),
  });
  const positionMap: Record<string, string> = {};

  if (Array.isArray(positions)) {
    positions.forEach((p: any) => {
      positionMap[p.id] = p.name;
    });
  }

  const handleSort = (field: keyof Employee) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("asc");
      setPage(1);
      return;
    }

    if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortBy(undefined);
      setSortOrder(undefined);
    } else {
      setSortOrder("asc");
    }

    setPage(1);
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<any>>({
    queryKey: ["employees", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getEmployees({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeEmployee } = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Employee Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const employees: Employee[] =
    data?.data?.map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      position: positionMap[u.positionId] ?? "—",

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
            onClick={() =>
              confirm("Delete employee?") && removeEmployee(emp.id)
            }
            className="cursor-pointer text-red-600"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {!isLoading && employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            No matching employees found
          </p>
          {search && (
            <p className="mt-1 text-sm text-gray-500">
              No results matching{" "}
              <span className="font-medium">"{search}"</span>
            </p>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          isLoading={isLoading}
          isError={isError}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {employees.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)}{" "}
            of {total}
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
      )}
    </>
  );
}
