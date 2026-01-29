import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import type { AxiosError } from "axios";
import { deleteSystem } from "../../api/delete";
import { getSystems } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import Chip from "../../components/common/Chip";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

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

type Props = {
  search?: string;
};

export default function GetSystemTable({ search }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof System | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    undefined,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSort = (field: keyof System) => {
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

  const { data, isLoading, isError } = useQuery<PaginatedResponse<System>>({
    queryKey: ["systems", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getSystems({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeSystem } = useMutation({
    mutationFn: deleteSystem,
    onSuccess: (res) => {
      toast.success(res?.message ?? "System Deleted Successfully");
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const systems: System[] = data?.data ?? [];
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
        <div className="text-sm text-gray-600 dark:text-gray-400">
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
          <IconTrash
            size={18}
            onClick={() => confirm("Delete system?") && removeSystem(row.id)}
            className="cursor-pointer text-red-600 dark:text-red-400"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {!isLoading && systems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            No systems found
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
          data={systems}
          isLoading={isLoading}
          isError={isError}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {systems.length > 0 && (
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
