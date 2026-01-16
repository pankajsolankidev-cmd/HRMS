import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import { getComponents, getSystemById } from "../../api/get";
import { addSystem } from "../../api/post";
import { updateSystem } from "../../api/put";

import type { PaginatedResponse } from "../../api/types";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";

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
      components: [],
    },
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery<
    PaginatedResponse<any>
  >({
    queryKey: ["components"],
    queryFn: () =>
      getComponents({
        page: 1,
        limit: 100,
      }),
  });

  const componentList = componentsData?.data ?? [];

  const componentOptions = componentList.map((c: any) => ({
    value: String(c.id),
    text: c.name,
  }));

  const { data: systemData, isLoading: systemLoading } = useQuery({
    queryKey: ["system", id],
    queryFn: () => getSystemById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (systemData) {
      reset({
        name: systemData.name ?? "",
        description: systemData.description ?? "",
        components: systemData.components?.map((c: any) => String(c.id)) ?? [],
      });
    }
  }, [systemData, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: SystemFormData) =>
      isEdit ? updateSystem({ id: id!, payload }) : addSystem(payload),

    onSuccess: () => {
      toast.success(
        isEdit ? "System updated successfully" : "System added successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      navigate("/systems");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    },
  });

  const onSubmit = (formData: SystemFormData) => {
    saveMutation.mutate(formData);
  };

  if (componentsLoading || (isEdit && systemLoading)) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 text-gray-900 dark:text-gray-100"
    >
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Input
              required
              label="System Name"
              placeholder="Enter system name"
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
                  value={field.value ?? []}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Select components"
                  required
                  error={!!errors.components}
                  hint={errors.components?.message}
                />
              )}
            />
          </div>

          <div>
            <Input
              required
              label="Description"
              placeholder="Enter description"
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
