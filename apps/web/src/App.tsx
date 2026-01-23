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

import AddEmployee from "./pages/EmployeeTable/AddEditEmployee";
import Employee from "./pages/EmployeeTable/Employee";

import AddEditComponent from "./pages/ComponentTable/AddEditComponent";
import Component from "./pages/ComponentTable/Component";

import AddEditSystem from "./pages/SystemTable/AddEditSystem";
import System from "./pages/SystemTable/System";

import { ScrollToTop } from "./components/common/ScrollToTop";

import AddEditSalary from "./pages/SalaryTable/AddEditSalary";
import Salary from "./pages/SalaryTable/Salary";

import AddEditPayroll from "./pages/PayrollTable/AddEditPayroll";
import Payroll from "./pages/PayrollTable/Payroll";

import AddEditLeave from "./pages/LeaveTable/AddEditLeave";
import Leave from "./pages/LeaveTable/Leave";

import { Toaster } from "react-hot-toast";
import SmallAuthLayout from "./layout/SmallAuthLayout";
import AddEditExpense from "./pages/ExpenseTable/AddEditExpense";
import Expense from "./pages/ExpenseTable/Expense";
import ProtectedRoute from "./pages/OtherPage/ProtectedRoute";
import RootRedirect from "./pages/OtherPage/RootRedirect";
import ForgetPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SignInForm from "./pages/auth/SignInForm";
import SignUpForm from "./pages/auth/SignUpForm";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignInForm />} />
          <Route path="/signup" element={<SignUpForm />} />
        </Route>
        <Route element={<SmallAuthLayout />}>
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Home />} />

          <Route path="/employees" element={<Employee />} />
          <Route path="/employees/:id" element={<AddEmployee />} />

          <Route path="/components" element={<Component />} />
          <Route path="/components/:id" element={<AddEditComponent />} />

          <Route path="/systems" element={<System />} />
          <Route path="/systems/:id" element={<AddEditSystem />} />

          <Route path="/salary" element={<Salary />} />
          <Route path="/salary/:id" element={<AddEditSalary />} />

          <Route path="/payrolls" element={<Payroll />} />
          <Route path="/payrolls/:id" element={<AddEditPayroll />} />

          <Route path="/leave-requests" element={<Leave />} />
          <Route path="/leave-requests/:id" element={<AddEditLeave />} />

          <Route path="/expenses" element={<Expense />} />
          <Route path="/expenses/:id" element={<AddEditExpense />} />
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
          duration: 4000,
          style: {
            marginTop: "60px",
            fontSize: "14px",
          },
        }}
      />
      <ScrollToTop />
      <AnimatedRoutes />
    </Router>
  );
}
