import { Outlet } from "react-router";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

export default function SmallAuthLayout() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 relative">
        <div className="relative p-6 sm:p-8 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <Outlet />
        </div>

        <div className="fixed bottom-6 right-6 z-[9999]">
          <ThemeToggleButton />
        </div>
      </div>
    </>
  );
}
