import { deleteComponent } from "@/api/delete";
import { getComponents } from "@/api/get";
import type { PaginatedResponse } from "@/api/types";
import Card from "@/components/common/Card";
import DeleteConfirm from "@/components/common/DeleteConfirmModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import type { Column } from "@/components/tables/BasicTables/DataTable";
import DataTable from "@/components/tables/BasicTables/DataTable";
import { useTableSort } from "@/components/tables/useTableSort";
import Button from "@/components/ui/button/Button";
import { IconEdit, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

type Component = {
  id: number;
  name: string;
  description: string;
  code: string;
};

export default function ComponentTable() {
  const navigate = useNavigate();

  const [search, setSearch] = useState<string | undefined>();
  const [rawSearch, setRawSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { sortBy, sortOrder, handleSort } = useTableSort<Component>();

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
        <div className="text-gray-800 dark:text-white/90">{row.code}</div>
      ),
    },
    {
      header: "Description",
      cell: (row) => (
        <div className="text-sm text-gray-800 dark:text-white/90">
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
            {(onDelete) => (
              <IconTrash
                size={18}
                onClick={() => onDelete(row.id)}
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
        action={
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <div className="absolute left-3 top-3 text-gray-400">
                <IconSearch size={18} stroke={2} />
              </div>
              <Input
                placeholder="Search by name"
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
              onClick={() => navigate("/components/new")}
              size="md"
              className="h-[42px]"
            >
              Add Component
            </Button>
          </div>
        }
      >
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
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </Card>
    </>
  );
}
