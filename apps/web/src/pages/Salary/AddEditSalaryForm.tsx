import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import DatePicker from "../../components/form/date-picker";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";

import { getEmployees, getSalaryStructureById } from "../../api/get";
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
    handleSubmit,
    reset,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      basicSalary: 0,
      description: "",
      appraisalDate: "",
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () =>
      getEmployees({
        page: 1,
        limit: 100,
      }),
  });
  const employeeList = employeesData?.data ?? [];
  const employeeOptions = employeeList.map((emp: any) => ({
    label: `${emp.firstName} ${emp.lastName}`,
    value: emp.id,
  }));

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
        appraisalDate: data.appraisalDate ?? undefined,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      isEdit
        ? updateSalaryStructure(id!, payload)
        : addSalaryStructure(payload),

    onSuccess: (res) => {
      toast.success(
        res?.message ||
          (isEdit ? "Salary updated successfully" : "Salary added successfully")
      );
      queryClient.invalidateQueries({ queryKey: ["salary-structure"] });
      navigate("/salary");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    },
  });

  const onSubmit = (formData: FormData) => {
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return <div className="p-6 text-gray-500">Loading salary structure…</div>;
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {isEdit ? "Edit Salary" : "Add Salary"}
          </h2>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : isEdit ? "Update" : "Add"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Select
                label="Employee"
                options={employeeOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select employee"
                required
                error={!!errors.employeeId}
                hint={errors.employeeId?.message}
              />
            )}
          />

          <Input
            required
            label="Basic Salary"
            type="number"
            placeholder="0"
            value={watch("basicSalary") === 0 ? "" : watch("basicSalary")}
            onChange={(e) => {
              const val = e.target.value;
              setValue("basicSalary", val === "" ? 0 : Number(val), {
                shouldValidate: true,
              });
            }}
            error={!!errors.basicSalary}
            hint={errors.basicSalary?.message}
          />

          <Input
            required
            label="Description"
            placeholder="Description"
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
                value={field.value ? new Date(field.value) : null} // ✅ FIX
                onChange={(dates) => {
                  if (dates?.[0]) {
                    field.onChange(dates[0].toISOString().split("T")[0]);
                  } else {
                    field.onChange("");
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
