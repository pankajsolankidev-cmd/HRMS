import { useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
  }>({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("http://192.168.1.33:4000/auth/register", formData, {
        headers: { "Content-Type": "application/json" },
      });

      setSuccess("Account created successfully. Please sign in.");

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: Form */}
        <div className="p-6 sm:p-8">
          
          <h1 className="text-2xl font-semibold mt-6 text-gray-800 dark:text-white">
            Sign Up
          </h1>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

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
              disabled={loading}
              className="w-full py-3 bg-black text-white rounded-lg"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        </div>

        {/* Right: Info Panel */}
        <motion.div
          initial={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="relative z-10 hidden md:flex flex-col justify-center items-center bg-black text-white p-8"
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
      </div>
    </div>
  );
}
