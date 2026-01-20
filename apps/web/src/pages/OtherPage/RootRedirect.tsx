import { Navigate } from "react-router";
import Cookies from "js-cookie";

export default function RootRedirect() {
  const token = Cookies.get("access");

  return token ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/signin" replace />
  );
}
