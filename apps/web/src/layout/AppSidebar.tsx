import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router";

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

import type { RootState } from "../context";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  children?: { name: string; path: string }[];
};

export default function AppSidebar() {
  const location = useLocation();
  const roles = useSelector((state: RootState) => state.auth.roles);
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const showText = isExpanded || isHovered || isMobileOpen;
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const isEmployee = roles.includes("EMPLOYEE");

  const MENU: NavItem[] = isEmployee
    ? [
        { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
        { icon: <CalendarIcon />, name: "Leaves", path: "/leave-requests" },
        { icon: <IconWallet />, name: "Expenses", path: "/expenses" },
        {
          icon: <IconHistory />,
          name: "Payroll History",
          path: "/payrolls/history",
        },
        { icon: <IconCalendarStar />, name: "Holidays", path: "/holidays" },
      ]
    : [
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
            { name: "Organization", path: "/organization" },
            { name: "Departments", path: "/departments" },
            { name: "Projects", path: "/projects" },
            { name: "Holidays", path: "/holidays" },
          ],
        },
      ];

  const isActive = (path?: string) =>
    path &&
    (location.pathname === path || location.pathname.startsWith(path + "/"));

  useEffect(() => {
    const parent = MENU.find((nav) =>
      nav.children?.some((child) => isActive(child.path)),
    );

    if (parent) setOpenMenu(parent.name);
  }, [location.pathname]);

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800
      transition-all duration-300 flex flex-col
      ${showText ? "w-[280px]" : "w-[90px]"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex items-center ${
          showText ? "px-5 justify-start" : "justify-center"
        }`}
      >
        <Link to="/dashboard">
          {showText ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/hrms.svg"
                width={200}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/hrms-dark.svg"
                width={200}
              />
            </>
          ) : (
            <img src="/images/logo/logo-icon.svg" width={32} />
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 pb-6 no-scrollbar">
        <h2
          className={`mb-4 flex text-xs uppercase text-gray-400 ${
            showText ? "justify-start" : "justify-center"
          }`}
        >
          {showText ? "Menu" : <HorizontaLDots />}
        </h2>

        <ul className="flex flex-col gap-2">
          {MENU.map((nav) => {
            const childActive = nav.children?.some((child) =>
              isActive(child.path),
            );

            const isParentOpen = openMenu === nav.name;

            if (nav.children) {
              return (
                <li key={nav.name}>
                  <button
                    onClick={() => setOpenMenu(isParentOpen ? null : nav.name)}
                    className={`menu-item flex justify-between w-full ${
                      childActive ? "menu-item-active" : "menu-item-inactive"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="menu-item-icon-size">{nav.icon}</span>
                      {showText && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </div>

                    {showText && (
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform ${
                          isParentOpen ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isParentOpen ? "max-h-60 mt-2" : "max-h-0"
                    }`}
                  >
                    <ul className="ml-9 space-y-3 pb-2">
                      {nav.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            to={child.path}
                            className={`block text-sm ${
                              isActive(child.path)
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
                </li>
              );
            }

            return (
              <li key={nav.name}>
                <Link
                  to={nav.path!}
                  className={`menu-item ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span className="menu-item-icon-size">{nav.icon}</span>

                  {showText && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
