import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useState } from "react";
import toast from "react-hot-toast";

import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { getSystems } from "../../api/get";
import { deleteSystem } from "../../api/delete";
import Chip from "../../components/common/Chip";
import type { PaginatedResponse } from "../../api/types";

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

export default function GetSystemTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof System | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof System) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<System>>({
    queryKey: ["systems", page, limit, sortBy, sortOrder],
    queryFn: () =>
      getSystems({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeSystem } = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => {
      toast.success("System Deleted Successfully");
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred"
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
      cell: (row) => <div className="font-medium">{row.name}</div>,
    },
    {
      header: "Description",
      cell: (row) => <div className="text-sm">{row.description}</div>,
    },
    {
      header: "Components",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.components?.length ? (
            row.components.map((component) => (
              <Chip key={component.id} label={component.name} />
            ))
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
            onClick={() => {
              if (confirm("Delete system?")) {
                removeSystem(row.id);
              }
            }}
            className="cursor-pointer text-red-600 dark:text-red-400"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={systems}
        isLoading={isLoading}
        isError={isError}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <div className="mt-4 flex items-center justify-between">
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
    </>
  );
}
