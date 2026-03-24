import { getLeaveById } from "@/api/get";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SelfLeavePage from "../../pages/Leave/SelfLeavePage";
import { renderWithProviders } from "../AuthUtils";

const mockNavigate = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockAddLeave = vi.fn();
const mockUpdateLeave = vi.fn();
const mockUseParams = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/api/get", () => ({
  getLeaveById: vi.fn(),
}));

vi.mock("@/api/patch", () => ({
  updateLeave: (...args: any[]) => mockUpdateLeave(...args),
}));

vi.mock("@/api/post", () => ({
  addLeave: (...args: any[]) => mockAddLeave(...args),
}));

vi.mock("../../pages/Leave/LeaveFormTemplate", () => ({
  default: ({ onSubmit, onBack }: any) => (
    <>
      <button
        data-testid="submit-btn"
        onClick={() =>
          onSubmit({
            fromDate: "2024-01-01",
            toDate: "2024-01-02",
            type: "sick",
            dayType: "full_day",
            reason: "Test",
          })
        }
      >
        Submit
      </button>
      <button data-testid="back-btn" onClick={onBack}>
        Back
      </button>
    </>
  ),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

describe("SelfLeavePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: "new" });
  });

  it("renders Apply Leave page", () => {
    renderWithProviders(<SelfLeavePage />);
    expect(screen.getByText("Apply Leave")).toBeInTheDocument();
    expect(screen.getByTestId("submit-btn")).toBeInTheDocument();
  });

  it("submits form → calls API, toast and navigate", async () => {
    mockAddLeave.mockResolvedValue({});
    renderWithProviders(<SelfLeavePage />);
    await userEvent.click(screen.getByTestId("submit-btn"));
    await waitFor(() => {
      expect(mockAddLeave).toHaveBeenCalled();
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Leave applied successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/leave-requests");
  });

  it("shows error toast on add failure", async () => {
    mockAddLeave.mockRejectedValue({
      response: { data: { message: "API Error" } },
    });
    renderWithProviders(<SelfLeavePage />);
    await userEvent.click(screen.getByTestId("submit-btn"));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("API Error");
    });
  });

  it("updates leave → toast + navigate", async () => {
    mockUseParams.mockReturnValue({ id: "123" });
    mockUpdateLeave.mockResolvedValue({});
    renderWithProviders(<SelfLeavePage />);
    await userEvent.click(screen.getByTestId("submit-btn"));
    await waitFor(() => {
      expect(mockUpdateLeave).toHaveBeenCalled();
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Leave updated successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/leave-requests");
  });

  it("shows error toast on update failure", async () => {
    mockUseParams.mockReturnValue({ id: "123" });
    mockUpdateLeave.mockRejectedValue({
      response: { data: { message: "Update Error" } },
    });
    renderWithProviders(<SelfLeavePage />);
    await userEvent.click(screen.getByTestId("submit-btn"));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Update Error");
    });
  });

  it("shows error toast when fetch fails", async () => {
    mockUseParams.mockReturnValue({ id: "123" });
    (getLeaveById as any).mockRejectedValue(new Error("fail"));
    renderWithProviders(<SelfLeavePage />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to load leave data");
    });
  });

  it("navigates on back click", async () => {
    renderWithProviders(<SelfLeavePage />);
    await userEvent.click(screen.getByTestId("back-btn"));
    expect(mockNavigate).toHaveBeenCalledWith("/leave-requests");
  });
});
