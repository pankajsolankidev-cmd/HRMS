import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "../form/input/InputField";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { signInApi } from "../../api/post";
import Cookies from "js-cookie";

const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const navigate = useNavigate();
  const signInMutation = useMutation({
    mutationFn: signInApi,
    onSuccess: (res) => {
      const token = res.accessToken;
      Cookies.set("access", token);
      navigate("/dashboard", { replace: true });
    },
  });

  const onSubmit = (data: SignInFormValues) => {
    signInMutation.mutate(data);
  };

  return (
    <div className="w-500 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="relative w-full max-w-4xl h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "0%" }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute left-0 top-0 h-full w-1/2 bg-black dark:bg-gray-800 text-white z-20 hidden md:flex flex-col justify-center items-center p-8"
        >
          <h2 className="text-3xl font-semibold mb-4">New Here?</h2>
          <p className="text-sm text-center mb-6">
            Create an account to access all features.
          </p>

          <Link
            to="/signup"
            className="px-6 py-2 rounded-lg text-black bg-white font-medium hover:bg-yellow-300 transition"
          >
            Go to Sign Up
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 h-full dark:bg-gray-950 dark:text-gray-400">
          <div className="hidden md:block" />

          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Sign In
            </h1>

            {signInMutation.isError && (
              <p className="text-red-500 text-sm mt-4">
                {(signInMutation.error as any)?.response?.data?.message ||
                  (signInMutation.error as Error).message}
              </p>
            )}

            <form className="space-y-5 mt-8" onSubmit={handleSubmit(onSubmit)}>
              <Input
              required
              label="Email"
                type="email"
                placeholder="info@gmail.com"
                {...register("email")}
                error={!!errors.email}
                hint={errors.email?.message}
              />

              <div className="relative">
                <Input
                required
                label="Password "
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  error={!!errors.password}
                  hint={errors.password?.message}
                />

                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 mt-6 text-gray-500" />
                  ) : (
                    <EyeIcon className="w-5 h-5 mt-6 text-gray-500" />
                  )}
                </span>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={signInMutation.isPending}
                className="w-full py-3 bg-black text-white rounded-lg"
              >
                {signInMutation.isPending ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
