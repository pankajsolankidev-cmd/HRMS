import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import { deleteDepartment } from "../../api/delete";
import { getDepartments } from "../../api/get";
import Card from "../../components/common/Card";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Input from "../../components/form/input/InputField";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Button from "../../components/ui/button/Button";

type Department = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export default function DepartmentTable() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["departments", page, limit, search],
    queryFn: () => getDepartments({ page, limit, search }),
    placeholderData: (prev) => prev,
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim() || undefined);
      setPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const { mutate: removeDepartment, isPending } = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Department Deleted Successfully");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });
  const departmentData = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Department>[] = [
    {
      header: "Department Name",
      accessor: "name",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.name}
        </div>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/departments/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />

          <DeleteConfirm<number>
            title="Delete Department"
            description="Are you sure you want to delete this department?"
            loading={isPending}
            onConfirm={(id) => removeDepartment(id)}
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
      <PageBreadcrumb pageTitle="Departments" />

      <Card
        action={
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <div className="absolute left-3 top-3 text-gray-400">
                <IconSearch size={18} stroke={2} />
              </div>
              <Input
                placeholder="Search by department name"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-10 pr-10 h-[42px] focus-visible:ring-0"
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
              onClick={() => navigate("/departments/new")}
              size="md"
              className="h-[42px] bg-black dark:bg-blue-500 whitespace-nowrap"
            >
              Add Department
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={departmentData}
          isLoading={isLoading}
          isError={isError}
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
