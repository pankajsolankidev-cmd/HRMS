import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { z } from "zod";

import { addOrganization } from "../../api/post";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import DatePicker from "../../components/form/date-picker";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import Button from "../../components/ui/button/Button";

import type { CreateOrganizationDto } from "@shared/types";

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
  name: z.string().min(1, "Name is required"),
  workingHours: z.object({
    start: z.string().min(1, "Start time is required"),
    end: z.string().min(1, "End time is required"),
  }),
  weekOff: z
    .array(z.enum(WEEK_DAYS as [string, ...string[]]))
    .min(1, "Select at least one week off"),
});

export default function OrganizationForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof organizationSchema>>({
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

  const saveMutation = useMutation({
    mutationFn: (payload: CreateOrganizationDto) => addOrganization(payload),

    onSuccess: (res) => {
      toast.success(res?.message ?? "Organization created successfully");
      navigate("/organization");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: z.infer<typeof organizationSchema>) => {
    saveMutation.mutate(formData as CreateOrganizationDto);
  };

  const weekDayOptions = WEEK_DAYS.map((day) => ({
    value: day,
    text: day,
  }));

  return (
    <>
      <PageMeta
        title="Add Organization"
        description="Create a new Organization"
      />

      <ComponentCard title="Add Organization">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              required
              label="Organization Name"
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
                  id="start-time"
                  mode="time"
                  label="Start Time"
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
                  id="end-time"
                  mode="time"
                  label="End Time"
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

          <div className="flex justify-end gap-3 pt-6">
            <Button
              disabled={saveMutation.isPending}
              className="bg-black dark:bg-blue-500 text-white"
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>

            <Button variant="outline" onClick={() => navigate("/organization")}>
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
