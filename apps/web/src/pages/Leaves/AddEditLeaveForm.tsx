import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useEffect } from "react";

import Input from "../../components/form/input/InputField";

import { addLeave, uploadFile } from "../../api/post";
import { getLeaveById } from "../../api/get";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import FileInput from "../../components/form/input/FileInput";
import { updateLeave } from "../../api/patch";

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

const STATUS_TYPES = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      navigate("/leave-requests");
    },
    onError:()=>{
      console.log("ERRRRRORRRR");
    }
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
      console.error("Leave submit failed:", error);
      
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
                    setValue("fromDate", dates[0].toISOString().split("T")[0], {
                      shouldValidate: true,
                    });
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
                    setValue("toDate", dates[0].toISOString().split("T")[0], {
                      shouldValidate: true,
                    });
                  }
                }}
              />
            )}
          />

          {errors.toDate && (
            <p className="text-sm text-red-600">{errors.toDate.message}</p>
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
