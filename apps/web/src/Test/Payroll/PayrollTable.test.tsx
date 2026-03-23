import {
  getEmployeePayrollHistory,
  getPayrollPreview,
  getPayrollSummary,
} from "@/api/get";
import { processBulkPayroll } from "@/api/post";
import PayrollTable from "@/pages/Payroll/PayrollTable";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getPayrollSummary: vi.fn(),
  getPayrollPreview: vi.fn(),
  getEmployeePayrollHistory: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  processBulkPayroll: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PayrollTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEmployees = {
    data: [
      {
        employeeId: "1",
        firstName: "John",
        lastName: "Doe",
        tax: 100,
        pf: 50,
        bonus: 200,
        deductions: 20,
        salaryNet: 1000,
        isSalaryProcessed: false,
      },
    ],
  };

  it("should render payroll summary after process", async () => {
    (getPayrollSummary as any).mockResolvedValue({
      employeesProcessed: 5,
      avgSalary: 20000,
      netPayroll: 100000,
    });

    renderWithProviders(<PayrollTable />);

    const btn = await screen.findByText("Process Payroll");
    await userEvent.click(btn);

    await waitFor(() => {
      expect(getPayrollSummary).toHaveBeenCalled();
    });
  });

  it("should load payroll preview data", async () => {
    (getPayrollPreview as any).mockResolvedValue(mockEmployees);

    renderWithProviders(<PayrollTable />);

    const loadBtn = await screen.findByText("Load");
    await userEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("should select employee checkbox", async () => {
    (getPayrollPreview as any).mockResolvedValue(mockEmployees);

    renderWithProviders(<PayrollTable />);

    const loadBtn = await screen.findByText("Load");
    await userEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox")[1];
    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("should open edit drawer and save", async () => {
    (getPayrollPreview as any).mockResolvedValue(mockEmployees);

    renderWithProviders(<PayrollTable />);

    const loadBtn = await screen.findByText("Load");
    await userEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editIcon = document.querySelector(".text-blue-600") as HTMLElement;
    await userEvent.click(editIcon);

    const saveBtn = await screen.findByText("Save");
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Edit/i)).not.toBeInTheDocument();
    });
  });

  it("should open history drawer", async () => {
    (getPayrollPreview as any).mockResolvedValue(mockEmployees);
    (getEmployeePayrollHistory as any).mockResolvedValue({
      data: [],
    });

    renderWithProviders(<PayrollTable />);

    const loadBtn = await screen.findByText("Load");
    await userEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const historyIcon = document.querySelector(
      ".text-purple-600",
    ) as HTMLElement;
    await userEvent.click(historyIcon);

    const elements = await screen.findAllByText(/Payroll History/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("should process bulk payroll successfully", async () => {
    (getPayrollPreview as any).mockResolvedValue(mockEmployees);

    (processBulkPayroll as any).mockResolvedValue({
      message: "Processed",
    });

    renderWithProviders(<PayrollTable />);

    const loadBtn = await screen.findByText("Load");
    await userEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox")[1];
    await userEvent.click(checkbox);

    const confirmBtn = await screen.findByText("Confirm & Process");
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(processBulkPayroll).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should handle bulk payroll error", async () => {
    (getPayrollPreview as any).mockResolvedValue(mockEmployees);

    (processBulkPayroll as any).mockRejectedValue({
      response: {
        data: {
          message: "Error",
          employees: ["John"],
        },
      },
    });

    renderWithProviders(<PayrollTable />);

    const loadBtn = await screen.findByText("Load");
    await userEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox")[1];
    await userEvent.click(checkbox);

    const confirmBtn = await screen.findByText("Confirm & Process");
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("should clear summary filters", async () => {
    renderWithProviders(<PayrollTable />);

    const clearBtn = await screen.findByText("Clear");
    await userEvent.click(clearBtn);

    await waitFor(() => {
      expect(clearBtn).toBeInTheDocument();
    });
  });

  it("should cancel selected employees", async () => {
    (getPayrollPreview as any).mockResolvedValue(mockEmployees);

    renderWithProviders(<PayrollTable />);

    const loadBtn = await screen.findByText("Load");
    await userEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox")[1];
    await userEvent.click(checkbox);

    const cancelBtn = await screen.findByText("Cancel");
    await userEvent.click(cancelBtn);

    expect(screen.getAllByRole("checkbox")[1]).not.toBeChecked();
  });
});
