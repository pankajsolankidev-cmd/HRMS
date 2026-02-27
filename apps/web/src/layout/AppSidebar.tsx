import { useCallback } from "react";
import { useSelector } from "react-redux";

import GridIcon from "../assets/icons/grid.svg?react";
import HorizontaLDots from "../assets/icons/horizontal-dots.svg?react";

import {
  CalendarIcon,
  FolderIcon,
  PuzzlePieceIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  IconBriefcase,
  IconBuilding,
  IconBuildingCommunity,
  IconCalendarStar,
  IconHistory,
  IconReceiptRupee,
  IconWallet,
} from "@tabler/icons-react";

import { Link, useLocation } from "react-router";
import type { RootState } from "../context";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const ADMIN_MENU: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  { icon: <UserCircleIcon />, name: "Employees", path: "/employees" },
  { icon: <PuzzlePieceIcon />, name: "Component", path: "/components" },
  { icon: <FolderIcon />, name: "System", path: "/systems" },
  { icon: <IconCalendarStar />, name: "Holidays", path: "/holidays" },
  { icon: <CalendarIcon />, name: "Leaves", path: "/leave-requests" },
  { icon: <IconReceiptRupee />, name: "Salary", path: "/salary" },
  { icon: <IconWallet />, name: "Expenses", path: "/expenses" },
  { icon: <IconReceiptRupee />, name: "Payrolls", path: "/payrolls" },
  { icon: <IconHistory />, name: "Payroll History", path: "/payrolls/history" },
  { icon: <IconBriefcase />, name: "Projects", path: "/projects" },
  {
    icon: <IconBuildingCommunity />,
    name: "Departments",
    path: "/departments",
  },
  { icon: <IconBuilding />, name: "Organization", path: "/organization" },
];

const EMPLOYEE_MENU: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  { icon: <CalendarIcon />, name: "Leaves", path: "/leave-requests" },
  { icon: <IconWallet />, name: "Expenses", path: "/expenses" },
  { icon: <IconHistory />, name: "Payroll History", path: "/payrolls/history" },
  { icon: <IconCalendarStar />, name: "Holidays", path: "/holidays" },
];

const AppSidebar: React.FC = () => {
  const roles = useSelector((state: RootState) => state.auth.roles);

  const isEmployee = roles.includes("EMPLOYEE");

  const menuItems = isEmployee ? EMPLOYEE_MENU : ADMIN_MENU;

  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();

  const location = useLocation();

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 dark:border-gray-800 dark:bg-gray-900
        ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="py-8 flex justify-center lg:justify-start">
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/hrms.svg"
                alt="Logo"
                width={200}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
              />
            </>
          ) : (
            <img src="/images/logo/logo-icon.svg" alt="Logo" width={32} />
          )}
        </Link>
      </div>

      <nav className="overflow-y-auto">
        <h2
          className={`mb-4 flex text-xs uppercase text-gray-400 ${
            !isExpanded && !isHovered ? "justify-center" : "justify-start"
          }`}
        >
          {isExpanded || isHovered || isMobileOpen ? (
            "Menu"
          ) : (
            <HorizontaLDots />
          )}
        </h2>

        <ul className="flex flex-col gap-4">
          {menuItems.map((nav) => (
            <li key={nav.name}>
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span className="menu-item-icon-size">{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AppSidebar;
