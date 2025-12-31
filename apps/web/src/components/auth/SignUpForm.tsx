import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../form/input/InputField";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { signUpApi } from "../../api/post";
import { useState } from "react";

/* ---------------- ZOD SCHEMA ---------------- */
const signUpSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: signUpApi,
    onSuccess: () => {
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1500);
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    signUpMutation.mutate(data);

  };

  return (
    <div className="w-500 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="relative w-full max-w-4xl h-[500px] bg-white  dark:bg-gray-900  rounded-2xl shadow-lg overflow-hidden">

        {/* 🔥 RIGHT OVERLAY PANEL */}
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "0%" }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute right-0 top-0 h-full w-1/2 bg-black dark:bg-gray-800 text-white z-20 hidden md:flex flex-col justify-center items-center p-8"
        >
          <h2 className="text-3xl font-semibold mb-4">Welcome Back!</h2>
          <p className="text-sm text-center mb-6">
            Already have an account? Sign in to continue.
          </p>

          <Link
            to="/signin"
            className="px-6 py-2 rounded-lg text-black bg-white font-medium hover:bg-yellow-300 transition"
          >
            Go to Sign In
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* LEFT FORM */}
          <div className="p-6 sm:p-8 flex flex-col justify-center  dark:bg-gray-950 dark:text-gray-400">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Sign Up
            </h1>

            {signUpMutation.isError && (
              <p className="text-red-500 text-sm mt-4">
                {(signUpMutation.error as any)?.response?.data?.message ||
                  (signUpMutation.error as Error).message}
              </p>
            )}

            {signUpMutation.isSuccess && (
              <p className="text-green-500 text-sm mt-4">
                Account created successfully. Redirecting...
              </p>
            )}

            <form className="space-y-5 mt-6" onSubmit={handleSubmit(onSubmit)}>

              <Input
              required
              label="Username"
                placeholder="Enter your full name"
                {...register("username")}
                error={!!errors.username}
                hint={errors.username?.message}
              />

              <Input
              required
              label="Email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                error={!!errors.email}
                hint={errors.email?.message}
              />

              <div className="relative">
                <Input
                required
                label="Password"
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

              <button
                type="submit"
                disabled={signUpMutation.isPending}
                className="w-full py-3 bg-black text-white rounded-lg"
              >
                {signUpMutation.isPending ? "Signing Up..." : "Sign Up"}
              </button>
            </form>
          </div>

          <div className="hidden md:block" />
        </div>
      </div>
    </div>
  );
}
