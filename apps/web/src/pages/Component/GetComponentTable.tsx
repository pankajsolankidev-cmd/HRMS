import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { deleteComponent } from "../../api/delete";
import { getComponents } from "../../api/get";
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: components = [],
    isLoading,
    isError,
  } = useQuery<Component[]>({
    queryKey: ["components"],
    queryFn: getComponents,
  });

  const { mutate: removeComponent } = useMutation({
    mutationFn: deleteComponent,
    onSuccess: (res) => {
      toast.success(res?.message ?? "Component Deleted Successfully");
      queryClient.invalidateQueries({ queryKey: ["components"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again."
      );
    },
  });
  const columns: Column<Component>[] = [
    {
      header: "Name",
      cell: (row: Component) => (
        <div className="font-medium text-gray-800 dark:text-white/90">
          {row.name}
        </div>
      ),
    },
    {
      header: "Code",
      cell: (row: Component) => (
        <div className="text-gray-600 dark:text-gray-400">{row.code}</div>
      ),
    },
    {
      header: "Description",
      cell: (row: Component) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.description}
        </div>
      ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row: Component) => (
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
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={components}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
