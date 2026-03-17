import { signInApi } from "@/api/post";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInForm from "../../pages/auth/SignInForm";
import {
  clickButton,
  mockPending,
  renderWithProviders,
  typeInput,
} from "./AuthUtils";

vi.mock("@/api/post", () => ({
  signInApi: vi.fn(),
}));

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("js-cookie", () => ({
  default: {
    set: vi.fn(),
  },
}));

describe("SignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Sign In form correctly", () => {
    renderWithProviders(<SignInForm />);

    expect(
      screen.getByRole("heading", { name: "Sign In" }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("info@gmail.com")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password"),
    ).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    renderWithProviders(<SignInForm />);

    clickButton("Sign In");

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("shows error for invalid email", async () => {
    renderWithProviders(<SignInForm />);

    await typeInput("info@gmail.com", "invalid-email");
    await typeInput("Enter your password", "123456");

    clickButton("Sign In");

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  it("calls API, sets cookies, dispatches and navigates", async () => {
    (signInApi as any).mockResolvedValue({
      accessToken: "token123",
      refreshToken: "refresh123",
      roles: [],
      permissions: [],
      id: 1,
      email: "test@gmail.com",
      message: "Login success",
    });

    renderWithProviders(<SignInForm />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await typeInput("Enter your password", "123456");

    clickButton("Sign In");

    await waitFor(() => {
      expect(signInApi).toHaveBeenCalled();

      expect(mockDispatch).toHaveBeenCalled();

      expect(Cookies.set).toHaveBeenCalledWith("access", "token123");
      expect(Cookies.set).toHaveBeenCalledWith("refresh", "refresh123");

      expect(toast.success).toHaveBeenCalledWith("Login success");

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      });
    });
  });

  it("shows error toast on API failure", async () => {
    (signInApi as any).mockRejectedValue({
      response: {
        data: { message: "Invalid credentials" },
      },
    });

    renderWithProviders(<SignInForm />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await typeInput("Enter your password", "123456");

    clickButton("Sign In");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("shows loading state while signing in", async () => {
    mockPending(signInApi);

    renderWithProviders(<SignInForm />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await typeInput("Enter your password", "123456");

    clickButton("Sign In");

    await waitFor(() => {
      const loadingBtn = screen.getByRole("button", {
        name: "Signing In...",
      });

      expect(loadingBtn).toBeInTheDocument();
      expect(loadingBtn).toBeDisabled();
    });
  });

  it("toggles password visibility", async () => {
    renderWithProviders(<SignInForm />);

    const passwordInput = screen.getByPlaceholderText(
      "Enter your password",
    ) as HTMLInputElement;

    expect(passwordInput.type).toBe("password");

    const toggleBtn = document.querySelector(
      "span.cursor-pointer",
    ) as HTMLElement;

    await userEvent.click(toggleBtn);

    await waitFor(() => {
      expect(passwordInput.type).toBe("text");
    });

    await userEvent.click(toggleBtn);

    await waitFor(() => {
      expect(passwordInput.type).toBe("password");
    });
  });
});
