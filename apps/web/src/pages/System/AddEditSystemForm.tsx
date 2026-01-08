import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useEffect } from "react";

import Input from "../../components/form/input/InputField";
import { getSystemById } from "../../api/get";
import { updateSystem } from "../../api/put";
import { addSystem } from "../../api/post";
import { Controller } from "react-hook-form";
import MultiSelect from "../../components/form/MultiSelect";
import { getComponents } from "../../api/get";

const systemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  components: z.array(z.string()).min(1, "Select at least one component"),
});

type SystemFormData = z.infer<typeof systemSchema>;

export default function AddEditSystemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEdit = Boolean(id && id !== "new");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SystemFormData>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { data: componentsData = [] } = useQuery({
    queryKey: ["components"],
    queryFn: getComponents,
  });
  const componentOptions = componentsData.map((c: any) => ({
    value: c.id,
    text: c.name,
  }));

  const { data, isLoading } = useQuery({
    queryKey: ["system", id],
    queryFn: () => getSystemById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
  if (data) {
    reset({
      name: data.name,
      description: data.description,
      components: data.components?.map((c: any) => c.id) ?? [],
    });
  }
}, [data, reset]);


  const saveMutation = useMutation({
    mutationFn: (payload: SystemFormData) =>
      isEdit ? updateSystem({ id: id!, payload }) : addSystem(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });

      setTimeout(() => {
        navigate("/systems");
      }, 1200);
    },
  });

  const onSubmit = (formData: SystemFormData) => {
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading system...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {isEdit ? "Edit System" : "Add System"}
          </h2>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-lg bg-black px-4 py-2 text-white
                       dark:bg-white dark:text-black disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : isEdit ? "Update" : "Add"}
          </button>
        </div>

        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400">
            {isEdit
              ? "System updated successfully"
              : "System added successfully"}
          </p>
        )}

        {saveMutation.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Something went wrong. Please try again.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Input
              label="System Name"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />

            <Controller
              name="components"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <MultiSelect
                  label="Components"
                  options={componentOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select components"
                />
              )}
            />

            {errors.components && (
              <p className="text-sm text-red-600">
                {errors.components.message}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Description"
              {...register("description")}
              error={!!errors.description}
              hint={errors.description?.message}
            />
          </div>
        </div>
      </div>
    </form>
  );
}



