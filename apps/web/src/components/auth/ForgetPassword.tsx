import { useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import Label from "../form/Label";
import Input from "../form/input/InputField";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await axios.post(
        "http://192.168.1.35:4000/auth/forgot-password",
        { email },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setMessage("Password reset link has been sent to your email.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-500 text-sm mb-4">{message}</p>}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <Label>Email *</Label>
            <input></input>
            <Input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@gmail.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white rounded-lg hover:opacity-90 transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgetPassword;
