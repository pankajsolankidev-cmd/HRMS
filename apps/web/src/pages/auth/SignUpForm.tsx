import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { signUpApi } from "../../api/post";
import Input from "../../components/form/input/InputField";

const signUpSchema = z.object({
  username: z.string().min(1, "Username is required"),

  email: z
    .email({ message: "Invalid email address" })
    .min(1, "Email is required"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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
    onSuccess: (res) => {
      toast.success(res?.message ?? "Account created successfully");
      navigate("/signin", { replace: true });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message ?? "Sign up failed. Please try again."
      );
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    signUpMutation.mutate(data);
  };

  return (
    <>
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
        <div className="p-6 sm:p-8 flex flex-col justify-center dark:text-gray-400">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Sign Up
          </h1>

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
                onClick={() => setShowPassword((prev) => !prev)}
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
    </>
  );
}
