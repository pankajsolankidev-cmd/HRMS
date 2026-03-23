import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeaveForm from "../../pages/Leave/LeaveFormTemplate";

vi.mock("@/components/form/Select", () => ({
  default: ({ label, onChange, error, hint, value }: any) => (
    <div data-testid={`select-${label}`}>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${label}`}
      >
        <option value="">Select</option>
        <option value="sick">Sick</option>
        <option value="full_day">Full Day</option>
        <option value="multiple_days">Multiple Days</option>
        <option value="first_half">First Half</option>
        <option value="emp1">Emp 1</option>
      </select>
      {error && <span role="alert">{hint}</span>}
    </div>
  ),
}));

vi.mock("@/components/form/date-picker", () => ({
  default: ({ label, onChange, error, hint }: any) => (
    <div data-testid={`datepicker-${label}`}>
      <input
        type="date"
        onChange={(e) => onChange([new Date(e.target.value)])}
        data-testid={`input-${label}`}
      />
      {error && <span role="alert">{hint}</span>}
    </div>
  ),
}));

vi.mock("@/components/form/input/FileInput", () => ({
  default: ({ onChange }: any) => (
    <input type="file" data-testid="file-input" onChange={onChange} />
  ),
}));

vi.mock("@/components/form/input/InputField", () => ({
  default: ({ label, placeholder, error, hint, ...props }: any) => (
    <div data-testid={`inputfield-${label}`}>
      <input
        placeholder={placeholder}
        data-testid={`input-${label}`}
        {...props}
      />
      {error && <span role="alert">{hint}</span>}
    </div>
  ),
}));

vi.mock("@/components/ui/button/Button", () => ({
  default: ({ children, onClick, type, disabled }: any) => (
    <button onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe("LeaveFormTemplate", () => {
  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    render(<LeaveForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

    expect(screen.getByTestId("select-Leave Type")).toBeInTheDocument();
    expect(screen.getByTestId("select-Day Type")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-From Date")).toBeInTheDocument();
    expect(screen.getByTestId("inputfield-Reason")).toBeInTheDocument();
  });

  it("shows employee select when enabled", () => {
    render(
      <LeaveForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        showEmployeeSelect
        employeeOptions={[{ label: "Emp 1", value: "emp1" }]}
      />,
    );

    expect(screen.getByTestId("select-Employee")).toBeInTheDocument();
  });

  it("calls onBack", () => {
    render(<LeaveForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);
    fireEvent.click(screen.getByText("Back"));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("shows validation errors when empty submit", async () => {
    render(
      <LeaveForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        showEmployeeSelect
      />,
    );

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });

  it("valid submit calls onSubmit", async () => {
    render(<LeaveForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

    fireEvent.change(screen.getByTestId("input-Leave Type"), {
      target: { value: "sick" },
    });

    fireEvent.change(screen.getByTestId("input-Day Type"), {
      target: { value: "full_day" },
    });

    fireEvent.change(screen.getByTestId("input-From Date"), {
      target: { value: "2024-01-01" },
    });

    fireEvent.change(screen.getByTestId("input-To Date"), {
      target: { value: "2024-01-02" },
    });

    fireEvent.change(screen.getByTestId("input-Reason"), {
      target: { value: "Test reason" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("handles multiple_days logic", async () => {
    render(<LeaveForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

    fireEvent.change(screen.getByTestId("input-Day Type"), {
      target: { value: "multiple_days" },
    });

    expect(screen.getByTestId("select-From Day Type")).toBeInTheDocument();
    expect(screen.getByTestId("select-To Day Type")).toBeInTheDocument();
  });

  it("handles file input", () => {
    render(<LeaveForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [file] },
    });

    expect(screen.getByTestId("file-input")).toBeInTheDocument();
  });

  it("disables buttons when loading", () => {
    render(
      <LeaveForm onSubmit={mockOnSubmit} onBack={mockOnBack} loading={true} />,
    );

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeDisabled();
  });

  it("validates employee required", async () => {
    render(
      <LeaveForm
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        showEmployeeSelect
      />,
    );

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });

  it("validates date logic (toDate after fromDate)", async () => {
    render(<LeaveForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

    fireEvent.change(screen.getByTestId("input-Day Type"), {
      target: { value: "multiple_days" },
    });

    fireEvent.change(screen.getByTestId("input-From Date"), {
      target: { value: "2024-01-02" },
    });

    fireEvent.change(screen.getByTestId("input-To Date"), {
      target: { value: "2024-01-01" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });
});
