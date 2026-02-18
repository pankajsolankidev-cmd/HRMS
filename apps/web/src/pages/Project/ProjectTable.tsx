import { IconEdit } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProjects } from "../../api/get";
import { updateProject } from "../../api/put";
import type { PaginatedResponse } from "../../api/types";
import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { useTableSort } from "../../components/tables/useTableSort";
import Button from "../../components/ui/button/Button";

type Project = {
  id: number;
  name: string;
  clientName: string;
  startDate: string;
  expectedEndDate: string;
  status: "ACTIVE" | "COMPLETED";
};

export default function ProjectTable() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { sortBy, sortOrder, handleSort } = useTableSort<Project>();
  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);
  const { data, isLoading, isError } = useQuery<PaginatedResponse<Project>>({
    queryKey: ["projects", page, limit, sortBy, sortOrder],
    queryFn: () =>
      getProjects({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
      }),
    placeholderData: (prev) => prev,
  });
  const queryClient = useQueryClient();

  const { mutate: markCompleted, isPending } = useMutation({
    mutationFn: (id: number) =>
      updateProject({
        id: String(id),
        payload: { status: "COMPLETED" },
      }),

    onSuccess: () => {
      toast.success("Project marked as completed");

      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },

    onError: () => {
      toast.error("Failed to update project status");
    },
  });

  const projectData = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Project>[] = [
    {
      header: "Project Name",
      sortable: true,
      accessor: "name",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.name ?? "-"}
        </div>
      ),
    },
    {
      header: "Client Name",
      accessor: "clientName",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.clientName ?? "-"}
        </div>
      ),
    },
    {
      header: "Start Date",
      sortable: true,
      accessor: "startDate",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.startDate ?? "-"}
        </div>
      ),
    },
    {
      header: "Expected End Date",
      accessor: "expectedEndDate",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.expectedEndDate ?? "-"}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) =>
        row.status === "ACTIVE" && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => markCompleted(row.id)}
              disabled={isPending}
              className="bg-green-600 text-white px-3 py-1 rounded-full disabled:opacity-50"
            >
              Completed
            </button>
            <IconEdit
              size={18}
              onClick={() => navigate(`/projects/${row.id}`)}
              className="cursor-pointer text-blue-600 dark:text-blue-400"
            />
          </div>
        ),
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Projects" />

      <Card
        action={
          <div className="flex justify-end">
            <Button
              onClick={() => navigate("/projects/new")}
              size="md"
              className="bg-black dark:bg-blue-500 whitespace-nowrap"
            >
              Add Project
            </Button>
          </div>
        }
      >
        {isError ? (
          <div className="text-red-500 p-4">Failed to load project data.</div>
        ) : (
          <DataTable
            columns={columns}
            data={projectData}
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
