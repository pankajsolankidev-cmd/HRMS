import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { deleteSystem } from "../../api/delete";
import { getSystems } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import Chip from "../../components/common/Chip";
import Card from "../../components/common/ComponentCard";
import DeleteConfirm from "../../components/common/DeleteConfirmModal";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { useTableSort } from "../../components/tables/useTableSort";
import Button from "../../components/ui/button/Button";

type SystemComponent = {
  id: string;
  name: string;
};

type System = {
  id: number;
  name: string;
  description: string;
  components: SystemComponent[];
};

export default function SystemPage() {
  const navigate = useNavigate();
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { sortBy, sortOrder, handleSort } = useTableSort<System>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim() || undefined);
      setPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);

  const { data, isLoading, isError, refetch } = useQuery<
    PaginatedResponse<System>
  >({
    queryKey: ["systems", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getSystems({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeSystem, isPending } = useMutation({
    mutationFn: deleteSystem,
    onSuccess: (res) => {
      toast.success(res?.message ?? "System Deleted Successfully");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const systems = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<System>[] = [
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
      header: "Description",
      cell: (row) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.description}
        </div>
      ),
    },
    {
      header: "Components",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.components?.length ? (
            row.components.map((c) => <Chip key={c.id} label={c.name} />)
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
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
            onClick={() => navigate(`/systems/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />

          <DeleteConfirm<number>
            title="Delete System"
            description="Are you sure you want to delete this system? This action cannot be undone."
            loading={isPending}
            onConfirm={(id) => removeSystem(id)}
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
      <PageMeta title="Systems" description="Manage your systems" />
      <PageBreadcrumb pageTitle="Systems" />

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
              onClick={() => navigate("/systems/new")}
              size="md"
              className="h-[42px] bg-black dark:bg-blue-500  whitespace-nowrap"
            >
              Add System
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={systems}
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
