import { getProjectById } from "@/api/get";
import { addProject } from "@/api/post";
import { updateProject } from "@/api/put";
import ComponentCard from "@/components/common/Card";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Skeleton from "@/components/common/SkeletonForm";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required"),
    clientName: z.string().trim().min(1, "Client name is required"),
    startDate: z.string().min(1, "Start date is required"),
    expectedEndDate: z.string().min(1, "Expected end date is required"),
  })
  .superRefine((data, ctx) => {
    if (
      data.startDate &&
      data.expectedEndDate &&
      new Date(data.expectedEndDate) <= new Date(data.startDate)
    ) {
      ctx.addIssue({
        path: ["expectedEndDate"],
        message: "Expected end date must be after start date",
        code: "custom",
      });
    }
  });

type ProjectFormData = z.infer<typeof projectSchema>;

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== "new");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      clientName: "",
      startDate: "",
      expectedEndDate: "",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (data && isEditMode) {
      reset({
        name: data.name ?? "",
        clientName: data.clientName ?? "",
        startDate: data.startDate ?? "",
        expectedEndDate: data.expectedEndDate ?? "",
      });
    }
  }, [data, isEditMode, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: ProjectFormData) =>
      isEditMode ? updateProject({ id: id!, payload }) : addProject(payload),

    onSuccess: (res: { message?: string }) => {
      toast.success(
        res?.message ??
          (isEditMode
            ? "Project updated successfully"
            : "Project created successfully"),
      );
      navigate("/projects");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: ProjectFormData) => {
    saveMutation.mutate(formData);
  };

  return (
    <>
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Project" : "Add Project"} />
      <Skeleton loading={isEditMode && isLoading}>
        <ComponentCard>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                required
                label="Project Name"
                placeholder="Enter project name"
                {...register("name")}
                error={!!errors.name}
                hint={errors.name?.message}
              />

              <Input
                required
                label="Client Name"
                placeholder="Enter client name"
                {...register("clientName")}
                error={!!errors.clientName}
                hint={errors.clientName?.message}
              />

              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="start-date"
                    label="Start Date"
                    placeholder="Select start date"
                    value={field.value}
                    onChange={(_, dateStr) => field.onChange(dateStr)}
                    error={!!errors.startDate}
                    hint={errors.startDate?.message}
                    required
                  />
                )}
              />

              <Controller
                name="expectedEndDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="end-date"
                    label="Expected End Date"
                    placeholder="Select expected end date"
                    value={field.value}
                    onChange={(_, dateStr) => field.onChange(dateStr)}
                    error={!!errors.expectedEndDate}
                    hint={errors.expectedEndDate?.message}
                    required
                  />
                )}
              />
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
                onClick={() => navigate("/projects")}
              >
                Back
              </Button>
            </div>
          </form>
        </ComponentCard>
      </Skeleton>
    </>
  );
}
