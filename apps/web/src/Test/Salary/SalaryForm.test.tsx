import { fireEvent, screen, waitFor } from "@testing-library/react";
import * as reactRouter from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SalaryForm from "@/pages/Salary/SalaryForm";

import { getEmployees, getSalaryStructureById } from "@/api/get";
import { updateSalaryStructure } from "@/api/patch";
import { addSalaryStructure } from "@/api/post";
import userEvent from "@testing-library/user-event";
import { clickButton, renderWithProviders } from "../AuthUtils";

vi.mock("@/api/get", () => ({
  getEmployees: vi.fn(),
  getSalaryStructureById: vi.fn(),
}));

vi.mock("@/api/post", () => ({
  addSalaryStructure: vi.fn(),
}));

vi.mock("@/api/patch", () => ({
  updateSalaryStructure: vi.fn(),
}));

vi.mock("@/components/form/date-picker", () => ({
  default: ({ onChange }: any) => (
    <input
      data-testid="date-picker"
      onChange={() => onChange([new Date("2024-01-01")])}
    />
  ),
}));

const mockNavigate = vi.fn();
vi.spyOn(reactRouter, "useNavigate").mockReturnValue(mockNavigate);

describe("SalaryForm with utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getEmployees as any).mockResolvedValue({
      data: [{ id: 1, firstName: "John", lastName: "Doe" }],
    });
  });

  it("renders add form", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    renderWithProviders(<SalaryForm />);

    expect(await screen.findByText("Add Salary")).toBeInTheDocument();
  });

  it("shows validation errors", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    renderWithProviders(<SalaryForm />);

    await clickButton("Save");

    expect(
      await screen.findByText(/Employee is required/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Basic salary must be greater than 0/i),
    ).toBeInTheDocument();
  });

  it("submits form in add mode", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    (addSalaryStructure as any).mockResolvedValue({
      message: "Salary added successfully",
    });

    renderWithProviders(<SalaryForm />);

    const inputs = screen.getAllByPlaceholderText("0");

    await userEvent.type(inputs[0], "20000");
    await userEvent.type(inputs[1], "1000");
    await userEvent.type(inputs[2], "500");

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    const dateInput = screen.getByTestId("date-picker");
    fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

    await clickButton("Save");

    await waitFor(() => {
      expect(addSalaryStructure).toHaveBeenCalled();
    });
  });

  it("loads edit data", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "1" });

    (getSalaryStructureById as any).mockResolvedValue({
      employeeId: 1,
      basicSalary: 10000,
      tax: 500,
      pf: 300,
      description: "Test",
      appraisalDate: "2024-01-01T00:00:00.000Z",
    });

    renderWithProviders(<SalaryForm />);

    expect(await screen.findByDisplayValue("10000")).toBeInTheDocument();
  });

  it("updates salary in edit mode", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "1" });

    (getSalaryStructureById as any).mockResolvedValue({
      employeeId: 1,
      basicSalary: 10000,
      tax: 500,
      pf: 300,
      description: "",
      appraisalDate: "2024-01-01T00:00:00.000Z",
    });

    (updateSalaryStructure as any).mockResolvedValue({
      message: "updated",
    });

    renderWithProviders(<SalaryForm />);

    const input = await screen.findByDisplayValue("10000");

    fireEvent.change(input, { target: { value: "15000" } });

    await clickButton("Update");

    await waitFor(() => {
      expect(updateSalaryStructure).toHaveBeenCalled();
    });
  });

  it("navigates back", async () => {
    vi.spyOn(reactRouter, "useParams").mockReturnValue({ id: "new" });

    renderWithProviders(<SalaryForm />);

    await clickButton("Back");

    expect(mockNavigate).toHaveBeenCalledWith("/salary");
  });
});
