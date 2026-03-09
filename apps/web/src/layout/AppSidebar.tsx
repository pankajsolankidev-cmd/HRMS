import { useState } from "react";
import { useSelector } from "react-redux";

import GridIcon from "../assets/icons/grid.svg?react";
import HorizontaLDots from "../assets/icons/horizontal-dots.svg?react";

import {
  CalendarIcon,
  ChevronDownIcon,
  FolderIcon,
  PuzzlePieceIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  IconBuilding,
  IconCalendarStar,
  IconCash,
  IconHistory,
  IconReceiptRupee,
  IconWallet,
} from "@tabler/icons-react";

import { Link, useLocation } from "react-router";
import type { RootState } from "../context";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  children?: {
    name: string;
    path: string;
  }[];
};

const ADMIN_MENU: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  { icon: <UserCircleIcon />, name: "Employees", path: "/employees" },
  { icon: <PuzzlePieceIcon />, name: "Component", path: "/components" },
  { icon: <FolderIcon />, name: "System", path: "/systems" },
  { icon: <CalendarIcon />, name: "Leaves", path: "/leave-requests" },
  { icon: <IconReceiptRupee />, name: "Salary", path: "/salary" },
  {
    icon: <IconCash />,
    name: "Payroll",
    children: [
      { name: "Payroll", path: "/payrolls" },
      { name: "Payroll History", path: "/payrolls/history" },
    ],
  },
  { icon: <IconWallet />, name: "Expenses", path: "/expenses" },
  {
    icon: <IconBuilding />,
    name: "Organization",
    children: [
      { name: "Organization", path: "/Organization" },
      { name: "Departments", path: "/departments" },
      { name: "Projects", path: "/projects" },
      { name: "Holidays", path: "/holidays" },
    ],
  },
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const isEmployee = roles.includes("EMPLOYEE");

  const menuItems = isEmployee ? EMPLOYEE_MENU : ADMIN_MENU;

  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();

  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen border-r border-gray-200 bg-white text-gray-900 transition-all duration-300 dark:border-gray-800 dark:bg-gray-900
    ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0 flex flex-col`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 shrink-0 flex items-center ${
          isExpanded || isHovered || isMobileOpen
            ? "px-5 justify-start"
            : "justify-center"
        }`}
      >
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
                src="/images/logo/hrms-dark.svg"
                alt="Logo"
                width={200}
              />
            </>
          ) : (
            <img src="/images/logo/logo-icon.svg" alt="Logo" width={32} />
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 pb-6 no-scrollbar">
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

        <ul className="flex flex-col gap-2">
          {menuItems.map((nav) => {
            const isChildActive = nav.children?.some((child) =>
              location.pathname.startsWith(child.path),
            );

            const isParentOpen = openMenu === nav.name || isChildActive;

            return (
              <li key={nav.name}>
                {nav.children ? (
                  <>
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === nav.name ? null : nav.name)
                      }
                      className={`menu-item flex justify-between w-full ${
                        isParentOpen ? "menu-item-active" : "menu-item-inactive"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="menu-item-icon-size">{nav.icon}</span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className="menu-item-text">{nav.name}</span>
                        )}
                      </div>

                      {(isExpanded || isHovered || isMobileOpen) && (
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isParentOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    <div
                      className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
                        isParentOpen ? "max-h-60" : "max-h-0"
                      }`}
                    >
                      <ul className="ml-9 mt-3 pb-2 space-y-3">
                        {nav.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              to={child.path}
                              className={`block text-sm transition-colors ${
                                location.pathname.startsWith(child.path)
                                  ? "text-primary font-medium"
                                  : "text-gray-500 hover:text-gray-800"
                              }`}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Link
                    to={nav.path!}
                    className={`menu-item ${
                      location.pathname === nav.path
                        ? "menu-item-active"
                        : "menu-item-inactive"
                    }`}
                  >
                    <span className="menu-item-icon-size">{nav.icon}</span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AppSidebar;
