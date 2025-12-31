import { Outlet, useNavigate } from "react-router";
import Cookies from "js-cookie";

export default function PublicRoute() {
  const navigate = useNavigate();
  const token = Cookies.get("access");
  if (token) {
    navigate("/dashboard", { replace: true });
  }
  return <Outlet />;
}
