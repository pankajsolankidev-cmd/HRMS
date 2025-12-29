import { Outlet } from "react-router";

export default function AuthLayout() {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };
  return (
    <div className="relative p-6 bg-white dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        <Outlet/>
      </div>
       <button
        onClick={toggleDarkMode}
        className="fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg"
      >
        🌙
      </button>
    </div>
  );
}
