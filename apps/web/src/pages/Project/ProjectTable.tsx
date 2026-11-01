import { getProjects } from "@/api/get";
import { updateProject } from "@/api/put";
import type { PaginatedResponse } from "@/api/types";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import DataTable, {
  type Column,
} from "@/components/tables/BasicTables/DataTable";
import { useTableSort } from "@/components/tables/useTableSort";
import Button from "@/components/ui/button/Button";
import {
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconSearch,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

type Project = {
  id: string;
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState<string | undefined>();
  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);
  const { data, isLoading, refetch, isError } = useQuery<
    PaginatedResponse<Project>
  >({
    queryKey: ["projects", page, limit, sortBy, sortOrder, search ?? "all"],
    queryFn: () =>
      getProjects({
        page,
        limit,
        search,
        ...(sortBy && sortOrder ? { sortBy: sortBy as string, sortOrder } : {}),
      }),
    placeholderData: (prev) => prev,
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim() || undefined);
      setPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const { mutate: markCompleted } = useMutation({
    mutationFn: (id: string) =>
      updateProject({
        id,
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
      align: "center",
      cell: (row) => (
        <Chip
          label={row.status}
          className={
            row.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }
        />
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
          <button
            onClick={() =>
              setActiveDropdown(activeDropdown === row.id ? null : row.id)
            }
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconDotsVertical size={20} className="text-gray-500" />
          </button>

          {activeDropdown === row.id && (
            <div className="absolute right-0 top-8 z-[100] w-44 rounded-lg border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              {row.status === "ACTIVE" && (
                <>
                  <button
                    onClick={() => {
                      markCompleted(row.id);
                      setActiveDropdown(null);
                    }}
                    className=" flex w-full items-center gap-2 px-4 py-2 text-sm  hover:bg-gray-100 dark:hover:bg-gray-900/60"
                  >
                    <IconCheck size={16} />
                    Mark Completed
                  </button>

                  <button
                    onClick={() => {
                      navigate(`/projects/${row.id}`);
                      setActiveDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
                  >
                    <IconEdit size={16} />
                    Edit
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  navigate(`/projects/${row.id}/employees`, {
                    state: { status: row.status },
                  });
                  setActiveDropdown(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900/60"
              >
                <IconUser size={16} />
                {row.status === "ACTIVE" ? "Assign Team" : "View Team"}
              </button>
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
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <div className="absolute left-3 top-3 text-gray-400">
                <IconSearch size={18} stroke={2} />
              </div>
              <Input
                placeholder="Search by project name"
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
            <Button onClick={() => navigate("/projects/new")} size="md">
              Add Projects
            </Button>
          </div>
        }
      >
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
      </Card>
    </>
  );
}
