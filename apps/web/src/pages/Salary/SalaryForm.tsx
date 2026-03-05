import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import ComponentCard from "../../components/common/ComponentCard";
import DatePicker from "../../components/form/date-picker";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

import { getEmployees, getSalaryStructureById } from "../../api/get";
import { updateSalaryStructure } from "../../api/patch";
import { addSalaryStructure } from "../../api/post";
import type { PaginatedResponse } from "../../api/types";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const MAX_AMOUNT = 1_000_000;
const TAX_AMOUNT = 1_000;
const schema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  basicSalary: z
    .number()
    .min(1, "Basic salary must be greater than 0")
    .max(MAX_AMOUNT, "Amount is too large"),
  tax: z
    .number()
    .min(1, "Tax must be greater than 0")
    .max(TAX_AMOUNT, "Amount is too large"),
  pf: z
    .number()
    .min(1, "PF must be greater than 0")
    .max(TAX_AMOUNT, "Amount is too large"),
  description: z.string().optional(),
  appraisalDate: z.string().min(1, "Appraisal date is required"),
});

type FormData = z.infer<typeof schema>;

export default function SalaryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id && id !== "new");

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
      tax: 0,
      pf: 0,
      description: "",
      appraisalDate: "",
    },
  });

  const { data: employeesData } = useQuery<PaginatedResponse<any>>({
    queryKey: ["employees", "lookup"],
    queryFn: () => getEmployees(),
  });

  const employeeOptions = (employeesData?.data ?? []).map((emp: any) => ({
    label: `${emp.firstName} ${emp.lastName}`,
    value: String(emp.id),
  }));

  const { data: salaryData, isLoading: salaryLoading } = useQuery({
    queryKey: ["salary-structure", id],
    queryFn: () => getSalaryStructureById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (salaryData) {
      reset({
        employeeId: String(salaryData.employeeId),
        basicSalary: Number(salaryData.basicSalary),
        tax: Number(salaryData.tax),
        pf: Number(salaryData.pf),
        description: salaryData.description || "",
        appraisalDate: salaryData.appraisalDate ?? "",
      });
    }
  }, [salaryData, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      isEditMode
        ? updateSalaryStructure(id!, payload)
        : addSalaryStructure(payload),

    onSuccess: (res) => {
      toast.success(
        res?.message ??
          (isEditMode
            ? "Salary updated successfully"
            : "Salary added successfully"),
      );
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
      navigate("/salary");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = (formData: FormData) => {
    saveMutation.mutate(formData);
  };

  if (isEditMode && salaryLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading salary structure...
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Salary" : "Add Salary"} />

      <ComponentCard>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
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
              label="Tax"
              type="number"
              placeholder="0"
              value={watch("tax") === 0 ? "" : watch("tax")}
              onChange={(e) => {
                const val = e.target.value;
                setValue("tax", val === "" ? 0 : Number(val), {
                  shouldValidate: true,
                });
              }}
              error={!!errors.tax}
              hint={errors.tax?.message}
            />
            <Input
              required
              label="PF"
              type="number"
              placeholder="0"
              value={watch("pf") === 0 ? "" : watch("pf")}
              onChange={(e) => {
                const val = e.target.value;
                setValue("pf", val === "" ? 0 : Number(val), {
                  shouldValidate: true,
                });
              }}
              error={!!errors.pf}
              hint={errors.pf?.message}
            />

            <div className="md:col-span-1">
              <Controller
                name="appraisalDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    required
                    id="appraisalDate"
                    label="Appraisal Date"
                    placeholder="Select appraisal date"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(dates) => {
                      if (dates?.[0]) {
                        field.onChange(dates[0].toLocaleDateString("en-CA"));
                      } else {
                        field.onChange("");
                      }
                    }}
                    error={!!errors.appraisalDate}
                    hint={errors.appraisalDate?.message}
                  />
                )}
              />
            </div>

            <Input
              label="Description"
              placeholder="Enter description"
              {...register("description")}
              error={!!errors.description}
              hint={errors.description?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 dark:border-gray-700">
            <Button
              disabled={saveMutation.isPending}
              className="bg-black dark:bg-blue-500 text-white"
            >
              {saveMutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update"
                  : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/salary")}
            >
              Back
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
