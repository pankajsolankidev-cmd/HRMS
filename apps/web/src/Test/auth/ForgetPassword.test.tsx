import { forgetPassword } from "@/api/post";
import { screen, waitFor } from "@testing-library/react";
import { toast } from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForgetPassword from "../../pages/auth/ForgetPassword";
import {
  clickButton,
  mockPending,
  renderWithProviders,
  typeInput,
} from "./AuthUtils";

vi.mock("@/api/post", () => ({
  forgetPassword: vi.fn(),
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

describe("ForgetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form correctly", () => {
    renderWithProviders(<ForgetPassword />);

    expect(
      screen.getByRole("heading", { name: "Forgot Password" }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("info@gmail.com")).toBeInTheDocument();
  });

  it("shows validation error for empty email", async () => {
    renderWithProviders(<ForgetPassword />);

    await clickButton("Send Reset Link");

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  it("calls API on valid submit", async () => {
    (forgetPassword as any).mockResolvedValue({
      message: "Success",
    });

    renderWithProviders(<ForgetPassword />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await clickButton("Send Reset Link");

    await waitFor(() => {
      expect(forgetPassword).toHaveBeenCalledWith("test@gmail.com");
    });
  });

  it("shows reset button when key received", async () => {
    (forgetPassword as any).mockResolvedValue({
      message: "Success",
      key: "abc123",
    });

    renderWithProviders(<ForgetPassword />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await clickButton("Send Reset Link");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Go to Reset Password" }),
      ).toBeInTheDocument();
    });
  });

  it("handles API pending state (API called)", async () => {
    mockPending(forgetPassword);

    renderWithProviders(<ForgetPassword />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await clickButton("Send Reset Link");

    await waitFor(() => {
      expect(forgetPassword).toHaveBeenCalled();
    });
  });

  it("navigates to reset password page when clicking reset button", async () => {
    (forgetPassword as any).mockResolvedValue({
      message: "Success",
      key: "abc123",
    });

    renderWithProviders(<ForgetPassword />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await clickButton("Send Reset Link");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Go to Reset Password" }),
      ).toBeInTheDocument();
    });
    await clickButton("Go to Reset Password");
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/reset-password/abc123");
    });
  });

  it("shows error toast on API failure", async () => {
    (forgetPassword as any).mockRejectedValue({
      response: {
        data: { message: "Failed to send reset link" },
      },
    });

    renderWithProviders(<ForgetPassword />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await clickButton("Send Reset Link");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("shows success toast on successful API response", async () => {
    (forgetPassword as any).mockResolvedValue({
      message: "Reset link sent",
      key: "abc123",
    });

    renderWithProviders(<ForgetPassword />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await clickButton("Send Reset Link");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("shows loading state while sending reset link", async () => {
    mockPending(forgetPassword);

    renderWithProviders(<ForgetPassword />);

    await typeInput("info@gmail.com", "test@gmail.com");
    await clickButton("Send Reset Link");

    await waitFor(() => {
      const btn = screen.getByRole("button", {
        name: "Sending...",
      });

      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
  });
});
