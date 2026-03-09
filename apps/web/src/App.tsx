import { AnimatePresence } from "framer-motion";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router";

import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthPageLayout";

import NotFound from "./pages/OtherPage/NotFound";
import PublicRoute from "./pages/OtherPage/PublicRoute";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setAuth } from "./context/authSlice";
import { useSocket } from "./context/useSocket";
import SmallAuthLayout from "./layout/SmallAuthLayout";
import ForgetPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SignInForm from "./pages/auth/SignInForm";
import ComponentForm from "./pages/Component/ComponentForm";
import ComponentTable from "./pages/Component/ComponentTable";
import RoleDashboard from "./pages/Dashboard/RoleDashboard";
import DepartmentForm from "./pages/Department/DepartmentForm";
import DepartmentTable from "./pages/Department/DepartmentTable";
import EmployeeForm from "./pages/Employee/EmployeeForm";
import EmployeeTable from "./pages/Employee/EmployeeTable";
import ExpenseForm from "./pages/Expense/ExpenseForm";
import ExpenseTable from "./pages/Expense/ExpenseTable";
import EmployeeLeavePage from "./pages/Leaves/EmployeeLeavePage";
import LeaveTable from "./pages/Leaves/LeaveTable";
import SelfLeavePage from "./pages/Leaves/SelfLeavePage";
import OrganizationForm from "./pages/Organization/OrganizationForm";
import OrganizationTable from "./pages/Organization/OrganizationTable";
import NotificationsPage from "./pages/OtherPage/NotificationsPage";
import ProtectedRoute from "./pages/OtherPage/ProtectedRoute";
import RootRedirect from "./pages/OtherPage/RootRedirect";
import PayrollHistory from "./pages/Payroll/PayrollHistory";
import PayrollTable from "./pages/Payroll/PayrollTable";
import ProjectDetail from "./pages/Project/ProjectDetail";
import ProjectForm from "./pages/Project/ProjectForm";
import ProjectTable from "./pages/Project/ProjectTable";
import PublicHolidayForm from "./pages/PublicHoliday/PublicHolidayForm";
import PublicHolidayTable from "./pages/PublicHoliday/PublicHolidayTable";
import SalaryForm from "./pages/Salary/SalaryForm";
import SalaryTable from "./pages/Salary/SalaryTable";
import SystemForm from "./pages/System/SystemForm";
import SystemTable from "./pages/System/SystemTable";
import UserProfile from "./pages/UserProfile/UserProfile";

function AppRoutes() {
  useSocket();
  const dispatch = useDispatch();

  useEffect(() => {
    const savedAuth = localStorage.getItem("auth");
    if (savedAuth) {
      dispatch(setAuth(JSON.parse(savedAuth)));
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignInForm />} />
        </Route>
        <Route element={<SmallAuthLayout />}>
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route path="/leave-requests" element={<LeaveTable />} />
          <Route path="/leave-requests/:id" element={<SelfLeavePage />} />
          <Route path="/expenses" element={<ExpenseTable />} />
          <Route path="/expenses/:id" element={<ExpenseForm />} />
          <Route path="/payrolls/history" element={<PayrollHistory />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/holidays" element={<PublicHolidayTable />} />

          <Route element={<ProtectedRoute allowedRoles={["ADMIN", "HR"]} />}>
            <Route path="/employees" element={<EmployeeTable />} />
            <Route path="/employees/:id" element={<EmployeeForm />} />

            <Route path="/components" element={<ComponentTable />} />
            <Route path="/components/:id" element={<ComponentForm />} />

            <Route path="/systems" element={<SystemTable />} />
            <Route path="/systems/:id" element={<SystemForm />} />

            <Route path="/salary" element={<SalaryTable />} />
            <Route path="/salary/:id" element={<SalaryForm />} />

            <Route
              path="/leave-requests/manual/:id"
              element={<EmployeeLeavePage />}
            />

            <Route path="/payrolls" element={<PayrollTable />} />

            <Route path="/organization" element={<OrganizationTable />} />
            <Route path="/organization/:id" element={<OrganizationForm />} />

            <Route path="/departments" element={<DepartmentTable />} />
            <Route path="/departments/:id" element={<DepartmentForm />} />

            <Route path="/projects" element={<ProjectTable />} />
            <Route path="/projects/:id" element={<ProjectForm />} />
            <Route path="/projects/:id/employees" element={<ProjectDetail />} />

            <Route path="/holidays/:id" element={<PublicHolidayForm />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  const noAnimationRoutes = ["/forgot-password"];
  const shouldAnimate = !noAnimationRoutes.includes(location.pathname);

  if (!shouldAnimate) {
    return <AppRoutes />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="*" element={<AppRoutes />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            marginTop: "15px",
            fontSize: "15px",
          },
        }}
        containerStyle={{
          zIndex: 99999,
        }}
      />
      <AnimatedRoutes />
    </Router>
  );
}
