import { zodResolver } from "@hookform/resolvers/zod";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Input from "../../components/form/input/InputField";
import DataTable from "../../components/tables/BasicTables/DataTable";
import { updateComponent } from "../../api/put";
import { addComponent } from "../../api/post";
import { deleteComponent } from "../../api/delete";
import { getComponents } from "../../api/get";
import z from "zod";
import { useState } from "react";

export default function ComponentCrud() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  type Component = {
    id: number;
    name: string;
    description: string;
    code: string;
    createdAt?: string;
    updatedAt?: string;
  };

  const componentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    code: z.string().min(1, "Code is required"),
  });
  type ComponentFormData = z.infer<typeof componentSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
  });

  const {
    data: components = [],
    isLoading,
    isError,
  } = useQuery<Component[]>({
    queryKey: ["components"],
    queryFn: getComponents,
  });

  const saveMutation = useMutation({
    mutationFn: (data: ComponentFormData) =>
      editingId
        ? updateComponent({
            id: editingId,
            payload: data,
          })
        : addComponent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      reset();
      setEditingId(null);
    },
  });

  const { mutate: removeComponent } = useMutation({
    mutationFn: deleteComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
    },
  });

  const onSubmit = (data: ComponentFormData) => {
    saveMutation.mutate(data);
  };

  const handleEdit = (component: Component) => {
    setEditingId(String(component.id));
    reset({
      name: component.name,
      description: component.description,
      code: component.code,
    });
  };

  const columns = [
    {
      header: "Name",
      cell: (row: Component) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.name}
        </span>
      ),
    },
    {
      header: "Code",
      cell: (row: Component) => (
        <span className="text-gray-600 dark:text-gray-400">{row.code}</span>
      ),
    },
    {
      header: "Description",
      cell: (row: Component) => (
        <span className="text-gray-500 dark:text-gray-400">
          {row.description}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (row: Component) => (
        <div className="flex gap-3">
          <IconEdit
            size={20}
            onClick={() => handleEdit(row)}
            className="cursor-pointer text-blue-600 dark:text-blue-400"
          />
          <IconTrash
            size={20}
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
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {editingId ? "Edit Component" : "Add Component"}
            </h2>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
            >
              {editingId ? "Update" : "Add"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Component Name"
              placeholder="Enter component name"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />

            <Input
              label="Component Code"
              placeholder="COMP_CODE"
              {...register("code")}
              error={!!errors.code}
              hint={errors.code?.message}
            />

            <div className="md:col-span-2">
              <Input
                label="Description"
                placeholder="Component description"
                {...register("description")}
                error={!!errors.description}
                hint={errors.description?.message}
              />
            </div>
          </div>

          {editingId && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setEditingId(null);
                }}
                className="text-sm text-gray-600 hover:underline dark:text-gray-400"
              >
                Cancel editing
              </button>
            </div>
          )}
        </div>
      </form>

      <DataTable
        columns={columns}
        data={components}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
