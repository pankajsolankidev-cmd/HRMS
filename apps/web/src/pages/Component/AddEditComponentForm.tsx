import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useEffect } from "react";

import Input from "../../components/form/input/InputField";
import { addComponent } from "../../api/post";
import { updateComponent } from "../../api/put";
import { getComponentById } from "../../api/get";

const componentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  code: z.string().min(1, "Code is required"),
});

type ComponentFormData = z.infer<typeof componentSchema>;

export default function AddEditComponentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: "",
      description: "",
      code: "",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["component", id],
    queryFn: () => getComponentById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        description: data.description,
        code: data.code,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: ComponentFormData) =>
      isEdit
        ? updateComponent({ id: id!, payload })
        : addComponent(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });

      setTimeout(() => {
        navigate("/components");
      }, 1200);
    },
  });

  const onSubmit = (formData: ComponentFormData) => {
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading component...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {isEdit ? "Edit Component" : "Add Component"}
          </h2>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
          >
            {saveMutation.isPending
              ? "Saving..."
              : isEdit
              ? "Update"
              : "Add"}
          </button>
        </div>

        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400">
            {isEdit
              ? "Component updated successfully"
              : "Component added successfully"}
          </p>
        )}

        {saveMutation.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Something went wrong. Please try again.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Component Name"
            {...register("name")}
            error={!!errors.name}
            hint={errors.name?.message}
          />

          <Input
            label="Component Code"
            {...register("code")}
            error={!!errors.code}
            hint={errors.code?.message}
          />

          <div className="md:col-span-2">
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
