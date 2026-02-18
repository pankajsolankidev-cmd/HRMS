import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import { deleteDepartment } from "../../api/delete";
import { getDepartments } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import Card from "../../components/common/ComponentCard";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
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
  const { data, isLoading, isError, refetch } = useQuery<
    PaginatedResponse<Department>
  >({
    queryKey: ["departments", page, limit],
    queryFn: () => getDepartments({ page, limit }),
    placeholderData: (prev) => prev,
  });
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
            description="Are you sure you want to delete this department? This action cannot be undone."
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
          <div className="flex justify-end">
            <Button
              onClick={() => navigate("/departments/new")}
              size="md"
              className="bg-black dark:bg-blue-500 dark:hover:bg-brand-600 whitespace-nowrap"
            >
              Add Department
            </Button>
          </div>
        }
      >
        {isError ? (
          <div className="text-red-500 p-4">
            Failed to load department data.
          </div>
        ) : (
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
        )}
      </Card>
    </>
  );
}
