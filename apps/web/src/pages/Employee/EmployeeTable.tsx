import { deleteEmployee } from "@/api/delete";
import { getEmployees } from "@/api/get";
import type { PaginatedResponse } from "@/api/types";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";
import DeleteConfirm from "@/components/common/DeleteConfirmModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Input from "@/components/form/input/InputField";
import type { Column } from "@/components/tables/BasicTables/DataTable";
import DataTable from "@/components/tables/BasicTables/DataTable";
import { useTableSort } from "@/components/tables/useTableSort";
import Button from "@/components/ui/button/Button";
import type { RootState } from "@/context";
import { IconEdit, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  joiningDate: string;
  department: string;
  manager: string;
  userId: string;
};

export default function EmployeeTable() {
  const { id } = useSelector((state: RootState) => state.auth);
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
      position: u.position?.name ?? "—",
      joiningDate: u.joiningDate,
      department: u.department?.name ?? "—",
      manager: u.manager ? `${u.manager.firstName} ${u.manager.lastName}` : "—",
      userId: u.userId,
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
        <Chip
          label={row.position}
          className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
        />
      ),
    },
    {
      header: "Joining Date",
      accessor: "joiningDate",
      cell: (row) => row.joiningDate,
    },
    {
      header: "Department",
      cell: (row) => row.department,
    },
    {
      header: "Manager",
      cell: (row) => row.manager,
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          {row.userId != id && row.position !== "ADMIN" && (
            <>
              <IconEdit
                size={18}
                onClick={() => navigate(`/employees/${row.id}`)}
                className="cursor-pointer text-blue-600 dark:text-blue-400"
              />

              <DeleteConfirm<number>
                title="Delete Employee"
                description={`Are you sure you want to delete ${row.firstName}?`}
                loading={isPending}
                onConfirm={(id) => removeEmployee(id)}
              >
                {(onDelete) => (
                  <IconTrash
                    size={18}
                    onClick={() => onDelete(row.id)}
                    className="cursor-pointer text-red-600 dark:text-red-400"
                  />
                )}
              </DeleteConfirm>
            </>
          )}
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
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <div className="absolute left-3 top-3 text-gray-400">
                <IconSearch size={18} stroke={2} />
              </div>
              <Input
                placeholder="Search by name, email..."
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-10 pr-10 h-[42px] focus-visible:ring-0"
              />
              {rawSearch && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setRawSearch("");
                    setSearch(undefined);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                >
                  <IconX size={16} />
                </Button>
              )}
            </div>

            <Button
              onClick={() => navigate("/employees/new")}
              size="md"
              className="h-[42px] bg-black dark:bg-blue-500 whitespace-nowrap"
            >
              Add Employee
            </Button>
          </div>
        }
      >
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
      </Card>
    </>
  );
}
