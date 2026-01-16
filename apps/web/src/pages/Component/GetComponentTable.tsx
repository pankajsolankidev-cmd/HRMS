import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import { deleteComponent } from "../../api/delete";
import { getComponents } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";

type Component = {
  id: number;
  name: string;
  description: string;
  code: string;
};

export default function GetComponentTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortBy, setSortBy] = useState<keyof Component | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Component) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Component>>({
    queryKey: ["components", page, limit, sortBy, sortOrder],
    queryFn: () =>
      getComponents({
        page,
        limit,
        sortBy: sortBy as string | undefined,
        sortOrder,
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: removeComponent } = useMutation({
    mutationFn: deleteComponent,
    onSuccess: () => {
      toast.success("Component Deleted Successfully");
      queryClient.invalidateQueries({ queryKey: ["components"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    },
  });

  const components: Component[] = data?.data ?? [];
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
      sortable: true,
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
          <IconTrash
            size={18}
            onClick={() => {
              if (confirm("Delete component?")) {
                removeComponent(row.id);
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
        data={components}
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
