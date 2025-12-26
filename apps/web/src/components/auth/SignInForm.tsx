import { useState } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { signInApi } from "../../api/post";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return "Invalid email address";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    return "";
  };

  const signInMutation = useMutation({
    mutationFn: signInApi,
    onSuccess: (res) => {
      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      throw new Error(msg);
    }

    signInMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      {/* 🔒 FIXED CARD */}
      <div className="relative w-full max-w-4xl h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">

        {/* 🔥 LEFT OVERLAY PANEL (UNCHANGED) */}
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "0%" }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute left-0 top-0 h-full w-1/2 bg-black text-white z-20 hidden md:flex flex-col justify-center items-center p-8"
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

        {/* BASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">

          <div className="hidden md:block" />

          {/* RIGHT FORM */}
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Sign In
            </h1>

            {/* ✅ TanStack error */}
            {signInMutation.isError && (
              <p className="text-red-500 text-sm mt-4">
                {(signInMutation.error as any)?.response?.data?.message ||
                  (signInMutation.error as Error).message}
              </p>
            )}

            <form className="space-y-5 mt-8" onSubmit={handleSubmit}>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="info@gmail.com"
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

              <div className="flex justify-end">
                <Link
                  to="/forget-password"
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
