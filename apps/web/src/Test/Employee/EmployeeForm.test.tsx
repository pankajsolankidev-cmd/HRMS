import { fireEvent, screen, waitFor } from "@testing-library/react";
import * as reactRouter from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EmployeeForm from "@/pages/Employee/EmployeeForm";

import {
  getDepartments,
  getEmployeeById,
  getEmployees,
  getPositions,
  getSystems,
} from "@/api/get";
import { addEmployee } from "@/api/post";
import { updateEmployee } from "@/api/put";

import userEvent from "@testing-library/user-event";
import { clickButton, renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getDepartments: vi.fn(),
  getEmployeeById: vi.fn(),
  getEmployees: vi.fn(),
  getPositions: vi.fn(),
  getSystems: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addEmployee: vi.fn(),
}));

vi.mock("@/api/put", () => ({
  updateEmployee: vi.fn(),
}));

vi.mock("@/components/form/date-picker", () => ({
  default: ({ onChange }: any) => (
    <input
      data-testid="date-picker"
      onChange={() => onChange([new Date("2024-01-01")])}
    />
  ),
}));
vi.mock("@/components/form/Select", () => ({
  default: ({ value, onChange, options = [], label }: any) => (
    <select
      data-testid={`select-${label}`}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

const mockNavigate = vi.fn();
vi.spyOn(reactRouter, "useNavigate").mockReturnValue(mockNavigate);

const mockPositions = [{ id: 1, name: "Developer" }];
const mockDepartments = { data: [{ id: 1, name: "IT" }] };
const mockSystems = { data: [{ id: 1, name: "Laptop" }] };
const mockEmployees = {
  data: [{ id: 2, firstName: "Jane", lastName: "Smith" }],
};

describe("EmployeeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getPositions as any).mockResolvedValue(mockPositions);
    (getDepartments as any).mockResolvedValue(mockDepartments);
    (getSystems as any).mockResolvedValue(mockSystems);
    (getEmployees as any).mockResolvedValue(mockEmployees);
  });

  it("renders add employee form", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    renderWithProviders(<EmployeeForm />);

    expect(await screen.findByText("Add Employee")).toBeInTheDocument();
  });

  it("shows validation errors", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    renderWithProviders(<EmployeeForm />);

    await clickButton("Save");

    expect(
      await screen.findByText(/First name is required/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
  });

  it("submits form in add mode", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    (addEmployee as any).mockResolvedValue({
      message: "Employee added successfully",
    });

    renderWithProviders(<EmployeeForm />);

    await userEvent.type(
      screen.getByPlaceholderText(/Enter first name/i),
      "John",
    );

    await userEvent.type(
      screen.getByPlaceholderText(/Enter last name/i),
      "Doe",
    );

    await userEvent.type(
      screen.getByPlaceholderText(/Enter email/i),
      "john@test.com",
    );

    await userEvent.selectOptions(screen.getByTestId("select-Position"), "1");

    await userEvent.selectOptions(screen.getByTestId("select-Department"), "1");

    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2024-01-01" },
    });

    await userEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => {
      expect(addEmployee).toHaveBeenCalled();
    });
  });

  it("loads edit data", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "1" });

    (getEmployeeById as any).mockResolvedValue({
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
      joiningDate: "2024-01-01",
      position: { id: "1" },
    });

    renderWithProviders(<EmployeeForm />);

    expect(await screen.findByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
  });

  it("updates employee", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "1" });

    (getEmployeeById as any).mockResolvedValue({
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
      joiningDate: "2024-01-01",
      position: { id: "1" },
    });

    (updateEmployee as any).mockResolvedValue({
      message: "updated",
    });

    renderWithProviders(<EmployeeForm />);

    const input = await screen.findByDisplayValue("John");

    fireEvent.change(input, { target: { value: "Updated" } });

    await clickButton("Update");

    await waitFor(() => {
      expect(updateEmployee).toHaveBeenCalled();
    });
  });

  it("navigates back", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    renderWithProviders(<EmployeeForm />);

    await clickButton("Back");

    expect(mockNavigate).toHaveBeenCalledWith("/employees");
  });
});
