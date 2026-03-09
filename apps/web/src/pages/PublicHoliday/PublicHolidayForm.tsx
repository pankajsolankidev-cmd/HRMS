import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import { getPublicHolidayById } from "../../api/get";
import { addPublicHoliday } from "../../api/post";
import { updatePublicHoliday } from "../../api/put";
import ComponentCard from "../../components/common/Card";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DatePicker from "../../components/form/date-picker";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

const holidaySchema = z
  .object({
    title: z.string().trim().min(1, "Holiday title is required"),
    description: z.string().trim().optional(),
    fromDate: z.string().min(1, "From date is required"),
    toDate: z.string().min(1, "To date is required"),
  })
  .refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: "To date cannot be before from date",
    path: ["toDate"],
  });

type HolidayFormData = z.infer<typeof holidaySchema>;

export default function PublicHolidayForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id && id !== "new");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      title: "",
      fromDate: "",
      toDate: "",
      description: "",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["public-holiday", id],
    queryFn: () => getPublicHolidayById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (data && isEditMode) {
      reset({
        title: data.title ?? "",
        fromDate: data.fromDate ?? "",
        toDate: data.toDate ?? "",
        description: data.description ?? "",
      });
    }
  }, [data, isEditMode, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: HolidayFormData) =>
      isEditMode
        ? updatePublicHoliday(id!, payload)
        : addPublicHoliday(payload),

    onSuccess: (res: { message?: string }) => {
      toast.success(
        res?.message ??
          (isEditMode
            ? "Holiday updated successfully"
            : "Holiday created successfully"),
      );
      navigate("/holidays");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: HolidayFormData) => {
    saveMutation.mutate(formData);
  };

  if (isEditMode && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading holiday data...
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Holiday" : "Add Holiday"} />

      <ComponentCard>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Input
            required
            label="Holiday Title"
            placeholder="Enter holiday title"
            {...register("title")}
            error={!!errors.title}
            hint={errors.title?.message}
          />

          <Controller
            name="fromDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                placeholder="Select date"
                id="fromDate"
                label="From Date"
                required
                value={field.value ? new Date(field.value) : null}
                onChange={(dates) => {
                  field.onChange(
                    dates?.[0] ? dates[0].toLocaleDateString("en-CA") : "",
                  );
                }}
                error={!!errors.fromDate}
                hint={errors.fromDate?.message}
              />
            )}
          />

          <Controller
            name="toDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                placeholder="Select date"
                id="toDate"
                label="To Date"
                required
                value={field.value ? new Date(field.value) : null}
                onChange={(dates) => {
                  field.onChange(
                    dates?.[0] ? dates[0].toLocaleDateString("en-CA") : "",
                  );
                }}
                error={!!errors.toDate}
                hint={errors.toDate?.message}
              />
            )}
          />

          <Input
            label="Description"
            placeholder="Enter holiday description"
            {...register("description")}
            error={!!errors.description}
            hint={errors.description?.message}
          />

          {/* Buttons full width */}
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-6">
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
              onClick={() => navigate("/holidays")}
            >
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
