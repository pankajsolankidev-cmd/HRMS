import {
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconUser,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import type { AxiosError } from "axios";
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
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);
  const { data, isLoading, refetch, isError } = useQuery<
    PaginatedResponse<Project>
  >({
    queryKey: ["projects", page, limit, sortBy, sortOrder ?? "all"],
    queryFn: () =>
      getProjects({
        page,
        limit,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const { mutate: markCompleted } = useMutation({
    mutationFn: (id: number) =>
      updateProject({
        id: String(id),
        payload: { status: "COMPLETED" },
      }),
    onSuccess: (res) => {
      toast.success(res?.message ?? "Project marked as completed");
      refetch();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred",
      );
    },
  });

  const projectData = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Project>[] = [
    {
      header: "Project Name",
      accessor: "name",
      sortable: true,
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
      accessor: "startDate",
      sortable: true,
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
      cell: (row) => (
        <div
          className="relative flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            onClick={() =>
              setActiveDropdown(activeDropdown === row.id ? null : row.id)
            }
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconDotsVertical size={20} className="text-gray-500" />
          </Button>

          {activeDropdown === row.id && (
            <div className="absolute right-0 top-8 z-[100] w-44 rounded-lg border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              {row.status === "ACTIVE" && (
                <>
                  <Button
                    onClick={() => {
                      markCompleted(row.id);
                      setActiveDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                  >
                    <IconCheck size={16} />
                    Mark Completed
                  </Button>

                  <Button
                    onClick={() => {
                      navigate(`/projects/${row.id}`);
                      setActiveDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                  >
                    <IconEdit size={16} />
                    Edit
                  </Button>
                </>
              )}

              <Button
                onClick={() => {
                  navigate(`/projects/${row.id}/employees`);
                  setActiveDropdown(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
              >
                <IconUser size={16} />
                {row.status === "ACTIVE" ? "Assign Team" : "View Team"}
              </Button>
            </div>
          )}
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
