import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import Label from "../form/Label";
import Input from "../form/input/InputField";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { resetPassword } from "../../api/post";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordFormData = z.infer<
  typeof resetPasswordSchema
>;

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) => {
      if (!token) throw new Error("Invalid reset token");
      return resetPassword({
        token,
        password: data.password,
      });
    },
    onSuccess: () => {
      reset();
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="w-500 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 dark:text-gray-400">
      <div className="w-500  max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
          Reset Password
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter your new password below.
        </p>

        {mutation.isError && (
          <p className="text-red-500 text-sm mb-4">
            {(mutation.error as any)?.response?.data?.message ||
              "Reset link expired or invalid"}
          </p>
        )}

        {mutation.isSuccess && (
          <p className="text-green-500 text-sm mb-4">
            Password reset successful. Redirecting to sign in...
          </p>
        )}

        <form
          className="space-y-5"
          onSubmit={handleSubmit(onSubmit)}
        >

          <div>
            <Label>New Password *</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                {...register("password")}
                error={!!errors.password}
                hint={errors.password?.message}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-500" />
                )}
              </span>
            </div>
          </div>

          <div>
            <Label>Confirm Password *</Label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              hint={errors.confirmPassword?.message}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 bg-black text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {mutation.isPending ? "Resetting..." : "Reset Password"}
          </button>
        </form>

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

export default ResetPassword;
