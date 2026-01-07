import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";

import { getEmployees, getSalaryStructureById } from "../../api/get";
import DatePicker from "../../components/form/date-picker";
import { updateSalaryStructure } from "../../api/patch";
import { addSalaryStructure } from "../../api/post";

const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  basicSalary: z.number().min(1, "Basic salary must be greater than 0"),
  description: z.string().optional(),
  appraisalDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddEditSalaryForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== "new");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["salary-structure", id],
    queryFn: () => getSalaryStructureById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data) {
      reset({
        employeeId: data.employeeId,
        basicSalary: Number(data.basicSalary),
        description: data.description || "",
        appraisalDate: data.appraisalDate || "",
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      isEdit
        ? updateSalaryStructure(id!, payload)
        : addSalaryStructure(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
      navigate("/salary-structures");
    },
  });

  const onSubmit = (formData: FormData) => {
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return <div className="p-6 text-gray-500">Loading salary structure…</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          {isEdit ? "Update" : "Add"}
        </button>
      </div>
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
        <h2 className="mb-6 text-lg font-semibold">
          {isEdit ? "Edit Salary Structure" : "Add Salary Structure"}
        </h2>

        {saveMutation.isError && (
          <p className="mb-4 text-sm font-medium text-red-600">
            {(saveMutation.error as any)?.response?.data?.message ||
              (saveMutation.error as any)?.response?.data?.error ||
              "Salary structure already exists for this employee"}
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
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Input
            label="Basic Salary"
            placeholder="basic salary"
            type="number"
            {...register("basicSalary", { valueAsNumber: true })}
            error={!!errors.basicSalary}
            hint={errors.basicSalary?.message}
          />

          <Input
            label="Description"
            placeholder="description"
            {...register("description")}
          />

          <Controller
            name="appraisalDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="appraisalDate"
                label="Appraisal Date"
                placeholder="Select appraisal date"
                defaultDate={field.value || undefined}
                onChange={(dates) => {
                  if (dates?.length) {
                    field.onChange(dates[0].toISOString().split("T")[0]);
                  }
                }}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
