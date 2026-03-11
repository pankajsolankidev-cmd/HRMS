import { getDepartmentById } from "@/api/get";
import { addDepartment } from "@/api/post";
import { updateDepartment } from "@/api/put";
import Card from "@/components/common/Card";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Skeleton from "@/components/common/SkeletonForm";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import z from "zod";

const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required"),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export default function DepartmentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id && id !== "new");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartmentById(id!),
    enabled: isEditMode,
  });
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load Department data");
    }
  }, [isError]);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (data && isEditMode) {
      reset({
        name: data.name ?? "",
      });
    }
  }, [data, isEditMode, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      isEditMode ? updateDepartment(id!, payload) : addDepartment(payload),

    onSuccess: (res: { message?: string }) => {
      toast.success(
        res?.message ??
          (isEditMode
            ? "Department updated successfully"
            : "Department created successfully"),
      );
      navigate("/departments");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: DepartmentFormData) => {
    saveMutation.mutate(formData);
  };

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Department" : "Add Department"}
      />
      <Skeleton loading={isEditMode && isLoading}>
        <Card>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <Input
              required
              label="Department Name"
              placeholder="Enter department name"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />

            <div className="flex justify-end gap-3 pt-6 dark:border-gray-700">
              <Button disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : isEditMode
                    ? "Update"
                    : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/departments")}
              >
                Back
              </Button>
            </div>
          </form>
        </Card>
      </Skeleton>
    </>
  );
}
