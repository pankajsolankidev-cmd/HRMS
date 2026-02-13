import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import PageMeta from "../../components/common/PageMeta";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

import { getPayrollById, getSalaryStructures } from "../../api/get";
import { updatePayroll } from "../../api/patch";
import { addPayroll } from "../../api/post";
import Card from "../../components/common/ComponentCard";

const payrollSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.string().min(1, "Month is required"),
  year: z.coerce.number().min(2000, "Invalid year"),
  deductions: z.number().min(0, "Deductions cannot be negative"),
  bonus: z.number().min(0, "Deductions cannot be negative"),
  deductionReason: z.string().optional(),
  bonusDescription: z.string().optional(),
});

type PayrollFormData = z.infer<typeof payrollSchema>;

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

export default function AddEditPayrollPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id && id !== "new");

  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  })
    .format(new Date())
    .toUpperCase();

  const {
    handleSubmit,
    reset,
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema) as any,
    defaultValues: {
      employeeId: "",
      month: currentMonthName,
      year: new Date().getFullYear(),
      deductions: 0,
      bonus: 0,
      bonusDescription: "",
      deductionReason: "",
    },
  });

  const { data: salaryData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => getSalaryStructures(),
  });

  const salaryList = salaryData?.data ?? [];

  const { data: payrollData, isLoading } = useQuery({
    queryKey: ["payroll", id],
    queryFn: () => getPayrollById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (payrollData) {
      reset({
        employeeId: payrollData.employeeId ?? "",
        month: payrollData.month ? String(payrollData.month).toUpperCase() : "",
        year: payrollData.year
          ? Number(payrollData.year)
          : new Date().getFullYear(),
        deductions: Number(payrollData.deductions) || 0,
        bonus: Number(payrollData.bonus) || 0,
        deductionReason: payrollData.deductionReason ?? "",
        bonusDescription: payrollData.bonusDescription ?? "",
      });
    }
  }, [payrollData, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: PayrollFormData) =>
      isEditMode ? updatePayroll(id!, payload) : addPayroll(payload),
    onSuccess: (res) => {
      toast.success(
        res?.message ??
          `Payroll ${isEditMode ? "updated" : "added"} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      navigate("/payrolls");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Please check your inputs");
    },
  });

  const onSubmit: SubmitHandler<PayrollFormData> = (formData) => {
    saveMutation.mutate(formData);
  };

  if (isEditMode && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading payroll details...
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={isEditMode ? "Edit Payroll" : "Add Payroll"}
        description={
          isEditMode ? "Update payroll details" : "Create new payroll record"
        }
      />

      <Card title={isEditMode ? "Edit Payroll" : "Add Payroll"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <Select
                  required
                  label="Employee"
                  options={salaryList.map((emp: any) => ({
                    label: `${emp.id} ${emp.lastName}`,
                    value: emp.id,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
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
                  required
                  label="Month"
                  options={MONTHS}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.month}
                  hint={errors.month?.message}
                />
              )}
            />

            <Input
              required
              label="Year"
              type="number"
              value={watch("year") || ""}
              onChange={(e) => {
                const val = e.target.value;
                setValue("year", val === "" ? 0 : Number(val), {
                  shouldValidate: true,
                });
              }}
              placeholder={new Date().getFullYear().toString()}
              error={!!errors.year}
              hint={errors.year?.message}
            />
            <Input
              label="Deductions (₹)"
              type="number"
              value={watch("deductions") || ""}
              onChange={(e) => {
                const val = e.target.value;
                setValue("deductions", val === "" ? 0 : Number(val), {
                  shouldValidate: true,
                });
              }}
              placeholder="0"
              error={!!errors.deductions}
              hint={errors.deductions?.message}
            />
            <Input
              label="Bonus (₹)"
              type="number"
              value={watch("bonus") || ""}
              onChange={(e) => {
                const val = e.target.value;
                setValue("bonus", val === "" ? 0 : Number(val), {
                  shouldValidate: true,
                });
              }}
              placeholder="0"
              error={!!errors.bonus}
              hint={errors.bonus?.message}
            />
            <Input
              label="Deduction Reason"
              placeholder="Enter deductionReason"
              {...register("deductionReason")}
              error={!!errors.deductionReason}
            />
            <Input
              label="Bonus Description"
              placeholder="Enter bonusDescription"
              {...register("bonusDescription")}
              error={!!errors.bonusDescription}
            />
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
            <Button variant="outline" onClick={() => navigate("/payrolls")}>
              Back
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
