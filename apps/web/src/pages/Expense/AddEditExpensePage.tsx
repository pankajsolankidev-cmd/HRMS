import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import DatePicker from "../../components/form/date-picker";
import FileInput from "../../components/form/input/FileInput";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

import { getExpenseById } from "../../api/get";
import { addExpense, uploadFile } from "../../api/post";
import { updateExpense } from "../../api/put";
import Card from "../../components/common/ComponentCard";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_AMOUNT = 1_000_000;

const expenseSchema = z.object({
  expenseType: z.string().min(1, "Expense type is required"),
  amount: z
    .number()
    .refine((val) => !isNaN(val), "Amount is required")
    .positive("Amount must be greater than 0")
    .max(MAX_AMOUNT, "Amount is too large"),
  expenseDate: z.string().min(1, "Expense date is required"),
  description: z.string().optional(),
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
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function AddEditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id && id !== "new");

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
      expenseDate: "",
      description: "",
      file: null,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => getExpenseById(id!),
    enabled: isEditMode,
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
      isEditMode ? updateExpense({ id: id!, payload }) : addExpense(payload),
    onSuccess: (res) => {
      toast.success(
        res?.message ??
          `Expense ${isEditMode ? "updated" : "added"} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      navigate("/expenses");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message ?? "Something went wrong.");
    },
  });

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      let filePath = data?.file;

      if (formData.file instanceof File) {
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
      toast.error("File upload failed. Please try again.");
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        Loading expense details...
      </div>
    );
  }

  return (
    <>
      <Card title={isEditMode ? "Edit Expense" : "Add Expense"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              required
              label="Expense Type"
              placeholder="e.g. Travel, Food, Internet"
              {...register("expenseType")}
              error={!!errors.expenseType}
              hint={errors.expenseType?.message}
            />

            <Input
              required
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
              error={!!errors.amount}
              hint={errors.amount?.message}
            />

            <Controller
              name="expenseDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  required
                  disableFuture
                  id="expenseDate"
                  label="Expense Date"
                  placeholder="Select expense date"
                  value={field.value}
                  onChange={(dates) => {
                    if (dates?.length) {
                      setValue(
                        "expenseDate",
                        dates[0].toLocaleDateString("en-CA"),
                        {
                          shouldValidate: true,
                        },
                      );
                    }
                  }}
                  error={!!errors.expenseDate}
                  hint={errors.expenseDate?.message}
                />
              )}
            />

            <Input
              label="Description"
              placeholder="Add short description"
              {...register("description")}
              error={!!errors.description}
              hint={errors.description?.message}
            />

            <div className="md:col-span-1">
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
                <p className="mt-1 text-xs text-red-600">
                  {errors.file.message as string}
                </p>
              )}
            </div>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/expenses")}
            >
              Back
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
