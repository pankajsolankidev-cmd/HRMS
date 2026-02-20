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

import Home from "./pages/Dashboard/Home";
import NotFound from "./pages/OtherPage/NotFound";
import PublicRoute from "./pages/OtherPage/PublicRoute";

import { ScrollToTop } from "./components/common/ScrollToTop";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setAuth } from "./context/authSlice";
import SmallAuthLayout from "./layout/SmallAuthLayout";
import ForgetPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SignInForm from "./pages/auth/SignInForm";
import AddEditComponentPage from "./pages/Component/AddEditComponentPage";
import ComponentPage from "./pages/Component/ComponentPage";
import DepartmentForm from "./pages/Department/DepartmentForm";
import DepartmentTable from "./pages/Department/DepartmentTable";
import AddEditEmployeePage from "./pages/Employee/AddEditEmployeePage";
import EmployeePage from "./pages/Employee/EmployeePage";
import AddEditExpensePage from "./pages/Expense/AddEditExpensePage";
import Expense from "./pages/Expense/Expense";
import EmployeeLeavePage from "./pages/Leaves/EmployeeLeavePage";
import LeavePage from "./pages/Leaves/LeavePage";
import SelfLeavePage from "./pages/Leaves/SelfLeavePage";
import OrganizationForm from "./pages/Organization/OrganizationForm";
import OrganizationTable from "./pages/Organization/OrganizationTable";
import ProtectedRoute from "./pages/OtherPage/ProtectedRoute";
import RootRedirect from "./pages/OtherPage/RootRedirect";
import PayrollHistory from "./pages/Payroll/PayrollHistory";
import PayrollTable from "./pages/Payroll/PayrollTable";
import ProjectDetail from "./pages/Project/ProjectDetail";
import ProjectForm from "./pages/Project/ProjectForm";
import ProjectTable from "./pages/Project/ProjectTable";
import AddEditSalaryPage from "./pages/Salary/AddEditSalaryPage";
import SalaryPage from "./pages/Salary/SalaryPage";
import AddEditSystemPage from "./pages/System/AddEditSystemPage";
import SystemPage from "./pages/System/SystemPage";
import UserProfile from "./pages/UserProfile/UserProfile";

function AppRoutes() {
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
          <Route path="/dashboard" element={<Home />} />

          <Route path="/employees" element={<EmployeePage />} />
          <Route path="/employees/:id" element={<AddEditEmployeePage />} />

          <Route path="/components" element={<ComponentPage />} />
          <Route path="/components/:id" element={<AddEditComponentPage />} />

          <Route path="/systems" element={<SystemPage />} />
          <Route path="/systems/:id" element={<AddEditSystemPage />} />

          <Route path="/salary" element={<SalaryPage />} />
          <Route path="/salary/:id" element={<AddEditSalaryPage />} />

          <Route path="/leave-requests" element={<LeavePage />} />
          <Route path="/leave-requests/:id" element={<SelfLeavePage />} />
          <Route
            path="/leave-requests/manual/:id"
            element={<EmployeeLeavePage />}
          />

          <Route path="/payrolls" element={<PayrollTable />} />
          <Route path="/payrolls/history" element={<PayrollHistory />} />

          <Route path="/expenses" element={<Expense />} />
          <Route path="/expenses/:id" element={<AddEditExpensePage />} />

          <Route path="/organization" element={<OrganizationTable />} />
          <Route path="/organization/:id" element={<OrganizationForm />} />

          <Route path="/departments" element={<DepartmentTable />} />
          <Route path="/departments/:id" element={<DepartmentForm />} />

          <Route path="/projects" element={<ProjectTable />} />
          <Route path="/projects/:id" element={<ProjectForm />} />
          <Route path="/projects/:id/employees" element={<ProjectDetail />} />

          <Route path="/profile" element={<UserProfile />} />
          <Route path="/" element={<NotFound />} />
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
      <ScrollToTop />
      <AnimatedRoutes />
    </Router>
  );
}
