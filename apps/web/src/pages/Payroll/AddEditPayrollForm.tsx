import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMemo } from "react";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
// import FileInput from "../../components/form/input/FileInput";

import { getEmployees, getSalaryStructures } from "../../api/get";
import { addPayroll } from "../../api/post";

const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  basicSalary: z.number(),
  totalDeductions: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

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

export default function AddEditPayrollForm() {
  //   const { id } = useParams<{ id: string }>();
  //   const isEdit = Boolean(id && id !== "new");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });
  const { data: salaryStructures = [] } = useQuery({
    queryKey: ["salary-structures"],
    queryFn: getSalaryStructures,
  });
  const salaryMap = useMemo(() => {
    return new Map(
      salaryStructures.map((s: any) => [s.employeeId, Number(s.basicSalary)])
    );
  }, [salaryStructures]);
  const employeeId = watch("employeeId");

  useEffect(() => {
    if (!employeeId) return;

    const salary = salaryMap.get(employeeId);

    if (salary !== undefined) {
      setValue("basicSalary", salary, {
        shouldValidate: true,
      });
    }
  }, [employeeId, salaryMap, setValue]);

  /* -------- Payroll (Edit Mode) -------- */

  //   const { data, isLoading } = useQuery({
  //     queryKey: ["payroll", id],
  //     queryFn: () => getPayrollById(id!),
  //     enabled: isEdit,
  //   });

  //   useEffect(() => {
  //     if (data) {
  //       reset({
  //         employeeId: data.employeeId,
  //         month: Number(data.month),
  //         year: Number(data.year),
  //         totalDeductions: Number(data.totalDeductions),
  //         file: null, // keep file optional on edit
  //       });
  //     }
  //   }, [data, reset]);

  /* -------- Save Mutation -------- */

  //   const saveMutation = useMutation({
  //     // mutationFn: (payload: FormData) =>
  //     //   isEdit ? updatePayroll(id!, payload) : addPayroll(payload),

  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ["payrolls"] });
  //       navigate("/payrolls");
  //     },
  //   });
  const saveMutation = useMutation({
    mutationFn: addPayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      navigate("/payrolls");
    },
  });

  const onSubmit = (formData: FormData) => {
    console.log(formData);
    saveMutation.mutate(formData);
  };

  //   if (isEdit && isLoading) {
  //     return <div className="p-6 text-gray-500">Loading payroll…</div>;
  //   }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
        >
          {/* {saveMutation.isPending
            ? "Saving..."
            : isEdit
            ? "Update Payroll"
            : "Add Payroll"} */}
          add
        </button>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
        <h2 className="mb-6 text-lg font-semibold">
          {/* {isEdit ? "Edit Payroll" : "Add Payroll"}
           */}
          Add
        </h2>

        {saveMutation.isError && (
          <p className="mb-4 text-sm font-medium text-red-600">
            {(saveMutation.error as any)?.response?.data?.message ||
              "Payroll already exists for this employee and month"}
          </p>
        )}

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
                value={field.value ?? ""}
                onChange={(v) => field.onChange(v)}
                placeholder="Select employee"
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
              />
            )}
          />

          <Input
            label="Basic Salary"
            type="number"
            {...register("basicSalary", { valueAsNumber: true })}
            disabled
            className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
          />

          <Input
            label="Total Deductions"
            type="number"
            {...register("totalDeductions", { valueAsNumber: true })}
            error={!!errors.totalDeductions}
            hint={errors.totalDeductions?.message}
          />
          <Input
            label="Year"
            type="number"
            placeholder="2026"
            {...register("year", { valueAsNumber: true })}
          />

          {/* File */}
          {/* <FileInput
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue("file", file, { shouldValidate: true });
              }
            }}
          /> */}
        </div>
      </div>
    </form>
  );
}
