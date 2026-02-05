import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Button from "../../components/ui/button/Button";

import { deleteEmployee } from "../../api/delete";
import { getEmployees, getPositions } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import Card from "../../components/common/ComponentCard";
import { useTableSort } from "../../components/tables/useTableSort";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  joiningDate: string;
  onboardingBuddy: string;
};

export default function EmployeePage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState<string | undefined>();
  const [rawSearch, setRawSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const { sortBy, sortOrder, handleSort } = useTableSort<Employee>();

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim() || undefined);
      setPage(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rawSearch]);

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => getPositions(),
  });

  const positionMap: Record<string, string> = {};
  if (Array.isArray(positions)) {
    positions.forEach((p: any) => {
      positionMap[p.id] = p.name;
    });
  }

  const { data, isLoading, isError, refetch } = useQuery<
    PaginatedResponse<any>
  >({
    queryKey: ["employees", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getEmployees({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeEmployee, isPending } = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Employee Deleted successfully");
      refetch();
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
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.firstName} {row.lastName}
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email",
      cell: (row) => (
        <div className="text-gray-500 dark:text-gray-400">{row.email}</div>
      ),
    },
    {
      header: "Position",
      cell: (row) => (
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          {row.position}
        </span>
      ),
    },
    {
      header: "Joining Date",
      accessor: "joiningDate",
      cell: (row) => row.joiningDate,
    },
    {
      header: "Onboarding Buddy",
      cell: (row) => row.onboardingBuddy,
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/employees/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />

          <DeleteConfirm<number>
            title="Delete Employee"
            description={`Are you sure you want to delete ${row.firstName}? This action cannot be undone.`}
            loading={isPending}
            onConfirm={(id) => removeEmployee(id)}
          >
            {(askDelete) => (
              <IconTrash
                size={18}
                onClick={() => askDelete(row.id)}
                className="cursor-pointer text-red-600 dark:text-red-400"
              />
            )}
          </DeleteConfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Employees" description="Manage your workforce" />
      <PageBreadcrumb pageTitle="Employees" />

      <Card
        action={
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <IconSearch size={18} stroke={2} />
              </div>
              <Input
                placeholder="Search here..."
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-10 pr-12"
              />
              {rawSearch && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRawSearch("");
                    setSearch(undefined);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full"
                >
                  ✕
                </Button>
              )}
            </div>

            <Button
              onClick={() => navigate("/employees/new")}
              size="md"
              className="bg-black dark:bg-blue-500 dark:hover:bg-brand-600 whitespace-nowrap"
            >
              Add Employee
            </Button>
          </div>
        }
      >
        {!isLoading && employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              No records found
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
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </Card>
    </>
  );
}
