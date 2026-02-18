import { IconEdit } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { useState } from "react";
import { getProjects } from "../../api/get";
import type { PaginatedResponse } from "../../api/types";
import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
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

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Project>>({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  const projectData = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Project>[] = [
    {
      header: "Project Name",
      accessor: "name",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.name}
        </div>
      ),
    },
    {
      header: "Client Name",
      accessor: "clientName",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.clientName}
        </div>
      ),
    },
    {
      header: "Start Date",
      accessor: "startDate",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.startDate}
        </div>
      ),
    },
    {
      header: "Expected End Date",
      accessor: "expectedEndDate",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.expectedEndDate}
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
              onClick={() => {
                alert(`Marking project "${row.name}" as completed.`);
              }}
              className=" bg-green-600 text-white px-3 py-1 rounded-full"
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
