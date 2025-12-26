import { useState } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { signUpApi } from "../../api/post";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.username) return "Username is required";
    if (!formData.email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return "Invalid email address";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    return "";
  };

  const signUpMutation = useMutation({
    mutationFn: signUpApi,
    onSuccess: () => {
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1500);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      throw new Error(msg);
    }

    signUpMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      {/* 🔒 FIXED CARD */}
      <div className="relative w-full max-w-4xl h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">

        {/* 🔥 RIGHT OVERLAY PANEL (UNCHANGED) */}
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "0%" }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute right-0 top-0 h-full w-1/2 bg-black text-white z-20 hidden md:flex flex-col justify-center items-center p-8"
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
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Sign Up
            </h1>

            {/* ✅ TanStack error */}
            {signUpMutation.isError && (
              <p className="text-red-500 text-sm mt-4">
                {(signUpMutation.error as any)?.response?.data?.message ||
                  (signUpMutation.error as Error).message}
              </p>
            )}

            {/* ✅ TanStack success */}
            {signUpMutation.isSuccess && (
              <p className="text-green-500 text-sm mt-4">
                Account created successfully. Redirecting...
              </p>
            )}

            <form className="space-y-5 mt-6" onSubmit={handleSubmit}>
              <div>
                <Label>Username *</Label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
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
