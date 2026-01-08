import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";

import {
  getEmployees,
  getSalaryStructures,
  getPayrollById,
} from "../../api/get";
import { addPayroll } from "../../api/post";
import { updatePayroll } from "../../api/patch";

/* ---------------- Schema ---------------- */

const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  totalDeductions: z.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

/* ---------------- Constants ---------------- */

const MONTHS = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

/* ---------------- Component ---------------- */

export default function AddEditPayrollForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== "new");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      month: undefined,
      year: new Date().getFullYear(),
      totalDeductions: 0,
    },
  });

  /* ---------------- Queries ---------------- */

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const { data: salaryStructures = [] } = useQuery({
    queryKey: ["salary-structures"],
    queryFn: getSalaryStructures,
  });

  const salaryMap = useMemo(
    () =>
      new Map(
        salaryStructures.map((s: any) => [s.employeeId, Number(s.basicSalary)])
      ),
    [salaryStructures]
  );

  /* 🔥 Fetch payroll for EDIT */
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ["payroll", id],
    queryFn: () => getPayrollById(id!),
    enabled: isEdit,
  });

  /* ---------------- Effects ---------------- */

  /* Prefill form in edit mode */
  useEffect(() => {
    if (!payrollData) return;

    reset({
      employeeId: payrollData.employeeId ?? "",
      month:
        payrollData.month !== null && payrollData.month !== undefined
          ? Number(payrollData.month)
          : undefined,
      year:
        payrollData.year !== null && payrollData.year !== undefined
          ? Number(payrollData.year)
          : new Date().getFullYear(),
      totalDeductions:
        payrollData.totalDeductions !== null &&
        payrollData.totalDeductions !== undefined
          ? Number(payrollData.totalDeductions)
          : 0,
    });
  }, [payrollData, reset]);

  /* ---------------- Mutation ---------------- */

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      isEdit ? updatePayroll(id!, payload) : addPayroll(payload),

    onSuccess: () => {
      toast.success(
        isEdit ? "Payroll updated successfully" : "Payroll added successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      navigate("/payrolls");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Payroll already exists for this employee and month"
      );
    },
  });

  /* ---------------- Handlers ---------------- */

  const onSubmit = (formData: FormData) => {
    const payload = {
    ...formData,
    totalDeductions: formData.totalDeductions ?? 0,
  };

    console.log(formData);
    saveMutation.mutate(payload);
  };

  const onInvalid = () => {
    toast.error("Please fix the errors in the form");
  };

  if (isEdit && isLoading) {
    return <div className="p-6 text-gray-500">Loading payroll…</div>;
  }

  /* ---------------- UI ---------------- */

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="space-y-6"
    >
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
                options={employees.map((e: any) => ({
                  label: `${e.firstName} ${e.lastName}`,
                  value: e.id,
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
                value={field.value ? String(field.value) : ""}
                onChange={(v) => field.onChange(Number(v))}
                required
                error={!!errors.month}
                hint={errors.month?.message}
              />
            )}
          />

          <Input
            label="Total Deductions"
            type="number"
            value={watch("totalDeductions") ?? ""}
            onChange={(e) =>
              setValue(
                "totalDeductions",
                e.target.value === "" ? 0 : Number(e.target.value),
                { shouldValidate: true }
              )
            }
            error={!!errors.totalDeductions}
            hint={errors.totalDeductions?.message}
          />

          <Input
            label="Year"
            type="number"
            value={watch("year") ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setValue(
                "year",
                value === "" ? new Date().getFullYear() : Number(value),
                { shouldValidate: true }
              );
            }}
            required
            error={!!errors.year}
            hint={errors.year?.message}
          />
        </div>
      </div>
    </form>
  );
}
