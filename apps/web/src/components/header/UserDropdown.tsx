import { IconChevronDown, IconLogout, IconSettings } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import Cookies from "js-cookie";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { logoutUser } from "../../api/post";
import type { RootState } from "../../context";
import { disconnectSocket } from "../../context/socket";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { email } = useSelector((state: RootState) => state.auth);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  const navigate = useNavigate();

  const { mutate: logout } = useMutation({
    mutationFn: logoutUser,
    onSuccess: (data) => {
      disconnectSocket();
      toast.success(data?.message ?? "Logged out successfully");
      Cookies.remove("access");
      Cookies.remove("refresh");
      navigate("/signin");
    },

    onError: (error: AxiosError<{ message?: string }>) => {
      disconnectSocket();
      toast.error(error?.response?.data?.message ?? "Invalid credentials");
      Cookies.remove("access");
      Cookies.remove("refresh");
      navigate("/signin");
    },
  });

  const handleLogout = () => {
    const refreshToken = Cookies.get("refresh");

    disconnectSocket();

    if (!refreshToken) {
      toast.success("Logged out");
      Cookies.remove("access");
      Cookies.remove("refresh");
      navigate("/signin");
      return;
    }

    logout(refreshToken);
  };
  const initials = email
    ? email
        .split("@")[0]
        .split(/[\.\_\-]/)
        .map((word) => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "US";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm shadow-md">
          {initials}
        </div>

        <span className="block mr-1 font-medium text-theme-sm">
          {email ?? "User"}
        </span>
        <IconChevronDown
          size={18}
          className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {email ?? "User"}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <IconSettings
                size={20}
                className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
              />
              profile
            </DropdownItem>
          </li>
        </ul>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
        >
          <IconLogout
            size={20}
            className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
          />
          Logout
        </button>
      </Dropdown>
    </div>
  );
}
