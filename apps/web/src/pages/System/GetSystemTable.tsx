import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import DataTable from "../../components/tables/BasicTables/DataTable";
import { getSystems } from "../../api/get";
import { deleteSystem } from "../../api/delete";
import Chip from "../../components/common/Chip";
import { useEffect } from "react";

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
  useEffect(()=>{
    console.log(systems)
  },[systems])
  const { mutate: removeSystem } = useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
  });

  const columns = [
    {
      header: "Name",
      cell: (row: System) => (
        <div className="font-medium text-center">{row.name}</div>
      ),
    },
    {
      header: "Description",
      cell: (row: System) => (
        <div className="text-sm text-center">{row.description}</div>
      ),
    },
    {
      header: "Components",
      cell: (row: System) => (
        <div className="flex flex-wrap justify-center gap-2">
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
      cell: (row: System) => (
        <div className="flex items-center gap-3 justify-center">
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
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/systems/new")}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white
                     dark:bg-white dark:text-black"
        >
          <IconPlus size={18} />
          Add System
        </button>
      </div>

      <DataTable
        columns={columns}
        data={systems}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
