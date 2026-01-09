import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import DataTable, {
  type Column,
} from "../../components/tables/BasicTables/DataTable";
import { getSystems } from "../../api/get";
import { deleteSystem } from "../../api/delete";
import Chip from "../../components/common/Chip";
import toast from "react-hot-toast";

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: systems = [],
    isLoading,
    isError,
  } = useQuery<System[]>({
    queryKey: ["systems"],
    queryFn: getSystems,
  });

  const { mutate: removeSystem } = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => {
      toast.success(
        "System Deleted Successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
    onError:(error : any)=>{
      toast.error(
        error?.response?.data?.message || "An unexpected error occurred"
      );
    },
  });
  const columns: Column<System>[] = [
    {
      header: "Name",
      cell: (row: System) => <div className="font-medium">{row.name}</div>,
    },
    {
      header: "Description",
      cell: (row: System) => <div className="text-sm">{row.description}</div>,
    },
    {
      header: "Components",
      cell: (row: System) => (
        <div className="flex flex-wrap gap-2">
          {row.components && row.components.length > 0 ? (
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
      cell: (row: System) => (
        <div className="flex items-center justify-center gap-3">
          <IconEdit
            size={18}
            onClick={() => navigate(`/systems/${row.id}`)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />
          <IconTrash
            size={18}
            onClick={() => {
              if (confirm("Delete component?")) {
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
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={systems}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
