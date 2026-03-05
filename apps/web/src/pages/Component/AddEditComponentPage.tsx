import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";

import { getComponentById } from "../../api/get";
import { addComponent } from "../../api/post";
import { updateComponent } from "../../api/put";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

const componentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  code: z.string().trim().min(1, "Code is required"),
});

type ComponentFormData = z.infer<typeof componentSchema>;

export default function AddEditComponentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id && id !== "new");

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
    enabled: isEditMode,
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
      isEditMode
        ? updateComponent({ id: id!, payload })
        : addComponent(payload),

    onSuccess: (res) => {
      toast.success(
        res?.message ??
          (isEditMode
            ? "Component updated successfully"
            : "Component added successfully"),
      );
      navigate("/components");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: ComponentFormData) => {
    saveMutation.mutate(formData);
  };

  if (isEditMode && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading component...
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Component" : "Add Component"}
      />

      <ComponentCard>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              required
              label="Component Name"
              placeholder="Enter component name"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />

            <Input
              required
              label="Component Code"
              placeholder="Enter component code"
              {...register("code")}
              error={!!errors.code}
              hint={errors.code?.message}
            />

            <div className="md:col-span-2">
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
              onClick={() => navigate("/components")}
            >
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
