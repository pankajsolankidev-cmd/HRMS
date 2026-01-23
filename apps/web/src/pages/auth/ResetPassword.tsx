import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";

import { resetPassword } from "../../api/post";
import Input from "../../components/form/input/InputField";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
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
        key: token,
        newPassword: data.password,
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message ?? "Password reset successful");
      reset();
      navigate("/signin", { replace: true });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "Reset link expired or invalid",
      );
    },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
        Reset Password
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Enter your new password below.
      </p>

      <form
        className="space-y-5 mt-8"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <div className="relative">
          <Input
            required
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            {...register("password")}
            error={!!errors.password}
            hint={errors.password?.message}
          />

          <span
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5 mt-6 text-gray-500" />
            ) : (
              <EyeIcon className="w-5 h-5 mt-6 text-gray-500" />
            )}
          </span>
        </div>

        <Input
          required
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm new password"
          {...register("confirmPassword")}
          error={!!errors.confirmPassword}
          hint={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 bg-black text-white rounded-lg disabled:opacity-50"
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
    </>
  );
}
