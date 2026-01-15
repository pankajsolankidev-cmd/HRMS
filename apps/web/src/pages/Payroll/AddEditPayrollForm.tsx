import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";

import { getEmployees, getPayrollById } from "../../api/get";
import { addPayroll } from "../../api/post";
import { updatePayroll } from "../../api/patch";

const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.string().min(1, "Month is required"),
  year: z.coerce.number().min(2000, "Invalid year"),
  totalDeductions: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

const MONTHS = [
  { label: "January", value: "JANUARY" },
  { label: "February", value: "FEBRUARY" },
  { label: "March", value: "MARCH" },
  { label: "April", value: "APRIL" },
  { label: "May", value: "MAY" },
  { label: "June", value: "JUNE" },
  { label: "July", value: "JULY" },
  { label: "August", value: "AUGUST" },
  { label: "September", value: "SEPTEMBER" },
  { label: "October", value: "OCTOBER" },
  { label: "November", value: "NOVEMBER" },
  { label: "December", value: "DECEMBER" },
];

export default function AddEditPayrollForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== "new");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  })
    .format(new Date())
    .toUpperCase();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      employeeId: "",
      month: currentMonthName,
      year: new Date().getFullYear(),
      totalDeductions: 0,
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () =>
      getEmployees({
        page: 1,
        limit: 1000,
      }),
  });

  const employeeList = employeesData?.data ?? [];

  const { data: payrollData, isLoading } = useQuery({
    queryKey: ["payroll", id],
    queryFn: () => getPayrollById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!payrollData) return;

    reset({
      employeeId: payrollData.employeeId ?? "",
      month: payrollData.month ? String(payrollData.month).toUpperCase() : "",
      year: payrollData.year
        ? Number(payrollData.year)
        : new Date().getFullYear(),
      totalDeductions: Number(payrollData.totalDeductions) || 0,
    });
  }, [payrollData, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      isEdit ? updatePayroll(id!, payload) : addPayroll(payload),

    onSuccess: (data) => {
      toast.success(
        data?.message ||
          (isEdit
            ? "Payroll updated successfully"
            : "Payroll added successfully")
      );
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      navigate("/payrolls");
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Operation failed");
    },
  });

  const onSubmit: SubmitHandler<FormData> = (formData) => {
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return <div className="p-6 text-gray-500">Loading payroll…</div>;
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-black px-4 py-2 text-white
                     dark:bg-white dark:text-black disabled:opacity-50"
        >
          {saveMutation.isPending
            ? "Saving..."
            : isEdit
            ? "Update Payroll"
            : "Add Payroll"}
        </button>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
        <h2 className="mb-6 text-lg font-semibold">
          {isEdit ? "Edit Payroll" : "Add Payroll"}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Select
                label="Employee"
                options={employeeList.map((emp: any) => ({
                  label: `${emp.firstName} ${emp.lastName}`,
                  value: emp.id,
                }))}
                value={field.value}
                onChange={field.onChange}
                required
                error={!!errors.employeeId}
                hint={errors.employeeId?.message}
              />
            )}
          />

          <Controller
            name="month"
            control={control}
            render={({ field }) => (
              <Select
                label="Month"
                options={MONTHS}
                value={field.value}
                onChange={field.onChange}
                required
                error={!!errors.month}
                hint={errors.month?.message}
              />
            )}
          />

          <Input
            label="Total Deductions"
            type="number"
            value={
              watch("totalDeductions") === 0 ? "" : watch("totalDeductions")
            }
            onChange={(e) =>
              setValue(
                "totalDeductions",
                e.target.value === "" ? 0 : Number(e.target.value),
                { shouldValidate: true }
              )
            }
            placeholder="0"
            error={!!errors.totalDeductions}
            hint={errors.totalDeductions?.message}
          />

          <Input
            label="Year"
            type="number"
            value={watch("year")}
            onChange={(e) =>
              setValue("year", Number(e.target.value), {
                shouldValidate: true,
              })
            }
            required
            error={!!errors.year}
            hint={errors.year?.message}
          />
        </div>
      </div>
    </form>
  );
}
