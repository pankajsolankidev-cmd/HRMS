import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import Input from "../../components/form/input/InputField";

import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { getLeaveById } from "../../api/get";
import { updateLeave } from "../../api/patch";
import { addLeave, uploadFile } from "../../api/post";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import FileInput from "../../components/form/input/FileInput";

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
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const leaveSchema = z.object({
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  type: z.enum(["sick", "casual", "marriage", "wfh"]),
  dayType: z.enum(["full_day", "first_half", "second_half"]),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be less than 10MB"
    )
    .optional()
    .nullable(),
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
      status: "pending",
      fromDate: "",
      toDate: "",
      type: undefined,
      dayType: undefined,
      reason: "",
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
        file: null,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit ? updateLeave({ id: id!, payload }) : addLeave(payload),

    onSuccess: (res) => {
      toast.success(res?.message ?? "Leave Added successfully");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Fill proper value");
    },
  });

  const onSubmit = async (formData: LeaveFormData) => {
    try {
      let filePath = data?.file;

      if (formData.file) {
        const uploadedFile = await uploadFile(formData.file);
        filePath = uploadedFile.path;
      }

      const payload = {
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        type: formData.type,
        dayType: formData.dayType,
        reason: formData.reason,
        file: filePath,
      };

      saveMutation.mutate(payload as any);
    } catch (error) {
      toast.error("File upload failed. Please try again.");
    }
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
                hint={errors.dayType?.message}
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
                value={field.value ? new Date(field.value) : null}
                onChange={(dates) => {
                  if (dates?.length) {
                    setValue("fromDate", dates[0].toISOString().split("T")[0], {
                      shouldValidate: true,
                    });
                  }
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
                id="toDate"
                label="To Date"
                placeholder="Select end date"
                value={field.value ? new Date(field.value) : null}
                onChange={(dates) => {
                  if (dates?.length) {
                    setValue("toDate", dates[0].toISOString().split("T")[0], {
                      shouldValidate: true,
                    });
                  }
                }}
                error={!!errors.toDate}
                hint={errors.toDate?.message}
              />
            )}
          />

          <Input
            required
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
                setValue("file", file, { shouldValidate: true });
              }
            }}
          />
          {errors.file && (
            <p className="text-sm text-red-600">
              {errors.file.message as string}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
