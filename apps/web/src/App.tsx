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
import AppLayout from "./layout/AppLayout";
import Home from "./pages/Dashboard/Home";
import NotFound from "./pages/OtherPage/NotFound";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./pages/OtherPage/ProtectedRoute";
import ResetPassword from "./components/auth/ResetPassword";
import PublicRoute from "./pages/OtherPage/PublicRoute";
import Employee from "./pages/EmployeeTable/Employee";
import AddEmployee from "./pages/EmployeeTable/AddEditEmployee";
import AuthLayout from "./pages/AuthPages/AuthPageLayout";

function AppRoutes() {
  return (
    <Routes>
      {/* 🔓 PUBLIC ROUTES */}
      <Route element={<PublicRoute />}>
      <Route element={<AuthLayout/>}>
        <Route path="/" element={<SignInForm />} />
        <Route path="/signin" element={<SignInForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>
      </Route>

      {/* 🔐 PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/employees" element={<Employee />} />
          <Route path="/add-employee" element={<AddEmployee />} />
          <Route path="/employees/:id" element={<AddEmployee />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  const noAnimationRoutes = ["/forget-password"];
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
