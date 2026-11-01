import { updateEmployeeLeave } from "@/api/patch";
import { addEmployeeLeave } from "@/api/post";
import { screen } from "@testing-library/react";
import { toast } from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeeLeavePage from "../../pages/Leave/EmployeeLeavePage";
import { renderWithProviders } from "../AuthUtils";

let mockParams = { id: "new" };
let mockLocation = { pathname: "/leave-requests/new" };
const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => mockParams,
    useLocation: () => mockLocation,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/api/get", () => ({
  getEmployees: vi.fn().mockResolvedValue({ data: [] }),
  getLeaveById: vi.fn().mockResolvedValue({
    leave: {
      fromDate: "2024-01-01",
      toDate: "2024-01-02",
      type: "sick",
      dayType: "full_day",
      reason: "Test",
      fromHour: 8,
      toHour: 8,
      employeeId: "1",
    },
  }),
  getManualLeaveById: vi.fn().mockResolvedValue({
    leave: {
      fromDate: "2024-01-01",
      toDate: "2024-01-02",
      type: "sick",
      dayType: "full_day",
      reason: "Test",
      fromHour: 8,
      toHour: 8,
    },
    employee: { id: "1" },
  }),
}));

vi.mock("@/api/patch", () => ({
  updateEmployeeLeave: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addEmployeeLeave: vi.fn(),
}));

vi.mock("../../pages/Leave/LeaveFormTemplate", () => ({
  default: (props: any) => (
    <div data-testid="leave-form">
      <button onClick={() => props.onBack()}>Back</button>

      <button
        onClick={() =>
          props.onSubmit({
            employeeId: "1",
            fromDate: "2024-01-01",
            toDate: "2024-01-02",
            type: "sick",
            dayType: "full_day",
            reason: "Test",
            fromHour: 8,
            toHour: 8,
          })
        }
      >
        Submit
      </button>

      <button onClick={() => props.onSubmit({})}>Invalid Submit</button>
    </div>
  ),
}));

describe("EmployeeLeavePage", () => {
  beforeEach(() => {
    mockParams = { id: "new" };
    mockLocation = { pathname: "/leave-requests/new" };
    vi.clearAllMocks();
  });

  it("renders Add Employee Leave page", () => {
    renderWithProviders(<EmployeeLeavePage />);
    expect(screen.getByText("Add Employee Leave")).toBeInTheDocument();
  });

  it("renders Edit Employee Leave page", async () => {
    mockParams = { id: "123" };
    mockLocation = { pathname: "/leave-requests/123" };

    renderWithProviders(<EmployeeLeavePage />);
    expect(await screen.findByText("Edit Employee Leave")).toBeInTheDocument();
  });

  it("renders Manual Edit Leave page", async () => {
    mockParams = { id: "123" };
    mockLocation = { pathname: "/leave-requests/manual/123" };

    renderWithProviders(<EmployeeLeavePage />);
    expect(await screen.findByText("Edit Employee Leave")).toBeInTheDocument();
  });

  it("submits form in add mode (success)", async () => {
    renderWithProviders(<EmployeeLeavePage />);

    screen.getByText("Submit").click();

    await vi.waitFor(() => {
      expect(addEmployeeLeave).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Employee leave added");
      expect(mockNavigate).toHaveBeenCalledWith("/leave-requests");
    });
  });

  it("shows error toast when employeeId missing", async () => {
    renderWithProviders(<EmployeeLeavePage />);

    screen.getByText("Invalid Submit").click();

    expect(toast.error).toHaveBeenCalledWith("Please select an employee");
  });

  it("handles update mode submit", async () => {
    mockParams = { id: "123" };
    mockLocation = { pathname: "/leave-requests/123" };

    renderWithProviders(<EmployeeLeavePage />);

    screen.getByText("Submit").click();

    await vi.waitFor(() => {
      expect(updateEmployeeLeave).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Employee leave updated");
    });
  });

  it("calls navigate on back button", () => {
    renderWithProviders(<EmployeeLeavePage />);

    screen.getByText("Back").click();

    expect(mockNavigate).toHaveBeenCalledWith("/leave-requests");
  });
});
