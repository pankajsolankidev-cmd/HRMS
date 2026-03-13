import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";
import FileInput from "../../components/form/input/FileInput";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const LEAVE_TYPES = [
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
  { label: "Full Day", value: "full_day" },
  { label: "First Half", value: "first_half" },
  { label: "Second Half", value: "second_half" },
];

export const leaveSchema = (requireEmployee = false) =>
  z
    .object({
      employeeId: z.string().optional(),

      fromDate: z.string().min(1, "From date is required"),
      toDate: z.string().min(1, "To date is required"),

      type: z.enum(["sick", "casual", "marriage", "wfh"]),
      dayType: z.enum([
        "full_day",
        "first_half",
        "second_half",
        "multiple_days",
      ]),

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
      if (requireEmployee && !data.employeeId) {
        ctx.addIssue({
          path: ["employeeId"],
          message: "Employee is required",
          code: "custom",
        });
      }
      if (
        data.dayType === "multiple_days" &&
        data.fromDate &&
        data.toDate &&
        new Date(data.toDate) <= new Date(data.fromDate)
      ) {
        ctx.addIssue({
          path: ["toDate"],
          message: "To date must be after From date",
          code: "custom",
        });
      }
    });

export type LeaveFormData = z.infer<ReturnType<typeof leaveSchema>>;

const hourTypeToHours = (val: string) => (val === "full_day" ? 8 : 4);

type Props = {
  defaultValues?: Partial<LeaveFormData>;
  onSubmit: (data: LeaveFormData) => void;
  onBack: () => void;
  loading?: boolean;
  showEmployeeSelect?: boolean;
  employeeOptions?: { label: string; value: string }[];
};

export default function LeaveForm({
  defaultValues,
  onSubmit,
  onBack,
  loading,
  showEmployeeSelect,
  employeeOptions = [],
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema(showEmployeeSelect)),
    defaultValues: {
      type: "sick",
      dayType: "full_day",
      fromHour: 8,
      toHour: 8,
      fromHourType: "full_day",
      toHourType: "full_day",
      ...defaultValues,
    },
  });

  const dayType = useWatch({ control, name: "dayType" });
  const fromDate = useWatch({ control, name: "fromDate" });

  useEffect(() => {
    if (dayType && dayType !== "multiple_days" && fromDate) {
      setValue("toDate", fromDate);
      const hours = dayType === "full_day" ? 8 : 4;
      setValue("fromHour", hours);
      setValue("toHour", hours);
    }
  }, [dayType, fromDate, setValue]);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showEmployeeSelect && (
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Select
                required
                label="Employee"
                options={employeeOptions}
                value={field.value}
                onChange={field.onChange}
                error={!!errors.employeeId}
                hint={errors.employeeId?.message}
              />
            )}
          />
        )}

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
              id="fromDate"
              disableFuture={showEmployeeSelect}
              disablePast={!showEmployeeSelect}
              placeholder="Select from date"
              required
              label="From Date"
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

        <div
          className={dayType !== "multiple_days" ? "pointer-events-none " : ""}
        >
          <Controller
            name="toDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="toDate"
                disableFuture={showEmployeeSelect}
                disablePast={!showEmployeeSelect}
                placeholder="Select to date"
                required
                label="To Date"
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
        </div>

        {dayType === "multiple_days" && (
          <>
            <Controller
              name="fromHourType"
              control={control}
              render={({ field }) => (
                <Select
                  required
                  label="From Day Type"
                  options={HOUR_OPTIONS}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue("fromHour", hourTypeToHours(val));
                  }}
                  error={!!errors.fromHourType}
                  hint={errors.fromHourType?.message}
                />
              )}
            />

            <Controller
              name="toHourType"
              control={control}
              render={({ field }) => (
                <Select
                  required
                  label="To Day Type"
                  options={HOUR_OPTIONS}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue("toHour", hourTypeToHours(val));
                  }}
                  error={!!errors.toHourType}
                  hint={errors.toHourType?.message}
                />
              )}
            />
          </>
        )}

        <Input
          required
          label="Reason"
          placeholder="Enter reason"
          {...register("reason")}
          error={!!errors.reason}
          hint={errors.reason?.message}
        />

        <FileInput
          label="File Attachment"
          onChange={(e) =>
            e.target.files?.[0] &&
            setValue("file", e.target.files[0], { shouldValidate: true })
          }
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 dark:border-gray-700">
        <Button className="bg-black dark:bg-blue-500" disabled={loading}>
          {loading ? "Processing..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
      </div>
    </form>
  );
}
