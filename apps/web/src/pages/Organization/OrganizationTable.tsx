import type { CreateOrganizationDto } from "@shared/types";
import { IconEdit } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getOrganization } from "../../api/get";
import Card from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import Button from "../../components/ui/button/Button";

type OrganizationResponse = {
  id: string;
  name: string;
  workingStartTime: string;
  workingEndTime: string;
  weekOff: CreateOrganizationDto["weekOff"];
};

export default function OrganizationTable() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<OrganizationResponse>({
    queryKey: ["organization"],
    queryFn: getOrganization,
  });
  const organizationData = data ? [data] : [];

  const columns: Column<OrganizationResponse>[] = [
    {
      header: "Name",
      accessor: "name",
      cell: (row) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.name}
        </div>
      ),
    },
    {
      header: "Working Start",
      accessor: "workingStartTime",
      cell: (row) => (
        <div className="font-medium text-lg text-gray-600 dark:text-gray-400">
          {row.workingStartTime}
        </div>
      ),
    },
    {
      header: "Working End",
      accessor: "workingEndTime",
      cell: (row) => (
        <div className="font-medium text-lg text-gray-600 dark:text-gray-400">
          {row.workingEndTime}
        </div>
      ),
    },
    {
      header: "Week Off",
      cell: (row) => row.weekOff?.join(", ") ?? "-",
    },
    {
      header: "Actions",
      align: "center",
      cell: (row) => (
        <IconEdit
          size={18}
          className="cursor-pointer text-blue-600 hover:scale-110 transition"
          onClick={() => navigate(`/organization/${row.id}`)}
        />
      ),
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Organization" />

      <Card
        action={
          <div className="flex justify-end">
            <Button
              onClick={() => navigate("/organization/new")}
              size="md"
              className="bg-black dark:bg-blue-500  whitespace-nowrap"
            >
              Add Organization
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={organizationData}
          isLoading={isLoading}
          isError={isError}
        />
      </Card>
    </>
  );
}
