import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import DatePicker from "../../components/form/date-picker";
import FileInput from "../../components/form/input/FileInput";
import Input from "../../components/form/input/InputField";

import { getExpenseById } from "../../api/get";
import { addExpense, uploadFile } from "../../api/post";
import { updateExpense } from "../../api/put";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const expenseSchema = z.object({
  expenseType: z.string().min(1, "Expense type is required"),
  amount: z
    .number()
    .refine((val) => !isNaN(val), "Amount is required")
    .positive("Amount must be greater than 0"),
  expenseDate: z.string().min(1, "Expense date is required"),
  description: z.string().optional(),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be less than 10MB",
    )
    .optional()
    .nullable(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function AddEditExpenseForm() {
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
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseType: "",
      amount: 0,
      expenseDate: "",
      description: "",
      file: null,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => getExpenseById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data) {
      reset({
        expenseType: data.expenseType,
        amount: Number(data.amount),
        expenseDate: data.expenseDate,
        description: data.description ?? "",
        file: null,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit ? updateExpense({ id: id!, payload }) : addExpense(payload),

    onSuccess: () => {
      toast.success(
        isEdit ? "Expense updated successfully" : "Expense added successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      navigate("/expenses");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    },
  });

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      let filePath = data?.file;

      if (formData.file) {
        const uploadedFile = await uploadFile(formData.file);
        filePath = uploadedFile.path;
      }

      const payload = {
        expenseType: formData.expenseType,
        amount: formData.amount,
        expenseDate: formData.expenseDate,
        description: formData.description,
        file: filePath,
      };

      saveMutation.mutate(payload);
    } catch (error) {
      console.error("Expense submit failed:", error);
      toast.error("File upload failed. Please try again.");
    }
  };

  if (isEdit && isLoading) {
    return <div className="p-6 text-gray-500">Loading expense...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-700 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Expense" : "Add Expense"}
          </h2>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-lg bg-black px-4 py-2 text-white
                       dark:bg-white dark:text-black disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : isEdit ? "Update" : "Add"}
          </button>
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-red-600">Something went wrong</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            required
            label="Expense Type"
            placeholder="Travel, Food, Internet"
            {...register("expenseType")}
            error={!!errors.expenseType}
            hint={errors.expenseType?.message}
          />

          <Input
            required
            label="Amount"
            type="number"
            step="0.01"
            {...register("amount")}
            error={!!errors.amount}
            hint={errors.amount?.message}
          />

          <Controller
            name="expenseDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="expenseDate"
                label="Expense Date"
                placeholder="Select expense date"
                value={field.value}
                onChange={(dates) => {
                  if (dates?.length) {
                    setValue(
                      "expenseDate",
                      dates[0].toISOString().split("T")[0],
                      { shouldValidate: true },
                    );
                  }
                }}
              />
            )}
          />
          {errors.expenseDate && (
            <p className="text-sm text-red-600">{errors.expenseDate.message}</p>
          )}

          <Input
            label="Description"
            placeholder="Add description"
            {...register("description")}
            error={!!errors.description}
            hint={errors.description?.message}
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
