import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useEffect } from "react";

import Input from "../../components/form/input/InputField";

import { addLeave } from "../../api/post";
import { updateLeave } from "../../api/put";
import { getLeaveById } from "../../api/get";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import FileInput from "../../components/form/input/FileInput";

const LEAVE_TYPES = [
  { label: "Sick", value: "SICK" },
  { label: "Casual", value: "CASUAL" },
  { label: "Marriage", value: "MARRIAGE" },
  { label: "WFH", value: "WFH" },
];

const DAY_TYPES = [
  { label: "Full Day", value: "FULL_DAY" },
  { label: "First Half", value: "FIRST_HALF" },
  { label: "Second Half", value: "SECOND_HALF" },
];

const STATUS_TYPES = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const leaveSchema = z.object({
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  type: z.enum(["SICK", "CASUAL", "MARRIAGE", "WFH"]),
  dayType: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  file: z.any().optional(),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

export default function AddEditLeaveForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEdit = Boolean(id && id !== "new");

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
      status: "PENDING",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leave", id],
    queryFn: () => getLeaveById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data) {
      reset({
        fromDate: data.fromDate,
        toDate: data.toDate,
        type: data.type,
        dayType: data.dayType,
        reason: data.reason,
        status: data.status,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: LeaveFormData) =>
      isEdit ? updateLeave({ id: id!, payload }) : addLeave(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leaves");
    },
  });

  const onSubmit = (formData: LeaveFormData) => {
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return <div className="p-6 text-gray-500">Loading leave...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Leave" : "Apply Leave"}
          </h2>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-lg bg-black px-4 py-2 text-white
                       dark:bg-white dark:text-black disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : isEdit ? "Update" : "Apply"}
          </button>
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-red-600">Something went wrong</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
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
                label="Day Type"
                options={DAY_TYPES}
                value={field.value}
                onChange={field.onChange}
                error={!!errors.dayType}
              />
            )}
          />

          <Controller
            name="fromDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="fromDate"
                label="From Date"
                placeholder="Select start date"
                defaultDate={field.value}
                onChange={(dates) => {
                  if (dates?.length) {
                    field.onChange(dates[0].toISOString().split("T")[0]);
                  }
                }}
              />
            )}
          />

          {errors.fromDate && (
            <p className="text-sm text-red-600">{errors.fromDate.message}</p>
          )}

          <Controller
            name="toDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="toDate"
                label="To Date"
                placeholder="Select end date"
                defaultDate={field.value}
                onChange={(dates) => {
                  if (dates?.length) {
                    field.onChange(dates[0].toISOString().split("T")[0]);
                  }
                }}
              />
            )}
          />

          {errors.toDate && (
            <p className="text-sm text-red-600">{errors.toDate.message}</p>
          )}

          {isEdit && (
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status"
                  options={STATUS_TYPES}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}

          <Input
            label="Reason"
            placeholder="Enter Reason"
            {...register("reason")}
            error={!!errors.reason}
            hint={errors.reason?.message}
          />

          <FileInput
            label="File Attachment (Optional)"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue("file", file);
              }
            }}
          />
        </div>
      </div>
    </form>
  );
}
