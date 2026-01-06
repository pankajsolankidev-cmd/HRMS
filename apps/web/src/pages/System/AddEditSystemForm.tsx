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

/* ---------------- OPTIONS ---------------- */

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

/* ---------------- ZOD SCHEMA ---------------- */

const leaveSchema = z.object({
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  type: z.enum(["sick", "casual", "marriage", "wfh"]),
  dayType: z.enum(["full_day", "first_half", "second_half"]),
  reason: z.string().min(1, "Reason is required"),
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
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: LeaveFormData) =>
      isEdit ? updateLeave({ id: id!, payload }) : addLeave(payload),
    onSuccess: () => {
      console.log(
      isEdit
        ? "Leave updated successfully"
        : "Leave applied successfully"
    );
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
                defaultDate={field.value}
                onChange={(dates) => {
                  if (dates?.length) {
                    setValue(
                      "fromDate",
                      dates[0].toISOString().split("T")[0],
                      { shouldValidate: true }
                    );
                  }
                }}
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
                defaultDate={field.value}
                onChange={(dates) => {
                  if (dates?.length) {
                    setValue(
                      "toDate",
                      dates[0].toISOString().split("T")[0],
                      { shouldValidate: true }
                    );
                  }
                }}
              />
            )}
          />

          <Input
            label="Reason"
            {...register("reason")}
            error={!!errors.reason}
            hint={errors.reason?.message}
          />
        </div>
      </div>
    </form>
  );
}
