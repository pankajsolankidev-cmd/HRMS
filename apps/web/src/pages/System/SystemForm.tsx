import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { getComponents, getSystemById } from "../../api/get";
import { addSystem } from "../../api/post";
import { updateSystem } from "../../api/put";
import type { PaginatedResponse } from "../../api/types";
import ComponentCard from "../../components/common/Card";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import Button from "../../components/ui/button/Button";

const systemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  componentIds: z.array(z.string()).min(1, "Select at least one component"),
});

type SystemFormData = z.infer<typeof systemSchema>;

export default function SystemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id && id !== "new");

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
      componentIds: [],
    },
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery<
    PaginatedResponse<any>
  >({
    queryKey: ["components-lookup"],
    queryFn: () =>
      getComponents({
        excludeAssigned: true,
      }),
  });
  const { data: systemData, isLoading: systemLoading } = useQuery({
    queryKey: ["system", id],
    queryFn: () => getSystemById(id!),
    enabled: isEditMode,
  });

  const componentOptions = React.useMemo(() => {
    const baseOptions = (componentsData?.data ?? []).map((c: any) => ({
      value: String(c.id),
      text: `${c.name} (${c.code})`,
    }));

    const newOption: { value: string; text: string }[] = (
      systemData?.components ?? []
    ).map((c: any) => ({
      value: String(c.id),
      text: `${c.name} (${c.code})`,
    }));

    const mergedOptions = [...baseOptions];

    newOption.forEach((assigned) => {
      const exists = mergedOptions.some((opt) => opt.value === assigned.value);
      if (!exists) {
        mergedOptions.push(assigned);
      }
    });
    return mergedOptions;
  }, [componentsData?.data, systemData]);
  const hasComponent = componentOptions.length > 0;

  useEffect(() => {
    if (systemData) {
      reset({
        name: systemData.name ?? "",
        description: systemData.description ?? "",
        componentIds:
          systemData.components?.map((c: any) => String(c.id)) ?? [],
      });
    }
  }, [systemData, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: SystemFormData) =>
      isEditMode ? updateSystem({ id: id!, payload }) : addSystem(payload),

    onSuccess: (res) => {
      toast.success(
        res?.message ??
          (isEditMode
            ? "System updated successfully"
            : "System added successfully"),
      );
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      navigate("/systems");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: SystemFormData) => {
    saveMutation.mutate(formData);
  };

  if (componentsLoading || (isEditMode && systemLoading)) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading system data...
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle={isEditMode ? "Edit System" : "Add System"} />

      <ComponentCard>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              required
              label="System Name"
              placeholder="Enter system name"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />

            <Controller
              name="componentIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Components"
                  options={componentOptions}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={
                    hasComponent
                      ? "Select components"
                      : "No components available"
                  }
                  required
                  error={!!errors.componentIds}
                  hint={errors.componentIds?.message}
                />
              )}
            />

            <div className="md:col-span-2">
              <Input
                label="Description"
                placeholder="Enter description"
                {...register("description")}
                error={!!errors.description}
                hint={errors.description?.message}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 dark:border-gray-700">
            <Button
              disabled={saveMutation.isPending}
              className="bg-black dark:bg-blue-500 text-white"
            >
              {saveMutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update"
                  : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/systems")}
            >
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
