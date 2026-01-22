import { Outlet } from "react-router";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 relative">
      <div className="relative w-full max-w-4xl h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <Outlet />
      </div>

      <div className="fixed bottom-6 right-6 z-[9999]">
        <ThemeToggleButton />
      </div>
    </div>
  );
}
