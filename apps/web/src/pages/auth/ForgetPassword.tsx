import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import { forgetPassword } from "../../api/post";
import Input from "../../components/form/input/InputField";

const forgetPasswordSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, "Email is required"),
});

type ForgetPasswordFormData = z.infer<typeof forgetPasswordSchema>;

export default function ForgetPassword() {
  const navigate = useNavigate();
  const [key, setKey] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgetPasswordFormData>({
    resolver: zodResolver(forgetPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForgetPasswordFormData) => forgetPassword(data.email),

    onSuccess: (res) => {
      toast.success(res?.message ?? "Password reset link sent to your email");
      reset();
      if (res?.key) setKey(res.key);
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "Failed to send reset link",
      );
    },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
        Forgot Password
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Enter your registered email and we’ll send you a reset link.
      </p>

      <form
        noValidate
        className="space-y-5 mt-8"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <Input
          required
          label="Email"
          type="email"
          placeholder="info@gmail.com"
          {...register("email")}
          error={!!errors.email}
          hint={errors.email?.message}
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {mutation.isPending ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {key && (
        <button
          onClick={() => navigate(`/reset-password/${key}`)}
          className="mt-4 w-full py-2 rounded-lg border text-sm
            border-gray-300 text-gray-700
            hover:bg-gray-100
            dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Go to Reset Password
        </button>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/signin"
          className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
        >
          Back to Sign In
        </Link>
      </div>
    </>
  );
}
