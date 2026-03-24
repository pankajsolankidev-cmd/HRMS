import { getEmployeePayrollHistory } from "@/api/get";
import PayrollHistory from "@/pages/Payroll/PayrollHistory";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getEmployeePayrollHistory: vi.fn(),
}));

const mockUseSelector = vi.fn();

vi.mock("react-redux", () => ({
  useSelector: (fn: any) =>
    fn({
      auth: {
        roles: mockUseSelector(),
      },
    }),
}));
vi.mock("@/components/common/PageMeta", () => ({
  default: () => null,
}));
describe("PayrollHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    data: [
      {
        payroll: {
          month: "JANUARY",
          year: 2024,
          leaveDeduction: 100,
          bonus: 200,
          deductions: 50,
          netSalary: 1000,
        },
        employee: {
          firstName: "John",
          lastName: "Doe",
        },
      },
    ],
    meta: { total: 1 },
  };

  it("should render payroll history data", async () => {
    mockUseSelector.mockReturnValue(["ADMIN"]);
    (getEmployeePayrollHistory as any).mockResolvedValue(mockData);

    renderWithProviders(<PayrollHistory />);

    await waitFor(() => {
      expect(screen.getByText("JANUARY")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.getByText(/₹ 1,000/)).toBeInTheDocument();
    });
  });

  it("should show employee name for admin", async () => {
    mockUseSelector.mockReturnValue(["ADMIN"]);
    (getEmployeePayrollHistory as any).mockResolvedValue(mockData);

    renderWithProviders(<PayrollHistory />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("should hide employee name for employee role", async () => {
    mockUseSelector.mockReturnValue(["EMPLOYEE"]);
    (getEmployeePayrollHistory as any).mockResolvedValue(mockData);

    renderWithProviders(<PayrollHistory />);

    await waitFor(() => {
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  it("should handle empty data", async () => {
    mockUseSelector.mockReturnValue(["ADMIN"]);
    (getEmployeePayrollHistory as any).mockResolvedValue({
      data: [],
      meta: { total: 0 },
    });

    renderWithProviders(<PayrollHistory />);

    await waitFor(() => {
      expect(screen.queryByText("JANUARY")).not.toBeInTheDocument();
    });
  });

  it("should handle error state", async () => {
    mockUseSelector.mockReturnValue(["ADMIN"]);
    (getEmployeePayrollHistory as any).mockRejectedValue(new Error("Error"));

    renderWithProviders(<PayrollHistory />);

    await waitFor(() => {
      expect(getEmployeePayrollHistory).toHaveBeenCalled();
    });
  });

  it("should change limit and reset page", async () => {
    mockUseSelector.mockReturnValue(["ADMIN"]);
    (getEmployeePayrollHistory as any).mockResolvedValue(mockData);

    renderWithProviders(<PayrollHistory />);

    const select = await screen.findByRole("combobox");

    await userEvent.selectOptions(select, "50");

    await waitFor(() => {
      expect(getEmployeePayrollHistory).toHaveBeenCalled();
    });
  });
});
