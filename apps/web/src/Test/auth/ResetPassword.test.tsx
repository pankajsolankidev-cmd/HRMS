import { resetPassword } from "@/api/post";
import ResetPassword from "@/pages/auth/ResetPassword";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clickButton,
  mockPending,
  renderWithProviders,
  typeInput,
} from "../AuthUtils";

vi.mock("@/api/post", () => ({
  resetPassword: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: "test-token" }),
  };
});

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form correctly", () => {
    renderWithProviders(<ResetPassword />);

    expect(
      screen.getByRole("heading", { name: "Reset Password" }),
    ).toBeInTheDocument();
  });

  it("shows validation error for mismatch password", async () => {
    renderWithProviders(<ResetPassword />);

    await typeInput("Enter new password", "123456");
    await typeInput("Confirm new password", "654321");

    clickButton("Reset Password");

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("calls API on valid submit", async () => {
    (resetPassword as any).mockResolvedValue({
      message: "Success",
    });

    renderWithProviders(<ResetPassword />);

    await typeInput("Enter new password", "123456");
    await typeInput("Confirm new password", "123456");

    clickButton("Reset Password");

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        key: "test-token",
        newPassword: "123456",
      });

      expect(mockNavigate).toHaveBeenCalledWith("/signin", {
        replace: true,
      });
    });
  });

  it("handles API error", async () => {
    (resetPassword as any).mockRejectedValue({
      response: {
        data: { message: "Error" },
      },
    });

    renderWithProviders(<ResetPassword />);

    await typeInput("Enter new password", "123456");
    await typeInput("Confirm new password", "123456");

    clickButton("Reset Password");

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalled();
    });
  });

  it("toggles password visibility", async () => {
    renderWithProviders(<ResetPassword />);

    const passwordInput = screen.getByPlaceholderText(
      "Enter new password",
    ) as HTMLInputElement;

    expect(passwordInput.type).toBe("password");

    const toggleBtn = document.querySelector(
      "span.cursor-pointer",
    ) as HTMLElement;

    await userEvent.click(toggleBtn);

    await waitFor(() => {
      expect(passwordInput.type).toBe("text");
    });
  });

  it("shows loading state while resetting password", async () => {
    mockPending(resetPassword);

    renderWithProviders(<ResetPassword />);

    await typeInput("Enter new password", "123456");
    await typeInput("Confirm new password", "123456");

    clickButton("Reset Password");

    await waitFor(() => {
      const btn = screen.getByRole("button", {
        name: "Resetting...",
      });

      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
  });
});
