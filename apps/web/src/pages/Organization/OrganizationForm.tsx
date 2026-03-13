import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import { getOrganization } from "../../api/get";
import { addOrganization } from "../../api/post";
import ComponentCard from "../../components/common/Card";
import DatePicker from "../../components/form/date-picker";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import Button from "../../components/ui/button/Button";

import type { CreateOrganizationDto } from "@shared/types";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const WEEK_DAYS: CreateOrganizationDto["weekOff"][number][] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const organizationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  workingHours: z.object({
    start: z.string().min(1, "Start time is required"),
    end: z.string().min(1, "End time is required"),
  }),
  weekOff: z
    .array(z.enum(WEEK_DAYS as [string, ...string[]]))
    .min(1, "Select at least one week off"),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function OrganizationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id && id !== "new");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      workingHours: {
        start: "",
        end: "",
      },
      weekOff: [],
    },
  });

  const { data: organizationData, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
    enabled: isEditMode,
  });

  useEffect(() => {
    if (organizationData && isEditMode) {
      reset({
        name: organizationData.name ?? "",
        workingHours: {
          start: organizationData.workingStartTime ?? "",
          end: organizationData.workingEndTime ?? "",
        },
        weekOff: organizationData.weekOff ?? [],
      });
    }
  }, [organizationData, isEditMode, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: CreateOrganizationDto) => addOrganization(payload),

    onSuccess: (res) => {
      toast.success(
        res?.message ??
          (isEditMode
            ? "Organization updated successfully"
            : "Organization created successfully"),
      );
      navigate("/organization");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: OrganizationFormData) => {
    saveMutation.mutate(formData as CreateOrganizationDto);
  };

  const weekDayOptions = WEEK_DAYS.map((day) => ({
    value: day,
    text: day,
  }));

  if (isEditMode && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading organization data...
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Organization" : "Add Organization"}
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
              label="Name"
              placeholder="Enter organization name"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />

            <Controller
              name="workingHours.start"
              control={control}
              render={({ field }) => (
                <DatePicker
                  placeholder="Office Start Time"
                  id="start-time"
                  mode="time"
                  label="Office Start Time"
                  value={field.value}
                  onChange={(_, dateStr) => field.onChange(dateStr)}
                  error={!!errors.workingHours?.start}
                  hint={errors.workingHours?.start?.message}
                  required
                />
              )}
            />

            <Controller
              name="workingHours.end"
              control={control}
              render={({ field }) => (
                <DatePicker
                  placeholder="Office End Time"
                  id="end-time"
                  mode="time"
                  label="Office End Time"
                  value={field.value}
                  onChange={(_, dateStr) => field.onChange(dateStr)}
                  error={!!errors.workingHours?.end}
                  hint={errors.workingHours?.end?.message}
                  required
                />
              )}
            />

            <Controller
              name="weekOff"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Week Off"
                  options={weekDayOptions}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Select week off days"
                  required
                  error={!!errors.weekOff}
                  hint={errors.weekOff?.message}
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
              onClick={() => navigate("/organization")}
            >
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
