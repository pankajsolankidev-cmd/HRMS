import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

// UI Components
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import FileInput from "../../components/form/input/FileInput";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

// API & Types
import { getLeaveById } from "../../api/get";
import { updateLeave } from "../../api/patch";
import { addLeave, uploadFile } from "../../api/post";
import type { LeaveApiResponse, LeaveDetail } from "./leaveType";

const LEAVE_TYPES = [
  { label: "Sick", value: "sick" },
  { label: "Casual", value: "casual" },
  { label: "Marriage", value: "marriage" },
  { label: "WFH", value: "wfh" },
];

const DAY_TYPES = [
  { label: "Full Day", value: "full_day" },
  { label: "First Half", value: "first_half" },
  { label: "Second Half", value: "second_half" },
  { label: "Multiple Days", value: "multiple_days" },
];

const HOUR_OPTIONS = [
  { label: "First Half", value: "first_half" },
  { label: "Second Half", value: "second_half" },
  { label: "Full Day", value: "full_day" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const leaveSchema = z
  .object({
    fromDate: z.string().min(1, "From date is required"),
    toDate: z.string().min(1, "To date is required"),
    type: z.enum(["sick", "casual", "marriage", "wfh"]),
    dayType: z.enum(["full_day", "first_half", "second_half", "multiple_days"]),
    reason: z.string().min(1, "Reason is required"),
    fromHourType: z.enum(["first_half", "second_half", "full_day"]),
    toHourType: z.enum(["first_half", "second_half", "full_day"]),
    fromHour: z.number(),
    toHour: z.number(),
    file: z
      .union([
        z
          .instanceof(File)
          .refine(
            (file) => file.size <= MAX_FILE_SIZE,
            "File size must be less than 10MB",
          ),
        z.null(),
        z.undefined(),
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dayType === "multiple_days" && (!data.fromDate || !data.toDate)) {
      ctx.addIssue({
        path: ["toDate"],
        message: "Date range is required",
        code: z.ZodIssueCode.custom,
      });
    }
  });

type LeaveFormData = z.infer<typeof leaveSchema>;

const hoursToHourType = (hours?: number) =>
  hours === 4 ? "first_half" : "full_day";
const hourTypeToHours = (val: string) => (val === "full_day" ? 8 : 4);

export default function AddEditLeavePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id && id !== "new");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      fromDate: "",
      toDate: "",
      reason: "",
      fromHourType: "full_day",
      toHourType: "full_day",
      fromHour: 8,
      toHour: 8,
    },
  });

  const dayType = useWatch({ control, name: "dayType" });
  const fromDate = useWatch({ control, name: "fromDate" });

  const { data, isLoading } = useQuery<LeaveApiResponse<LeaveDetail>>({
    queryKey: ["leave", id],
    queryFn: () => getLeaveById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (data?.leave) {
      const { leave } = data;
      reset({
        fromDate: leave.fromDate,
        toDate: leave.toDate,
        type: leave.type,
        dayType: leave.dayType,
        reason: leave.reason,
        fromHour: leave.fromHour ?? 8,
        toHour: leave.toHour ?? 8,
        fromHourType: hoursToHourType(leave.fromHour),
        toHourType: hoursToHourType(leave.toHour),
      });
    }
  }, [data, reset]);

  useEffect(() => {
    if (dayType && dayType !== "multiple_days" && fromDate) {
      setValue("toDate", fromDate);
      const hours = dayType === "full_day" ? 8 : 4;
      setValue("fromHour", hours);
      setValue("toHour", hours);
    }
  }, [dayType, fromDate, setValue]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isEditMode ? updateLeave({ id: id!, payload }) : addLeave(payload),
    onSuccess: (res) => {
      toast.success(
        res?.message ??
          `Leave ${isEditMode ? "updated" : "applied"} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Please check your inputs");
    },
  });

  const onSubmit = async (formData: LeaveFormData) => {
    try {
      let filePath = data?.leave.file;
      if (formData.file instanceof File) {
        const uploadedFile = await uploadFile(formData.file);
        filePath = uploadedFile.path;
      }

      const payload = {
        ...formData,
        file: filePath,
      };

      saveMutation.mutate(payload);
    } catch {
      toast.error("File upload failed. Please try again.");
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading leave details...
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={isEditMode ? "Edit Leave Request" : "Apply for Leave"}
        description={
          isEditMode
            ? "Edit your leave request details"
            : "Submit a new leave request"
        }
      />

      <ComponentCard title={isEditMode ? "Edit Leave Request" : "Apply Leave"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  required
                  label="Leave Type"
                  options={LEAVE_TYPES}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.type}
                  hint={errors.type?.message}
                />
              )}
            />

            <Controller
              name="dayType"
              control={control}
              render={({ field }) => (
                <Select
                  required
                  label="Day Type"
                  options={DAY_TYPES}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.dayType}
                  hint={errors.dayType?.message}
                />
              )}
            />

            <Controller
              name="fromDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  required
                  placeholder="Select from date"
                  id="fromDate"
                  label="From Date"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(dates) => {
                    if (dates?.[0]) {
                      const dateStr = dates[0].toLocaleDateString("en-CA");
                      field.onChange(dateStr);
                    }
                  }}
                  error={!!errors.fromDate}
                  hint={errors.fromDate?.message}
                />
              )}
            />

            {dayType === "multiple_days" ? (
              <Controller
                name="toDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    required
                    id="toDate"
                    label="To Date"
                    placeholder="Select to date"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(dates) => {
                      if (dates?.[0])
                        field.onChange(dates[0].toLocaleDateString("en-CA"));
                    }}
                    error={!!errors.toDate}
                    hint={errors.toDate?.message}
                  />
                )}
              />
            ) : (
              <Input
                label="To Date"
                placeholder="Select from date"
                value={fromDate || ""}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
            )}

            {dayType === "multiple_days" && (
              <>
                <Controller
                  name="fromHourType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="From Day Type"
                      options={HOUR_OPTIONS}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue("fromHour", hourTypeToHours(val));
                      }}
                    />
                  )}
                />
                <Controller
                  name="toHourType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="To Day Type"
                      options={HOUR_OPTIONS}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue("toHour", hourTypeToHours(val));
                      }}
                    />
                  )}
                />
              </>
            )}

            <div className="md:col-span-1">
              <Input
                required
                label="Reason"
                placeholder="Briefly describe the reason for leave"
                {...register("reason")}
                error={!!errors.reason}
                hint={errors.reason?.message}
              />
            </div>

            <div className="md:col-span-1">
              <FileInput
                label="Supporting Document (Optional)"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setValue("file", file, { shouldValidate: true });
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6 dark:border-gray-700">
            <Button
              disabled={saveMutation.isPending}
              className="bg-black dark:bg-blue-500 text-white"
            >
              {saveMutation.isPending
                ? "Processing..."
                : isEditMode
                  ? "Update"
                  : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/leave-requests")}
            >
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
