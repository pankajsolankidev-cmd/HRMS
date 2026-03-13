import { useSelector } from "react-redux";
import type { RootState } from "../../context";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

export default function RoleDashboard() {
  const roles = useSelector((state: RootState) => state.auth.roles);

  if (roles.includes("EMPLOYEE")) {
    return <EmployeeDashboard />;
  }

  if (roles.includes("ADMIN") || roles.includes("HR")) {
    return <AdminDashboard />;
  }
}
