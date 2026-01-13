import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import Input from "../form/input/InputField";

import { z } from "zod";
import { forgetPassword } from "../../api/post";
import type { AxiosError } from "axios";

const forgetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

type ForgetPasswordFormData = z.infer<typeof forgetPasswordSchema>;

const ForgetPassword = () => {
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

    onSuccess: (data: any) => {
      reset();

      if (data?.key) {
        setKey(data.key);
      }
    },
  });

  const onSubmit = (data: ForgetPasswordFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter your registered email and we’ll send you a reset link.
        </p>

        {mutation.isError && (
          <p className="text-red-500 text-sm mb-4">
            {(mutation.error as AxiosError<{ message?: string }>)?.response
              ?.data?.message || "Reset link expired or invalid"}
          </p>
        )}

        {mutation.isSuccess && (
          <p className="text-green-500 text-sm mb-4">
            Password reset link has been sent to your email.
          </p>
        )}

        <form
          className="space-y-5 dark:text-gray-400"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <Input
              required
              label="Email"
              type="email"
              placeholder="info@gmail.com"
              {...register("email")}
              error={!!errors.email}
              hint={errors.email?.message}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 bg-black text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {mutation.isPending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {key && (
          <button
            onClick={() => navigate(`/reset-password/${key}`)}
            className="mt-4 w-full py-2 rounded-lg border border-gray-300
              text-sm font-medium text-gray-700
              hover:bg-gray-100
              dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Go to Reset Password Page
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
      </div>
    </div>
  );
};

export default ForgetPassword;
