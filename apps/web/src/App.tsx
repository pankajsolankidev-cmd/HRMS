import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router";
import { AnimatePresence } from "framer-motion";

import SignInForm from "./components/auth/SignInForm";
import SignUpForm from "./components/auth/SignUpForm";
import ForgetPassword from "./components/auth/ForgetPassword";
import ResetPassword from "./components/auth/ResetPassword";

import AppLayout from "./layout/AppLayout";
import AuthLayout from "./pages/AuthPages/AuthPageLayout";

import Home from "./pages/Dashboard/Home";
import NotFound from "./pages/OtherPage/NotFound";
import ProtectedRoute from "./pages/OtherPage/ProtectedRoute";
import PublicRoute from "./pages/OtherPage/PublicRoute";

import Employee from "./pages/EmployeeTable/Employee";
import AddEmployee from "./pages/EmployeeTable/AddEditEmployee";

import Component from "./pages/ComponentTable/Component";
import AddEditComponent from "./pages/ComponentTable/AddEditComponent";

import System from "./pages/SystemTable/System";
import AddEditSystem from "./pages/SystemTable/AddEditSystem";

import { ScrollToTop } from "./components/common/ScrollToTop";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<SignInForm />} />
          <Route path="/signin" element={<SignInForm />} />
          <Route path="/signup" element={<SignUpForm />} />
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
      <ScrollToTop />
      <AnimatedRoutes />
    </Router>
  );
}
