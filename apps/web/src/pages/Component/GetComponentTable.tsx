import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DataTable from "../../components/tables/BasicTables/DataTable";
import { deleteComponent } from "../../api/delete";
import { getComponents } from "../../api/get";
import { useNavigate } from "react-router";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
    },
  });

  const columns = [
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
      cell: (row: Component) => (
        <div className="flex items-center gap-3">
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
    <DataTable
      columns={columns}
      data={components}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
