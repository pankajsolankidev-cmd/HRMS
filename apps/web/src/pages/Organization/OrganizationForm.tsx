import { getOrganization } from "@/api/get";
import { addOrganization } from "@/api/post";
import ComponentCard from "@/components/common/Card";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Skeleton from "@/components/common/SkeletonForm";
import Input from "@/components/form/input/InputField";
import MultiSelect from "@/components/form/MultiSelect";
import Button from "@/components/ui/button/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocalizationProvider, MobileTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { CreateOrganizationDto } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import dayjs from "dayjs";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

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

  const {
    data: organizationData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
    enabled: isEditMode,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load organization data");
    }
  }, [isError]);

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

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Organization" : "Add Organization"}
      />
      <Skeleton loading={isEditMode && isLoading}>
        <ComponentCard>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
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

                <Controller
                  name="workingHours.start"
                  control={control}
                  render={({ field }) => {
                    const hasError = !!errors.workingHours?.start;
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Office Start Time{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <MobileTimePicker
                          ampm={false}
                          value={
                            field.value ? dayjs(field.value, "HH:mm") : null
                          }
                          onChange={(value) => {
                            field.onChange(value ? value.format("HH:mm") : "");
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: hasError,
                              InputProps: {
                                sx: {
                                  height: "45px",
                                  borderRadius: "8px",
                                  backgroundColor: "#ffffff",
                                },
                              },
                            },
                          }}
                        />

                        {hasError && (
                          <p className="text-red-500 text-xs mt-2">
                            {errors.workingHours?.start?.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                <Controller
                  name="workingHours.end"
                  control={control}
                  render={({ field }) => {
                    const hasError = !!errors.workingHours?.end;
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Office End Time{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <MobileTimePicker
                          ampm={false}
                          value={
                            field.value ? dayjs(field.value, "HH:mm") : null
                          }
                          onChange={(value) => {
                            field.onChange(value ? value.format("HH:mm") : "");
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: hasError,
                              InputProps: {
                                sx: {
                                  height: "45px",
                                  borderRadius: "8px",
                                  backgroundColor: "#ffffff",
                                },
                              },
                            },
                          }}
                        />

                        {hasError && (
                          <p className="text-red-500 text-xs mt-2">
                            {errors.workingHours?.end?.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 dark:border-gray-700">
                <Button size="md" disabled={saveMutation.isPending}>
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
          </LocalizationProvider>
        </ComponentCard>
      </Skeleton>
    </>
  );
}
