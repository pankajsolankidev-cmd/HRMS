import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Input from "../../components/form/input/InputField";

import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

import { deleteComponent } from "../../api/delete";
import { getComponents } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";

import Card from "../../components/common/ComponentCard";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import { useTableSort } from "../../components/tables/useTableSort";
import Button from "../../components/ui/button/Button";

type Component = {
  id: number;
  name: string;
  description: string;
  code: string;
};

export default function ComponentPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState<string | undefined>();
  const [rawSearch, setRawSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { sortBy, sortOrder, handleSort } = useTableSort<Component>();

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder]);

  // debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim() || undefined);
      setPage(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rawSearch]);

  const { data, isLoading, isError, refetch } = useQuery<
    PaginatedResponse<Component>
  >({
    queryKey: ["components", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getComponents({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeComponent, isPending } = useMutation({
    mutationFn: deleteComponent,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Component Deleted Successfully");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const components = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Component>[] = [
    {
      header: "Name",
      accessor: "name",
      sortable: true,
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.name}
        </div>
      ),
    },
    {
      header: "Code",
      accessor: "code",
      cell: (row) => (
        <div className="text-gray-600 dark:text-gray-400">{row.code}</div>
      ),
    },
    {
      header: "Description",
      cell: (row) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.description}
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
            onClick={() => navigate(`/components/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />

          <DeleteConfirm<number>
            title="Delete Component"
            description="Are you sure you want to delete this component?"
            loading={isPending}
            onConfirm={(id) => removeComponent(id)}
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
      <PageBreadcrumb pageTitle="Components" />

      <Card
        middle={
          <div className="relative w-full sm:max-w-xs">
            <Input
              placeholder="Search here..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="pr-12"
            />

            {rawSearch && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRawSearch("");
                  setSearch(undefined);
                }}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  h-7 w-7 p-0 rounded-full
                "
              >
                ✕
              </Button>
            )}
          </div>
        }
        action={
          <Button
            onClick={() => navigate("/components/new")}
            size="md"
            className="bg-black hover:bg-black dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Add Component
          </Button>
        }
      >
        {!isLoading && components.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              No data found
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
            data={components}
            isLoading={isLoading}
            isError={isError}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        )}
      </Card>
    </>
  );
}
