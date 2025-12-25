import { Navigate, Outlet } from "react-router";

export default function PublicRoute() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
